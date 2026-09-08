<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 03/09/2026
 * DESCRIPTION : Sap Sales Service for the sales dashboard
 */

/*
 * Sap Sales Service class
 */
require_once base_path('app/core/SapODataClient.php');

class SapSalesService
{
    private SapODataClient $client;
    private array $cfg;

    /*
     * Constructor
     */
    public function __construct(?SapODataClient $client = null)
    {
        $this->client = $client ?? new SapODataClient();
        $this->cfg = config('sap');
    }

    /*
     * Build dashboard payload method
     */
    public function buildDashboardPayload(int $year): array
    {
        @ini_set('memory_limit', '512M');

        // Fresh summary first, then stale (never block the HTML shell on a full SAP year pull).
        $summary = $this->readSummaryCache($year, false) ?? $this->readSummaryCache($year, true);
        if ($summary !== null) {
            return [
                'payload'   => $summary,
                'error'     => null,
                'row_count' => (int) ($summary['row_count'] ?? 0),
            ];
        }

        return $this->syncYearFromSap($year);
    }

    /*
     * Paginated records method
     */
    public function paginatedRecords(int $year, int $page, int $perPage, string $search = '', string $from = '', string $to = ''): array
    {
        @ini_set('memory_limit', '512M');

        $queryTtl = (int) ($this->cfg['query_cache_ttl'] ?? 0);
        $queryKey = $this->queryCacheKey($year, $page, $perPage, $search, $from, $to);
        if ($queryTtl > 0) {
            $cached = $this->readQueryCache($queryKey, $queryTtl);
            if ($cached !== null) {
                $cached['cache'] = 'query';
                return $cached;
            }
        }

        $sapError = null;
        $records = [];

        // Today / week / month: query SAP for that window only (avoids decoding the 17MB year file).
        if ($this->isNarrowRange($from, $to)) {
            $range = $this->fetchRecordsForRange($year, $from, $to);
            $records = $range['records'];
            $sapError = $range['error'];
        } else {
            $records = $this->loadRecordsCached($year);
            if ($records === []) {
                $dash = $this->syncYearFromSap($year);
                $sapError = $dash['error'] ?? null;
                $records = $this->loadRecordsCached($year);
            }
        }

        $filtered = $this->filterRecords($records, $search, $from, $to);
        unset($records);

        $total = count($filtered);
        $pages = max(1, (int) ceil($total / $perPage));
        $page = min(max(1, $page), $pages);
        $offset = ($page - 1) * $perPage;
        $slice = array_slice($filtered, $offset, $perPage);

        $net = 0.0;
        $cost = 0.0;
        $qty = 0.0;
        $returnQty = 0.0;
        $orderSet = [];
        foreach ($filtered as $r) {
            $net += (float) ($r['net_amount'] ?? 0);
            $cost += (float) ($r['cost'] ?? 0);
            $lineQty = (float) ($r['qty'] ?? 0);
            $qty += $lineQty;
            if (!empty($r['is_return'])) {
                $returnQty += $lineQty;
            }
            $orderNo = (string) ($r['sales_order'] ?? '');
            if ($orderNo !== '' && $orderNo !== '—') {
                $orderSet[$orderNo] = true;
            }
        }
        $orders = count($orderSet);

        $result = [
            'records'  => $slice,
            'total'    => $total,
            'page'     => $page,
            'pages'    => $pages,
            'per_page' => $perPage,
            'summary'  => [
                'net_sales'    => round($net, 2),
                'cost_amount'  => round($cost, 2),
                'lines'        => $total,
                'orders'       => $orders,
                'avg_line'     => $total > 0 ? round($net / $total, 2) : 0,
                'avg_order'    => $orders > 0 ? round($net / $orders, 2) : 0,
                'total_qty'    => round($qty, 3),
                'return_rate'  => $qty > 0 ? round(($returnQty / $qty) * 100, 2) : 0,
                'gross_margin' => $net > 0 ? round((($net - $cost) / $net) * 100, 2) : 0,
                'materials'    => count(array_unique(array_filter(array_map(
                    static fn($r) => (string) ($r['material'] ?? ''),
                    $filtered
                )))),
            ],
            'charts'   => $this->buildChartsFromRecords($filtered),
            'cache'    => 'live',
        ];

        if ($total === 0 && !empty($sapError)) {
            $result['error'] = $sapError;
        }

        if ($queryTtl > 0 && empty($result['error'])) {
            $this->writeQueryCache($queryKey, $result);
        }

        return $result;
    }

