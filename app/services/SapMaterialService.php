<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 07/09/2026
 * DESCRIPTION : SAP Material hub — ZI_MaterialAPI_HUB CDS
 */
require_once base_path('app/core/SapODataClient.php');

class SapMaterialService
{
    private SapODataClient $client;
    private array $cfg;

    public function __construct(?SapODataClient $client = null)
    {
        $this->cfg = config('sap');
        $matCfg = $this->cfg;
        $matCfg['service'] = (string) ($this->cfg['material_service']
            ?? '/sap/opu/odata/sap/ZI_MATERIALAPI_HUB_CDS/ZI_MaterialAPI_HUB');
        $matCfg['max_rows'] = max(500, (int) ($this->cfg['material_max_rows'] ?? 4000));
        $matCfg['page_size'] = max(100, (int) ($this->cfg['material_page_size'] ?? 500));
        $this->client = $client ?? new SapODataClient($matCfg);
    }

    /**
     * Lightweight page shell context.
     *
     * @return array{data_source: string, sap_error: ?string, sap_rows: int}
     */
    public function pageContext(): array
    {
        return [
            'data_source' => !empty($this->cfg['enabled']) ? 'sap' : 'static',
            'sap_error'   => null,
            'sap_rows'    => 0,
        ];
    }

    /**
     * Paginated material master lines for the Material dashboard API.
     */
    public function paginatedRecords(int $page, int $perPage, string $search = '', string $from = '', string $to = ''): array
    {
        @ini_set('memory_limit', '512M');
        @set_time_limit(45);

        $sapError = null;
        $records = [];

        if ($from === '' && $to === '') {
            $to = date('Y-m-d');
            $from = date('Y-m-d', strtotime($to . ' -30 days'));
        } elseif ($from === '' && $to !== '') {
            $from = date('Y-m-d', strtotime($to . ' -30 days'));
        } elseif ($from !== '' && $to === '') {
            $to = date('Y-m-d', strtotime($from . ' +30 days'));
        }

        $fetched = $this->fetchRecordsForRange($from, $to);
        $records = $fetched['records'];
        $sapError = $fetched['error'];

        $filtered = $this->filterRecords($records, $search, '', '');
        unset($records);

        $total = count($filtered);
        $pages = max(1, (int) ceil($total / max(1, $perPage)));
        $page = min(max(1, $page), $pages);
        $offset = ($page - 1) * $perPage;
        $slice = array_slice($filtered, $offset, $perPage);

        $summary = $this->buildSummary($filtered);
        $result = [
            'records'  => $slice,
            'total'    => $total,
            'page'     => $page,
            'pages'    => $pages,
            'per_page' => $perPage,
            'summary'  => $summary,
            'charts'   => $this->buildCharts($filtered),
            'cache'    => 'live',
            'source'   => 'ZI_MaterialAPI_HUB',
        ];

        if ($total === 0 && !empty($sapError)) {
            $result['error'] = $sapError;
        }

        return $result;
    }

    /**
     * @param array<int, array> $rows
     * @return array<string, float|int>
     */
    private function buildSummary(array $rows): array
    {
        $products = [];
        $plants = [];
        $types = [];
        $groups = [];
        $brands = [];
        $locations = [];
        $batch = 0;
        $deleted = 0;

        foreach ($rows as $r) {
            $product = (string) ($r['product'] ?? '');
            if ($product !== '') {
                $products[$product] = true;
            }
            $plant = (string) ($r['plant'] ?? '');
            if ($plant !== '' && $plant !== '—') {
                $plants[$plant] = true;
            }
            $type = (string) ($r['product_type'] ?? '');
            if ($type !== '' && $type !== '—') {
                $types[$type] = true;
            }
            $group = (string) ($r['product_group'] ?? '');
            if ($group !== '' && $group !== '—') {
                $groups[$group] = true;
            }
            $brand = (string) ($r['brand'] ?? '');
            if ($brand !== '' && $brand !== '—') {
                $brands[$brand] = true;
            }
            $loc = (string) ($r['storage_location'] ?? '');
            if ($loc !== '' && $loc !== '—') {
                $locations[$loc] = true;
            }
            if (!empty($r['batch_managed'])) {
                $batch++;
            }
            if (!empty($r['is_deleted'])) {
                $deleted++;
            }
        }

        $lineCount = count($rows);

        return [
            'products'       => count($products),
            'lines'          => $lineCount,
            'plants'         => count($plants),
            'product_types'  => count($types),
            'product_groups' => count($groups),
            'brands'         => count($brands),
            'locations'      => count($locations),
            'batch_rate'     => $lineCount > 0 ? round(($batch / $lineCount) * 100, 1) : 0,
            'active_rate'    => $lineCount > 0 ? round((($lineCount - $deleted) / $lineCount) * 100, 1) : 0,
        ];
    }

