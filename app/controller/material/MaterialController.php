<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 23/09/2026
 * DESCRIPTION : Material dashboard + live ZI_MaterialAPI_HUB line lookup
 */

class MaterialController extends Controller
{
    private MaterialModel $model;

    public function __construct()
    {
        $this->model = new MaterialModel();
    }

    public function index(): void
    {
        $dashModel = new DashboardModel();
        $year = $dashModel->year();
        $cfg = $dashModel->find('material');
        if (!$cfg) {
            $this->notFound('Material dashboard not found.');
            return;
        }

        $live = $this->model->pageContext();

        $this->view('material/materialView', [
            'pageTitle'        => $cfg['title'],
            'pageSubtitle'     => 'SAP ZI_MaterialAPI_HUB',
            'activeNav'        => 'material',
            'primaryColor'     => $cfg['primary'],
            'primaryDark'      => $cfg['primary_dark'],
            'showPeriodFilter' => true,
            'year'             => $year,
            'defaultFrom'      => "{$year}-01-01",
            'defaultTo'        => "{$year}-12-31",
            'navDashboards'    => $dashModel->kapis(),
            'dataSource'       => $live['data_source'],
            'sapError'         => $live['sap_error'],
            'sapRows'          => $live['sap_rows'],
        ]);
    }

    public function data(): void
    {
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(100, max(10, (int) ($_GET['per_page'] ?? 25)));
        $search = trim((string) ($_GET['q'] ?? ''));
        $from = trim((string) ($_GET['from'] ?? ''));
        $to = trim((string) ($_GET['to'] ?? ''));

        try {
            $payload = $this->model->paginatedRecords($page, $perPage, $search, $from, $to);
        } catch (Throwable $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
            return;
        }

        $this->jsonResponse($payload);
    }

    public function lineApi(): void
    {
        $forceDateFilter = (!empty($_GET['date_filter']) || !empty($_GET['date_range']) || ($_GET['mode'] ?? '') === 'date_range');
        $material = $forceDateFilter ? '' : trim((string) ($_GET['material'] ?? $_GET['product'] ?? ''));
        $client = $this->sapODataClient();
        $baseUrl = $this->sapBaseUrl();

        if ($material !== '') {
            $targetUrl = $baseUrl . '/sap/opu/odata/sap/ZI_MATERIALAPI_HUB_CDS/ZI_MaterialAPI_HUB?$filter=' . urlencode("Product eq '{$material}'") . '&$format=json';
            $sapResponse = $client->fetchUrl($targetUrl, 25);
            if (!empty($sapResponse['body']['d']['results'])) {
                $this->jsonResponse([
                    'status'     => 'ok',
                    'source'     => 'sap_live',
                    'mode'       => 'product',
                    'material'   => $material,
                    'target_url' => $targetUrl,
                    'count'      => count($sapResponse['body']['d']['results']),
                    'data'       => $sapResponse['body']['d']['results'],
                ]);
                return;
            }

            $prefix = preg_replace('/[0-9]{3}$/', '', $material);
            if ($prefix !== '' && $prefix !== $material) {
                $targetUrl2 = $baseUrl . '/sap/opu/odata/sap/ZI_MATERIALAPI_HUB_CDS/ZI_MaterialAPI_HUB?$filter=' . urlencode("Product eq '{$prefix}'") . '&$format=json';
                $sapResponse2 = $client->fetchUrl($targetUrl2, 25);
                if (!empty($sapResponse2['body']['d']['results'])) {
                    $this->jsonResponse([
                        'status'     => 'ok',
                        'source'     => 'sap_live',
                        'mode'       => 'product_prefix',
                        'material'   => $material,
                        'matched'    => $prefix,
                        'target_url' => $targetUrl2,
                        'count'      => count($sapResponse2['body']['d']['results']),
                        'data'       => $sapResponse2['body']['d']['results'],
                    ]);
                    return;
                }
            }

            $this->jsonResponse([
                'status'     => 'ok',
                'source'     => 'sap_live',
                'mode'       => 'product',
                'material'   => $material,
                'target_url' => $targetUrl,
                'count'      => 0,
                'data'       => [],
                'message'    => "No SAP Material Master records found for Product '{$material}'",
            ]);
            return;
        }

        $dateFilter = "CreationDate ge datetime'2026-09-01T00:00:00' and CreationDate le datetime'2026-09-07T23:59:59'";
        $targetUrl = $baseUrl . '/sap/opu/odata/sap/ZI_MATERIALAPI_HUB_CDS/ZI_MaterialAPI_HUB?$filter=' . urlencode($dateFilter) . '&$top=150&$format=json';
        $sapResponse = $client->fetchUrl($targetUrl, 30);

        if (!empty($sapResponse['body']['d']['results'])) {
            $this->jsonResponse([
                'status'     => 'ok',
                'source'     => 'sap_live',
                'mode'       => 'date_range',
                'filter'     => $dateFilter,
                'target_url' => $targetUrl,
                'count'      => count($sapResponse['body']['d']['results']),
                'data'       => $sapResponse['body']['d']['results'],
            ]);
            return;
        }

        $this->jsonResponse([
            'status'     => 'error',
            'error'      => $sapResponse['error'] ?? 'No material records returned from SAP.',
            'target_url' => $targetUrl,
            'data'       => [],
        ]);
    }
}