    /*
     * Sync year from SAP method
     */
    private function syncYearFromSap(int $year): array
    {
        $state = $this->createState($year);
        $filter = sprintf(
            "CreationDate ge datetime'%04d-01-01T00:00:00' and CreationDate le datetime'%04d-12-31T23:59:59'",
            $year,
            $year
        );

        $result = $this->client->eachPage(function (array $batch) use (&$state, $year): void {
            foreach ($batch as $row) {
                if (is_array($row)) {
                    $this->ingestRow($row, $state, $year);
                }
            }
        }, ['$filter' => $filter]);

        if ($state['row_count'] === 0) {
            return [
                'payload'   => [],
                'error'     => $result['error'],
                'row_count' => 0,
            ];
        }

        $payload = $this->finalizeState($state, $year);
        $this->writeSplitCache($year, $payload);
        $this->storeRecordsMemory($year, $payload['records'] ?? []);

        unset($payload['records'], $payload['items'], $payload['monthly_qty']);

        return [
            'payload'   => $payload,
            'error'     => null,
            'row_count' => $state['row_count'],
        ];
    }

    /*
     * Fetch records for range method
     */
    private function fetchRecordsForRange(int $year, string $from, string $to): array
    {
        $state = $this->createState($year);
        $filter = sprintf(
            "CreationDate ge datetime'%sT00:00:00' and CreationDate le datetime'%sT23:59:59'",
            $from,
            $to
        );

        $result = $this->client->eachPage(function (array $batch) use (&$state, $year): void {
            foreach ($batch as $row) {
                if (is_array($row)) {
                    $this->ingestRow($row, $state, $year);
                }
            }
        }, ['$filter' => $filter]);

        return [
            'records' => $state['records'],
            'error'   => $state['row_count'] === 0 ? ($result['error'] ?? null) : null,
        ];
    }

    /*
     * Is narrow range method
     */
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

    /*
     * Build charts from records method
     */
    public function buildChartsFromRecords(array $filtered): array
    {
        $byDate = [];
        $byDivision = [];
        $byStyle = [];
        $byChannel = [];
        $byCategory = [];
        $byPlant = [];
        $byStatus = [];
        $byOrder = [];
        $byCustomer = [];
        $byCreator = [];
        $costSum = 0.0;
        $profitSum = 0.0;

        foreach ($filtered as $r) {
            $amount = (float) ($r['net_amount'] ?? 0);
            $cost = (float) ($r['cost'] ?? 0);
            $dateKey = !empty($r['date_iso']) ? $r['date_iso'] : 'N/A';
            $byDate[$dateKey] = ($byDate[$dateKey] ?? 0) + $amount;

            $div = (string) ($r['division'] ?? 'General');
            $byDivision[$div] = ($byDivision[$div] ?? 0) + $amount;

            $style = (string) ($r['material'] ?? $r['style'] ?? 'Unknown');
            if ($style === '' || $style === '—') {
                $style = (string) ($r['style'] ?? 'Unknown');
            }
            if (strlen($style) > 28) {
                $style = substr($style, 0, 26) . '…';
            }
            $byStyle[$style] = ($byStyle[$style] ?? 0) + $amount;

            $ch = (string) ($r['channel'] ?? 'Direct');
            $byChannel[$ch] = ($byChannel[$ch] ?? 0) + $amount;

            $cat = trim((string) ($r['item_category'] ?? ''));
            if ($cat === '' || $cat === '—') {
                $cat = trim((string) ($r['item_type'] ?? ''));
            }
            if ($cat === '' || $cat === '—') {
                $cat = 'Other';
            }
            $byCategory[$cat] = ($byCategory[$cat] ?? 0) + $amount;

            $plant = trim((string) ($r['plant'] ?? ''));
            if ($plant !== '' && $plant !== '—') {
                $byPlant[$plant] = ($byPlant[$plant] ?? 0) + $amount;
            }

            $st = trim((string) ($r['status'] ?? 'Open'));
            if ($st === '') {
                $st = 'Open';
            }
            $byStatus[$st] = ($byStatus[$st] ?? 0) + $amount;

            $orderNo = trim((string) ($r['sales_order'] ?? ''));
            if ($orderNo !== '' && $orderNo !== '—') {
                $byOrder['SO ' . $orderNo] = ($byOrder['SO ' . $orderNo] ?? 0) + $amount;
            }

            $cust = trim((string) ($r['customer_ref'] ?? ''));
            if ($cust !== '' && $cust !== '—') {
                if (strlen($cust) > 22) {
                    $cust = substr($cust, 0, 20) . '…';
                }
                $byCustomer[$cust] = ($byCustomer[$cust] ?? 0) + $amount;
            }

            $creator = trim((string) ($r['created_by'] ?? ''));
            if ($creator !== '' && $creator !== '—') {
                $byCreator[$creator] = ($byCreator[$creator] ?? 0) + $amount;
            }

            $costSum += max(0, $cost);
            $profitSum += max(0, $amount - $cost);
        }

        ksort($byDate);
        arsort($byStyle);
        arsort($byDivision);
        arsort($byChannel);

        $dateKeys = array_keys($byDate);
        if (count($dateKeys) > 31) {
            $dateKeys = array_slice($dateKeys, -31);
        }

        $trendLabels = [];
        $trendValues = [];
        foreach ($dateKeys as $key) {
            if ($key === 'N/A') {
                $trendLabels[] = 'N/A';
            } else {
                $trendLabels[] = date('d M', strtotime($key));
            }
            $trendValues[] = round($byDate[$key], 2);
        }

        $topStyles = array_slice($byStyle, 0, 6, true);
        $mix = $this->pickMixChart($byPlant, $byDivision, $byCategory, $byStatus, $costSum, $profitSum);
        $bar = $this->pickBarChart($byOrder, $byCustomer, $byCreator, $byChannel);

        return [
            'trend'      => [
                'labels' => $trendLabels,
                'values' => $trendValues,
            ],
            'division'   => $mix,
            'mix'        => $mix,
            'plants'     => $this->chartSeries($byPlant, 8),
            'divisions'  => $this->chartSeries($byDivision, 8),
            'statuses'   => $this->chartSeries($byStatus, 8),
            'categories' => $this->chartSeries($byCategory, 8),
            'top_styles' => [
                'labels' => array_keys($topStyles),
                'values' => array_map(static fn($v) => round((float) $v, 2), array_values($topStyles)),
            ],
            'channels'   => $bar,
            'bar'        => $bar,
        ];
    }