    /**
     * @param array<int, array> $filtered
     */
    private function buildCharts(array $filtered): array
    {
        $byDate = [];
        $byPlant = [];
        $byType = [];
        $byGroup = [];
        $byBrand = [];
        $byDivision = [];
        $byStatus = [];

        foreach ($filtered as $r) {
            $dateKey = !empty($r['date_iso']) ? $r['date_iso'] : 'N/A';
            $byDate[$dateKey] = ($byDate[$dateKey] ?? 0) + 1;

            $plant = (string) ($r['plant'] ?? '—');
            $byPlant[$plant] = ($byPlant[$plant] ?? 0) + 1;

            $type = (string) ($r['product_type'] ?? '—');
            $byType[$type] = ($byType[$type] ?? 0) + 1;

            $group = (string) ($r['product_group'] ?? '—');
            if (strlen($group) > 18) {
                $group = substr($group, 0, 16) . '…';
            }
            $byGroup[$group] = ($byGroup[$group] ?? 0) + 1;

            $brand = (string) ($r['brand'] ?? '—');
            $byBrand[$brand] = ($byBrand[$brand] ?? 0) + 1;

            $div = (string) ($r['division_label'] ?? $r['division'] ?? '—');
            $byDivision[$div] = ($byDivision[$div] ?? 0) + 1;

            $st = (string) ($r['status'] ?? 'Open');
            $byStatus[$st] = ($byStatus[$st] ?? 0) + 1;
        }

        ksort($byDate);
        arsort($byPlant);
        arsort($byType);
        arsort($byGroup);
        arsort($byBrand);
        arsort($byDivision);
        arsort($byStatus);

        $dateKeys = array_keys($byDate);
        if (count($dateKeys) > 31) {
            $dateKeys = array_slice($dateKeys, -31);
        }
        $trendLabels = [];
        $trendValues = [];
        foreach ($dateKeys as $key) {
            $trendLabels[] = $key === 'N/A' ? 'N/A' : date('d M', strtotime($key));
            $trendValues[] = (int) $byDate[$key];
        }

        $topGroups = array_slice($byGroup, 0, 8, true);
        $topBrands = array_slice($byBrand, 0, 8, true);

        return [
            'trend' => [
                'labels' => $trendLabels,
                'values' => $trendValues,
            ],
            'plants' => $this->series($byPlant, 8),
            'types' => $this->series($byType, 8),
            'groups' => [
                'labels' => array_keys($topGroups),
                'values' => array_map('intval', array_values($topGroups)),
            ],
            'brands' => [
                'labels' => array_keys($topBrands),
                'values' => array_map('intval', array_values($topBrands)),
            ],
            'divisions' => $this->series($byDivision, 8),
            'statuses' => $this->series($byStatus, 8),
            // aliases used by existing material.js chart wiring
            'top_styles' => [
                'labels' => array_keys($topGroups),
                'values' => array_map('intval', array_values($topGroups)),
            ],
            'mix' => $this->series($byPlant, 6),
        ];
    }

    /**
     * @param array<string, int|float> $map
     * @return array{labels: list<string>, values: list<int>}
     */
    private function series(array $map, int $limit): array
    {
        $slice = array_slice($map, 0, $limit, true);
        return [
            'labels' => array_keys($slice),
            'values' => array_map(static fn($v) => (int) $v, array_values($slice)),
        ];
    }

    /**
     * @return array{records: array<int, array>, error: ?string, cache: string}
     */
    private function loadOrFetchRange(string $from, string $to): array
    {
        $fetched = $this->fetchRecordsForRange($from, $to);

        return [
            'records' => $fetched['records'],
            'error'   => $fetched['error'],
            'cache'   => 'live',
        ];
    }

    /**
     * @return array{records: array<int, array>, error: ?string}
     */
    private function fetchRecordsForRange(string $from, string $to): array
    {
        $records = [];
        $filter = sprintf(
            "CreationDate ge datetime'%sT00:00:00' and CreationDate le datetime'%sT23:59:59'",
            $from,
            $to
        );

        $result = $this->client->eachPage(function (array $batch) use (&$records): void {
            foreach ($batch as $row) {
                if (is_array($row)) {
                    $mapped = $this->mapRow($row);
                    if ($mapped !== null) {
                        $records[] = $mapped;
                    }
                }
            }
        }, [
            '$filter' => $filter,
            '$select' => $this->odataSelect(),
        ]);

        return [
            'records' => $records,
            'error'   => $records === [] ? ($result['error'] ?? null) : null,
        ];
    }

    private function odataSelect(): string
    {
        return implode(',', [
            'Product',
            'ProductType',
            'ProductGroup',
            'ProductName',
            'Plant',
            'StorageLocation',
            'Brand',
            'Division',
            'CreationDate',
            'LastChangeDate',
            'ProductValidStartDate',
            'ProductValidEndDate',
            'IsBatchManagementRequired',
            'IsMarkedForDeletion',
            'MaintenanceStatus',
        ]);
    }

    /**
     * @return array{error: ?string, row_count: int}
     */
    private function syncFromSap(string $from = '', string $to = ''): array
    {
        $records = [];
        $extra = [
            '$select' => $this->odataSelect(),
        ];
        if ($this->isNarrowRange($from, $to)) {
            $extra['$filter'] = sprintf(
                "CreationDate ge datetime'%sT00:00:00' and CreationDate le datetime'%sT23:59:59'",
                $from,
                $to
            );
        }

        $result = $this->client->eachPage(function (array $batch) use (&$records): void {
            foreach ($batch as $row) {
                if (is_array($row)) {
                    $mapped = $this->mapRow($row);
                    if ($mapped !== null) {
                        $records[] = $mapped;
                    }
                }
            }
        }, $extra);

        return [
            'error'     => $records === [] ? ($result['error'] ?? null) : null,
            'row_count' => count($records),
        ];
    }

    private function mapRow(array $row): ?array
    {
        $product = trim((string) $this->field($row, ['Product'], ''));
        if ($product === '') {
            return null;
        }

        $division = (string) $this->field($row, ['Division'], '');
        $labels = $this->cfg['division_labels'] ?? [];
        $divisionLabel = $labels[$division] ?? ($division !== '' ? 'Division ' . $division : '—');

        $deleted = (bool) $this->field($row, ['IsMarkedForDeletion'], false);
        $maint = (string) $this->field($row, ['MaintenanceStatus'], '');
        $status = $deleted ? 'Deleted' : ($maint !== '' ? $maint : 'Active');

        $created = $this->parseDate($this->field($row, ['CreationDate'], null));
        $changed = $this->parseDate($this->field($row, ['LastChangeDate'], null));
        $validFrom = $this->parseDate($this->field($row, ['ProductValidStartDate'], null));
        $validTo = $this->parseDate($this->field($row, ['ProductValidEndDate'], null));

        $plant = (string) $this->field($row, ['Plant'], '');
        $name = (string) $this->field($row, ['ProductName'], '');
        if ($name === '') {
            $name = $product;
        }

        return [
            'id'                 => $product . '|' . $plant . '|' . (string) $this->field($row, ['StorageLocation'], ''),
            'product'            => $product,
            'product_name'       => $name,
            'product_external'   => (string) $this->field($row, ['ProductExternalID'], '') ?: '—',
            'product_type'       => (string) $this->field($row, ['ProductType'], '') ?: '—',
            'product_group'      => (string) $this->field($row, ['ProductGroup'], '') ?: '—',
            'product_category'   => (string) $this->field($row, ['ProductCategory'], '') ?: '—',
            'plant'              => $plant !== '' ? $plant : '—',
            'storage_location'   => (string) $this->field($row, ['StorageLocation'], '') ?: '—',
            'storage_bin'        => (string) $this->field($row, ['WarehouseStorageBin'], '') ?: '—',
            'division'           => $division !== '' ? $division : '—',
            'division_label'     => $divisionLabel,
            'brand'              => (string) $this->field($row, ['Brand'], '') ?: '—',
            'base_unit'          => (string) $this->field($row, ['BaseUnit'], '') ?: '—',
            'gross_weight'       => (float) $this->field($row, ['GrossWeight'], 0),
            'net_weight'         => (float) $this->field($row, ['NetWeight'], 0),
            'weight_unit'        => (string) $this->field($row, ['WeightUnit'], '') ?: '—',
            'country_of_origin'  => (string) $this->field($row, ['CountryOfOrigin'], '') ?: '—',
            'basic_material'     => (string) $this->field($row, ['BasicMaterial'], '') ?: '—',
            'manufacturer'       => (string) $this->field($row, ['ManufacturerNumber', 'ProductManufacturerNumber'], '') ?: '—',
            'batch_managed'      => (bool) $this->field($row, ['IsBatchManagementRequired'], false),
            'is_deleted'         => $deleted,
            'maintenance_status' => $maint !== '' ? $maint : '—',
            'sales_status'       => (string) $this->field($row, ['SalesStatus'], '') ?: '—',
            'cross_plant_status' => (string) $this->field($row, ['CrossPlantStatus'], '') ?: '—',
            'status'             => $status,
            'date'               => $created ? $created->format('d M Y') : '—',
            'date_iso'           => $created ? $created->format('Y-m-d') : '',
            'changed_date'       => $changed ? $changed->format('d M Y') : '—',
            'valid_from'         => $validFrom ? $validFrom->format('d M Y') : '—',
            'valid_to'           => $validTo ? $validTo->format('d M Y') : '—',
            // keep aliases so older UI bits don't blank out
            'material'           => $product,
            'material_group'     => (string) $this->field($row, ['ProductGroup'], '') ?: '—',
            'sales_order'        => '—',
            'qty'                => 1,
            'cost'               => 0,
            'net_amount'         => 0,
        ];
    }