    /**
     * Prefer a mix with multiple slices so the donut is not a single 100% ring.
     */
    /*
     * Pick mix chart method
     */
    private function pickMixChart(array $byPlant, array $byDivision, array $byCategory, array $byStatus, float $costSum, float $profitSum): array
    {
        arsort($byPlant);
        arsort($byDivision);
        arsort($byCategory);
        arsort($byStatus);

        if (count($byPlant) >= 2) {
            $slice = array_slice($byPlant, 0, 6, true);
            return [
                'title'    => 'Plant Mix',
                'subtitle' => 'Net amount by plant',
                'labels'   => array_keys($slice),
                'values'   => array_map(static fn($v) => round((float) $v, 2), array_values($slice)),
            ];
        }

        if (count($byDivision) >= 2) {
            $slice = array_slice($byDivision, 0, 6, true);
            return [
                'title'    => 'Division Mix',
                'subtitle' => 'Net amount by division',
                'labels'   => array_keys($slice),
                'values'   => array_map(static fn($v) => round((float) $v, 2), array_values($slice)),
            ];
        }

        if (count($byCategory) >= 2) {
            $slice = array_slice($byCategory, 0, 6, true);
            return [
                'title'    => 'Item Category Mix',
                'subtitle' => 'Net amount by category',
                'labels'   => array_keys($slice),
                'values'   => array_map(static fn($v) => round((float) $v, 2), array_values($slice)),
            ];
        }

        if (count($byStatus) >= 2) {
            $slice = array_slice($byStatus, 0, 6, true);
            return [
                'title'    => 'Order Status Mix',
                'subtitle' => 'Net amount by status',
                'labels'   => array_keys($slice),
                'values'   => array_map(static fn($v) => round((float) $v, 2), array_values($slice)),
            ];
        }

        if ($costSum > 0 || $profitSum > 0) {
            return [
                'title'    => 'Value Mix',
                'subtitle' => 'Cost vs gross profit',
                'labels'   => ['Cost', 'Gross Profit'],
                'values'   => [round($costSum, 2), round($profitSum, 2)],
            ];
        }

        $slice = array_slice($byCategory, 0, 6, true);
        return [
            'title'    => 'Item Category Mix',
            'subtitle' => 'Net amount by category',
            'labels'   => array_keys($slice) ?: ['No data'],
            'values'   => array_values($slice) ?: [0],
        ];
    }

    /*
     * Chart series method
     */
    private function chartSeries(array $map, int $limit = 8): array
    {
        arsort($map);
        $slice = array_slice($map, 0, $limit, true);
        if ($slice === []) {
            return ['labels' => ['No data'], 'values' => [0]];
        }

        return [
            'labels' => array_keys($slice),
            'values' => array_map(static fn($v) => round((float) $v, 2), array_values($slice)),
        ];
    }