    private function field(array $row, array $keys, $default = null)
    {
        $norm = [];
        foreach ($row as $k => $v) {
            $norm[strtolower((string) $k)] = $v;
        }
        foreach ($keys as $key) {
            $lk = strtolower((string) $key);
            if (array_key_exists($lk, $norm) && $norm[$lk] !== null && $norm[$lk] !== '') {
                return $norm[$lk];
            }
        }

        return $default;
    }

    private function parseDate($value): ?DateTimeImmutable
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_string($value) && preg_match('/\\/Date\\((-?\\d+)\\)\\//', $value, $m)) {
            $ms = (int) $m[1];
            return (new DateTimeImmutable('@' . (int) floor($ms / 1000)))->setTimezone(new DateTimeZone('UTC'));
        }
        try {
            return new DateTimeImmutable((string) $value);
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * @param array<int, array> $records
     * @return array<int, array>
     */
    private function filterRecords(array $records, string $search, string $from, string $to): array
    {
        $search = strtolower(trim($search));

        return array_values(array_filter($records, function (array $r) use ($search, $from, $to) {
            if ($from !== '' && $to !== '' && !empty($r['date_iso'])) {
                if ($r['date_iso'] < $from || $r['date_iso'] > $to) {
                    return false;
                }
            }
            if ($search === '') {
                return true;
            }
            $hay = strtolower(implode(' ', [
                $r['product'] ?? '',
                $r['product_name'] ?? '',
                $r['product_type'] ?? '',
                $r['product_group'] ?? '',
                $r['plant'] ?? '',
                $r['storage_location'] ?? '',
                $r['brand'] ?? '',
                $r['division_label'] ?? '',
                $r['status'] ?? '',
            ]));

            return str_contains($hay, $search);
        }));
    }

    private function isNarrowRange(string $from, string $to): bool
    {
        if ($from === '' || $to === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            return false;
        }
        try {
            $start = new DateTimeImmutable($from);
            $end = new DateTimeImmutable($to);
        } catch (Exception $e) {
            return false;
        }

        return $end >= $start && $start->diff($end)->days <= 31;
    }

    /** Disk/APCu cache disabled — live SAP only. */
    private function loadRecordsCached(bool $allowStaleOnly = false): array
    {
        return [];
    }

    private function writeRecordsCache(array $records): void
    {
    }

    private function storeRecordsMemory(array $records): void
    {
    }

    private function readQueryCache(string $key, int $ttl): ?array
    {
        return null;
    }

    private function writeQueryCache(string $key, array $payload): void
    {
    }

    private function readRangeCache(string $from, string $to, int $ttl): ?array
    {
        return null;
    }

    private function writeRangeCache(string $from, string $to, array $records): void
    {
    }
}