    /**
     * Prefer a bar chart with several columns instead of a single district bar.
     */
    /*
     * Pick bar chart method
     */
    private function pickBarChart(array $byOrder, array $byCustomer, array $byCreator, array $byChannel): array
    {
        $candidates = [
            [$byOrder, 'Top Sales Orders', 'Net amount by sales order'],
            [$byCustomer, 'Top Customers / PO', 'Net amount by customer ref'],
            [$byCreator, 'Sales by Creator', 'Net amount by created-by user'],
            [$byChannel, 'Sales by Plant', 'Net amount by plant'],
        ];

        foreach ($candidates as [$map, $title, $subtitle]) {
            if (count($map) < 2 && $title !== 'Sales by Plant') {
                continue;
            }
            arsort($map);
            $slice = array_slice($map, 0, 6, true);
            if ($slice === []) {
                continue;
            }
            return [
                'title'    => $title,
                'subtitle' => $subtitle,
                'labels'   => array_keys($slice),
                'values'   => array_map(static fn($v) => round((float) $v, 2), array_values($slice)),
            ];
        }

        return [
            'title'    => 'Top Sales Orders',
            'subtitle' => 'Net amount by sales order',
            'labels'   => ['No data'],
            'values'   => [0],
        ];
    }

    /*
     * Filter records method
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
                $r['sales_order'] ?? '',
                $r['line_item'] ?? '',
                $r['style'] ?? '',
                $r['material'] ?? '',
                $r['plant'] ?? '',
                $r['shipping_point'] ?? '',
                $r['material_group'] ?? '',
                $r['division'] ?? '',
                $r['customer_ref'] ?? '',
                $r['channel'] ?? '',
                $r['status'] ?? '',
                $r['created_by'] ?? '',
                $r['item_category'] ?? '',
            ]));

            return str_contains($hay, $search);
        }));
    }

    /*
     * Load records method
     */
    private function loadRecords(int $year): array
    {
        $file = $this->recordsCachePath($year);
        if (!is_file($file)) {
            // Fall back to previous cache version if we just bumped cache_version.
            $prev = $this->recordsCachePath($year, max(1, (int) ($this->cfg['cache_version'] ?? 1) - 1));
            if (is_file($prev)) {
                $file = $prev;
            } else {
                return [];
            }
        }

        $data = json_decode((string) file_get_contents($file), true);

        return is_array($data) ? $data : [];
    }

    /*
     * Load records cached method
     */
    private function loadRecordsCached(int $year): array
    {
        static $memo = [];
        if (isset($memo[$year])) {
            return $memo[$year];
        }

        $apcuKey = 'kapis_sap_records_v' . (int) ($this->cfg['cache_version'] ?? 1) . '_' . $year;
        if (function_exists('apcu_fetch')) {
            $ok = false;
            $hit = apcu_fetch($apcuKey, $ok);
            if ($ok && is_array($hit)) {
                $memo[$year] = $hit;
                return $hit;
            }
        }

        $records = $this->loadRecords($year);
        if ($records !== []) {
            $this->storeRecordsMemory($year, $records);
            $memo[$year] = $records;
        }

        return $records;
    }

    /*
     * Store records memory method
     */
    private function storeRecordsMemory(int $year, array $records): void
    {
        $apcuKey = 'kapis_sap_records_v' . (int) ($this->cfg['cache_version'] ?? 1) . '_' . $year;
        if (function_exists('apcu_store') && $records !== []) {
            // Keep in shared memory so later FPM requests skip the 17MB json_decode.
            @apcu_store($apcuKey, $records, max(60, (int) ($this->cfg['cache_ttl'] ?? 3600)));
        }
    }

    private function queryCacheKey(int $year, int $page, int $perPage, string $search, string $from, string $to): string
    {
        return hash('sha256', implode('|', [
            (string) ($this->cfg['cache_version'] ?? 1),
            (string) $year,
            (string) $page,
            (string) $perPage,
            strtolower(trim($search)),
            $from,
            $to,
        ]));
    }

    private function queryCachePath(string $key): string
    {
        return base_path('storage/cache/sap_sales_query_' . $key . '.json');
    }

    private function readQueryCache(string $key, int $ttl): ?array
    {
        $file = $this->queryCachePath($key);
        if (!is_file($file) || filemtime($file) + $ttl < time()) {
            return null;
        }
        $data = json_decode((string) file_get_contents($file), true);

        return is_array($data) ? $data : null;
    }

    private function writeQueryCache(string $key, array $payload): void
    {
        $dir = base_path('storage/cache');
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        @file_put_contents($this->queryCachePath($key), json_encode($payload));
    }

    private function createState(int $year): array
    {
        $monthly = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthly[$m] = [
                'date'  => sprintf('%04d-%02d-01', $year, $m),
                'month' => date('M', mktime(0, 0, 0, $m, 1, $year)),
                'value' => 0.0,
                'count' => 0,
            ];
        }

        return [
            'year'           => $year,
            'row_count'      => 0,
            'material_count' => 0,
            'items_by_key'   => [],
            'monthly'        => $monthly,
            'monthly_qty'    => [],
            'orders'         => [],
            'channels'       => [],
            'records'        => [],
        ];
    }

    private function ingestRow(array $row, array &$state, int $year): void
    {
        $state['row_count']++;

        $orderNo = (string) $this->field($row, ['Salesorder'], '');
        $lineNo = (string) $this->field($row, ['Salesorderitem'], '');
        $material = (string) $this->field($row, ['Material', 'Originallyrequestedmaterial'], '');

        $name = (string) $this->field($row, [
            'Purchaseorderbycustomer',
            'Salesorderitemtext',
            'Materialbycustomer',
            'Originallyrequestedmaterial',
        ], '');

        if ($name === '' && $material !== '') {
            $name = $material;
        }
        if ($name === '' && $orderNo !== '') {
            $name = 'Order ' . $orderNo . ' / ' . ltrim($lineNo, '0');
        }

        $divisionCode = (string) $this->field($row, ['Division'], '');
        $division = $this->divisionLabel($divisionCode, $row);

        $qty = $this->number($this->field($row, [
            'Orderquantity',
            'Requestedquantity',
            'Confddelivqtyinorderqtyunit',
            'Targetquantity',
        ], 0));

        $amount = $this->number($this->field($row, ['Netamount'], 0));
        if ($amount <= 0) {
            $amount = $this->number($this->field($row, ['Subtotal1amount', 'Subtotal2amount'], 0));
        }

        $unitPrice = $this->number($this->field($row, ['Netpriceamount'], 0));
        if ($amount <= 0 && $qty > 0 && $unitPrice > 0) {
            $priceQty = $this->number($this->field($row, ['Netpricequantity'], 1));
            $amount = ($unitPrice / max(1, $priceQty)) * $qty;
        }

        $price = $qty > 0 ? round($amount / $qty, 2) : $unitPrice;
        $cost = $this->number($this->field($row, ['Costamount'], 0));
        $isReturn = $this->isReturnItem($row);

        $customer = (string) $this->field($row, ['Purchaseorderbycustomer', 'Materialbycustomer'], '');
        if ($customer === '') {
            $group = (string) $this->field($row, ['Customergroup'], '');
            $customer = $group !== '' ? 'Customer Group ' . $group : ('SO ' . $orderNo);
        }

        $channel = $this->channelLabel($row);
        $status = $this->statusLabel($row);

        $date = $this->parseDate($this->field($row, [
            'Creationdate',
            'Billingdocumentdate',
            'Pricingdate',
            'Servicesrendereddate',
            'Lastchangedate',
        ], null));

        $monthIndex = $date ? (int) $date->format('n') : (int) date('n');
        $rowYear = $date ? (int) $date->format('Y') : $year;

        if ($rowYear === $year) {
            $state['monthly'][$monthIndex]['value'] += $amount;
        }

        if ($orderNo !== '') {
            if (!isset($state['orders'][$orderNo])) {
                $state['orders'][$orderNo] = [
                    'order'    => $orderNo,
                    'customer' => $customer,
                    'channel'  => $channel,
                    'items'    => 0,
                    'amount'   => 0.0,
                    'status'   => $status,
                    'date'     => $date,
                ];
            }
            $state['orders'][$orderNo]['items']++;
            $state['orders'][$orderNo]['amount'] += $amount;
            if ($date && (!$state['orders'][$orderNo]['date'] || $date > $state['orders'][$orderNo]['date'])) {
                $state['orders'][$orderNo]['date'] = $date;
            }
        }

        $itemKey = $material . '|' . $name . '|' . $divisionCode;
        if (!isset($state['items_by_key'][$itemKey])) {
            $state['material_count']++;
            $state['items_by_key'][$itemKey] = [
                'id'           => $state['material_count'],
                'name'         => $name,
                'category'     => $division,
                'price'        => $price,
                'stock'        => 0,
                'material'     => $material !== '' ? $material : ltrim($lineNo, '0'),
                'order_no'     => $orderNo,
                'units'        => 0.0,
                'revenue'      => 0.0,
                'cost'         => 0.0,
                'return_units' => 0.0,
            ];
            $state['monthly_qty'][$state['material_count']] = array_fill(1, 12, 0);
        }

        $id = $state['items_by_key'][$itemKey]['id'];
        $state['items_by_key'][$itemKey]['units'] += $qty;
        $state['items_by_key'][$itemKey]['revenue'] += $amount;
        $state['items_by_key'][$itemKey]['cost'] += $cost;
        if ($isReturn) {
            $state['items_by_key'][$itemKey]['return_units'] += $qty;
        }
        if ($price > 0) {
            $state['items_by_key'][$itemKey]['price'] = $price;
        }
        $state['monthly_qty'][$id][$monthIndex] = ($state['monthly_qty'][$id][$monthIndex] ?? 0) + $qty;

        $state['channels'][$channel] = ($state['channels'][$channel] ?? 0) + max($amount, 0);

        $state['records'][] = $this->buildRecord(
            $row,
            $orderNo,
            $lineNo,
            $material,
            $name,
            $division,
            $divisionCode,
            $qty,
            $price,
            $amount,
            $cost,
            $customer,
            $channel,
            $status,
            $isReturn,
            $date
        );
    }

    private function buildRecord(
        array $row,
        string $orderNo,
        string $lineNo,
        string $material,
        string $name,
        string $division,
        string $divisionCode,
        float $qty,
        float $price,
        float $amount,
        float $cost,
        string $customer,
        string $channel,
        string $status,
        bool $isReturn,
        ?DateTime $date
    ): array {
        $currency = (string) $this->field($row, ['Transactioncurrency'], (string) ($this->cfg['currency'] ?? 'USD'));
        $dateStr = $date ? $date->format('d M Y') : '—';
        $itemCategory = (string) $this->field($row, ['Salesorderitemcategory'], '');
        $itemType = (string) $this->field($row, ['Salesorderitemtype'], '');
        $district = (string) $this->field($row, ['Salesdistrict'], '');
        $customerGroup = (string) $this->field($row, ['Customergroup'], '');
        $createdBy = (string) $this->field($row, ['Createdbyuser'], '');
        $incoterms = (string) $this->field($row, ['Incotermsclassification'], '');
        $paymentTerms = (string) $this->field($row, ['Customerpaymentterms'], '');
        $deliveryStatus = (string) $this->field($row, ['Deliverystatus', 'Totaldeliverystatus'], '');
        $plant = (string) $this->field($row, ['Plant'], '');
        $shippingPoint = (string) $this->field($row, ['Shippingpoint'], '');
        $orderUnit = (string) $this->field($row, ['Orderquantityunit', 'Baseunit'], '');
        $materialGroup = (string) $this->field($row, ['Materialgroup'], '');
        $billingDate = $this->formatDateField($row, 'Billingdocumentdate');
        $pricingDate = $this->formatDateField($row, 'Pricingdate');

        $id = ($orderNo !== '' ? $orderNo : 'NA') . '-' . ($lineNo !== '' ? $lineNo : count($row));

        return [
            'id'            => $id,
            'sales_order'   => $orderNo !== '' ? $orderNo : '—',
            'line_item'     => $lineNo !== '' ? ltrim($lineNo, '0') : '—',
            'style'         => $name,
            'material'      => $material !== '' ? $material : '—',
            'division'      => $division,
            'division_code' => $divisionCode,
            'qty'           => round($qty, 3),
            'unit_price'    => round($price, 2),
            'net_amount'    => round($amount, 2),
            'cost'          => round($cost, 2),
            'currency'      => $currency,
            'customer_ref'  => $customer,
            'channel'       => $channel,
            'status'        => $status,
            'is_return'     => $isReturn,
            'date'          => $dateStr,
            'date_iso'      => $date ? $date->format('Y-m-d') : '',
            'created_by'    => $createdBy !== '' ? $createdBy : '—',
            'item_category' => $itemCategory !== '' ? $itemCategory : '—',
            'item_type'     => $itemType !== '' ? $itemType : '—',
            'sales_district'=> $district !== '' ? $district : '—',
            'customer_group'=> $customerGroup !== '' ? $customerGroup : '—',
            'incoterms'     => $incoterms !== '' ? $incoterms : '—',
            'payment_terms' => $paymentTerms !== '' ? $paymentTerms : '—',
            'delivery_status' => $deliveryStatus !== '' ? $deliveryStatus : '—',
            'billing_date'  => $billingDate,
            'pricing_date'  => $pricingDate,
            'plant'         => $plant !== '' ? $plant : '—',
            'shipping_point'=> $shippingPoint !== '' ? $shippingPoint : '—',
            'material_group'=> $materialGroup !== '' ? $materialGroup : '—',
            'unit'          => $orderUnit !== '' ? $orderUnit : 'EA',
        ];
    }

    private function formatDateField(array $row, string $field): string
    {
        $date = $this->parseDate($this->field($row, [$field], null));

        return $date ? $date->format('d M Y') : '—';
    }

    private function finalizeState(array $state, int $year): array
    {
        $monthly = $state['monthly'];
        $orders = $state['orders'];

        foreach ($orders as $order) {
            if ($order['date'] && (int) $order['date']->format('Y') === $year) {
                $monthly[(int) $order['date']->format('n')]['count']++;
            }
        }

        $items = array_values($state['items_by_key']);
        usort($items, fn($a, $b) => $b['revenue'] <=> $a['revenue']);

        $monthlyList = array_values($monthly);
        $netSales = array_sum(array_column($monthlyList, 'value'));
        $channelList = $this->buildChannelShares($state['channels']);
        $recentRows = $this->buildRecentOrders($orders);
        $highlights = $this->buildHighlights($items, $channelList, count($orders), $netSales);
        $alerts = $this->buildAlerts($items, $state['row_count'], count($orders));

        $symbol = (string) ($this->cfg['currency_symbol'] ?? '$');

        return [
            'row_count'       => $state['row_count'],
            'records'         => $state['records'],
            'items'           => $items,
            'monthly'         => $monthlyList,
            'monthly_qty'     => $state['monthly_qty'],
            'channels'        => $channelList,
            'kpis'            => [
                ['key' => 'kpi1', 'label' => 'Net Sales', 'icon' => 'payments', 'color' => 'blue', 'money' => true],
                ['key' => 'kpi2', 'label' => 'Order Quantity', 'icon' => 'checkroom', 'color' => 'green', 'money' => false],
                ['key' => 'kpi3', 'label' => 'Sales Orders', 'icon' => 'receipt_long', 'color' => 'orange', 'money' => false],
                ['key' => 'kpi4', 'label' => 'Avg Order Value', 'icon' => 'account_balance_wallet', 'color' => 'purple', 'money' => true],
            ],
            'charts'          => [
                'main'   => ['icon' => 'show_chart', 'title' => 'Net Sales Trend'],
                'pie'    => ['icon' => 'donut_large', 'title' => 'Plant / Division Mix'],
                'bar'    => ['icon' => 'star', 'title' => 'Top Materials'],
                'orders' => ['icon' => 'shopping_cart', 'title' => 'Sales Orders by Period'],
            ],
            'recent'          => [
                'title'   => 'Recent SAP Sales Orders',
                'icon'    => 'receipt_long',
                'headers' => ['Sales Order', 'Material', 'Plant', 'Lines', 'Net Amount', 'Status'],
                'rows'    => $recentRows,
            ],
            'table'           => [
                'title'   => 'Sales Order Items',
                'icon'    => 'inventory_2',
                'headers' => ['Material', 'Plant / Division', 'Unit Price', 'Qty', 'Net Amount', 'Category'],
            ],
            'highlights'      => $highlights,
            'alerts'          => $alerts,
            'data_source'     => 'SAP ZI_SalesApi_HUB',
            'currency'        => (string) ($this->cfg['currency'] ?? 'USD'),
            'currency_symbol' => $symbol,
        ];
    }

    private function divisionLabel(string $code, array $row): string
    {
        $labels = $this->cfg['division_labels'] ?? [];
        if ($code !== '' && isset($labels[$code])) {
            return $labels[$code];
        }

        $group = (string) $this->field($row, ['Materialgroup', 'Businessarea'], '');
        if ($group !== '') {
            return $group;
        }

        return $code !== '' ? 'Division ' . $code : 'General';
    }

    private function channelLabel(array $row): string
    {
        $plant = (string) $this->field($row, ['Plant'], '');
        if ($plant !== '') {
            return 'Plant ' . $plant;
        }

        $district = (string) $this->field($row, ['Salesdistrict'], '');
        if ($district !== '' && $district !== '000000') {
            return 'District ' . ltrim($district, '0');
        }

        $group = (string) $this->field($row, ['Customergroup'], '');
        if ($group !== '') {
            return 'Customer Group ' . $group;
        }

        $category = (string) $this->field($row, ['Salesorderitemcategory'], '');
        if ($category !== '') {
            return 'Category ' . $category;
        }

        return 'Direct';
    }

    private function statusLabel(array $row): string
    {
        $labels = $this->cfg['status_labels'] ?? [];
        $code = (string) $this->field($row, ['Sdprocessstatus', 'Deliverystatus', 'Totaldeliverystatus'], 'A');

        return $labels[$code] ?? $code;
    }

    private function isReturnItem(array $row): bool
    {
        $value = $this->field($row, ['Isreturnsitem'], null);
        if ($value === null || $value === '') {
            return false;
        }

        return $value === true || $value === 1 || $value === 'X' || $value === 'true';
    }

    private function readSummaryCache(int $year, bool $allowStale = false): ?array
    {
        $ttl = (int) ($this->cfg['cache_ttl'] ?? 0);
        if ($ttl <= 0 && !$allowStale) {
            return null;
        }

        $file = $this->summaryCachePath($year);
        if (!is_file($file)) {
            $prev = $this->summaryCachePath($year, max(1, (int) ($this->cfg['cache_version'] ?? 1) - 1));
            if (is_file($prev)) {
                $file = $prev;
            } else {
                return null;
            }
        }

        if (!$allowStale && filemtime($file) + $ttl < time()) {
            return null;
        }

        $data = json_decode((string) file_get_contents($file), true);

        return is_array($data) ? $data : null;
    }

    private function writeSplitCache(int $year, array $payload): void
    {
        $ttl = (int) ($this->cfg['cache_ttl'] ?? 0);
        if ($ttl <= 0) {
            return;
        }

        $dir = base_path('storage/cache');
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        $records = $payload['records'] ?? [];
        unset($payload['records'], $payload['items'], $payload['monthly_qty']);

        file_put_contents($this->recordsCachePath($year), json_encode($records));
        file_put_contents($this->summaryCachePath($year), json_encode($payload));
    }

    private function summaryCachePath(int $year, ?int $version = null): string
    {
        $version = $version ?? (int) ($this->cfg['cache_version'] ?? 1);

        return base_path('storage/cache/sap_sales_summary_v' . $version . '_' . $year . '.json');
    }

    private function recordsCachePath(int $year, ?int $version = null): string
    {
        $version = $version ?? (int) ($this->cfg['cache_version'] ?? 1);

        return base_path('storage/cache/sap_sales_records_v' . $version . '_' . $year . '.json');
    }

    private function buildChannelShares(array $channels): array
    {
        if ($channels === []) {
            return [];
        }

        arsort($channels);
        $total = array_sum($channels);
        $list = [];

        foreach (array_slice($channels, 0, 5, true) as $name => $value) {
            $list[] = [
                'name'  => $name,
                'share' => $total > 0 ? (int) round(($value / $total) * 100) : 0,
            ];
        }

        return $list;
    }

    private function buildRecentOrders(array $orders): array
    {
        uasort($orders, function ($a, $b) {
            $da = $a['date'] ?? null;
            $db = $b['date'] ?? null;
            if ($da && $db) {
                return $db <=> $da;
            }

            return strcmp($b['order'], $a['order']);
        });

        $symbol = (string) ($this->cfg['currency_symbol'] ?? '$');
        $rows = [];

        foreach (array_slice($orders, 0, 8, true) as $order) {
            $rows[] = [
                $order['order'],
                $order['customer'],
                $order['channel'],
                (string) $order['items'],
                $symbol . number_format($order['amount'], 2),
                $order['status'],
            ];
        }

        return $rows;
    }

    private function buildHighlights(array $items, array $channels, int $orderCount, float $netSales): array
    {
        $topItem = $items[0] ?? null;
        $topChannel = $channels[0]['name'] ?? 'Direct';
        $topShare = $channels[0]['share'] ?? 0;
        $symbol = (string) ($this->cfg['currency_symbol'] ?? '$');

        return [
            [
                'icon'  => 'cloud_done',
                'title' => 'SAP ZI_SalesApi_HUB',
                'text'  => number_format($orderCount) . ' sales orders in the current extract',
            ],
            [
                'icon'  => 'trending_up',
                'title' => 'Net sales',
                'text'  => $symbol . number_format($netSales, 0) . ' total net amount (USD)',
            ],
            [
                'icon'  => 'workspace_premium',
                'title' => 'Top material',
                'text'  => $topItem
                    ? ($topItem['material'] . ' — ' . $symbol . number_format($topItem['revenue'], 0))
                    : 'No material lines available',
            ],
            [
                'icon'  => 'factory',
                'title' => 'Top plant',
                'text'  => $topChannel . ' contributes ' . $topShare . '% of net amount',
            ],
        ];
    }

    private function buildAlerts(array $items, int $rowCount, int $orderCount): array
    {
        $alerts = [
            [
                'type' => 'ok',
                'text' => 'SAP OData connected — ' . number_format($rowCount) . ' order lines across ' . number_format($orderCount) . ' sales orders',
            ],
        ];

        if (count($items) > 0) {
            $alerts[] = [
                'type' => 'info',
                'text' => count($items) . ' unique materials grouped from Material / OriginallyRequestedMaterial',
            ];
        }

        return $alerts;
    }

    private function normalizeRow(array $row): array
    {
        $normalized = [];
        foreach ($row as $key => $value) {
            if (is_string($key)) {
                $normalized[strtolower($key)] = $value;
            }
        }

        return $normalized;
    }

    private function field(array $row, array $keys, $default = null)
    {
        $normalized = $this->normalizeRow($row);

        foreach ($keys as $key) {
            $lookup = strtolower($key);
            if (!array_key_exists($lookup, $normalized)) {
                continue;
            }

            $value = $normalized[$lookup];
            if ($value === null || $value === '') {
                continue;
            }

            return $value;
        }

        return $default;
    }

    private function number($value): float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }

        if (is_string($value)) {
            $clean = str_replace([',', ' '], '', $value);
            if (is_numeric($clean)) {
                return (float) $clean;
            }
        }

        return 0.0;
    }

    private function parseDate($value): ?DateTime
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof DateTime) {
            return $value;
        }

        $value = (string) $value;

        if (preg_match('/\/Date\((\-?\d+)\)\//', $value, $matches)) {
            $ms = (int) $matches[1];
            $seconds = (int) floor($ms / 1000);
            $dt = new DateTime('@' . $seconds);
            $dt->setTimezone(new DateTimeZone(date_default_timezone_get()));

            return $dt;
        }

        try {
            return new DateTime($value);
        } catch (Exception $e) {
            return null;
        }
    }
}
