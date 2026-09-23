<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 23/09/2026
 * DESCRIPTION : Quotation hub controller
 */

class QuotationController extends Controller
{
    private QuotationModel $model;
    private QuotationService $quotationService;

    public function __construct()
    {
        $this->model = new QuotationModel();
        $this->quotationService = new QuotationService();
    }

    public function index(): void
    {
        $dashModel = new DashboardModel();
        $year = $dashModel->year();
        $live = $this->model->salesPage($year);
        $cfg = $live['cfg'];

        if ($cfg === []) {
            $this->notFound('Sales dashboard not found.');
            return;
        }

        $now = new DateTime();
        $dayOfWeek = (int) $now->format('N');
        $thisWeekFrom = (clone $now)->modify('-' . ($dayOfWeek - 1) . ' days')->format('Y-m-d');
        $thisWeekTo = (clone $now)->modify('+' . (7 - $dayOfWeek) . ' days')->format('Y-m-d');

        $this->view('quotation/quotationView', [
            'pageTitle'        => $cfg['title'],
            'pageSubtitle'     => $live['data_source'] === 'sap' ? 'SAP live data' : 'Sample data',
            'activeNav'        => 'sales',
            'primaryColor'     => $cfg['primary'],
            'primaryDark'      => $cfg['primary_dark'],
            'showPeriodFilter' => true,
            'year'             => $year,
            'defaultFrom'      => $thisWeekFrom,
            'defaultTo'        => $thisWeekTo,
            'periodLabel'      => 'This Week',
            'navDashboards'    => $dashModel->kapis(),
            'dataSource'       => $live['data_source'],
            'sapError'         => $live['sap_error'],
            'sapRows'          => $live['sap_rows'],
            'currencySymbol'   => $live['currency_symbol'] ?? '$',
        ]);
    }

    public function data(): void
    {
        $dashModel = new DashboardModel();
        $year = $dashModel->year();
        $export = strtolower((string) ($_GET['export'] ?? '')) === 'csv';

        $filters = [
            'from_date'   => trim((string) ($_GET['from_date'] ?? $_GET['from'] ?? '')),
            'to_date'     => trim((string) ($_GET['to_date'] ?? $_GET['to'] ?? '')),
            'search'      => trim((string) ($_GET['search'] ?? $_GET['q'] ?? '')),
            'quotation'   => trim((string) ($_GET['quotation'] ?? '')),
            'sales_order' => trim((string) ($_GET['sales_order'] ?? $_GET['so'] ?? '')),
            'page'        => max(1, (int) ($_GET['page'] ?? 1)),
            'per_page'    => $export
                ? min(8000, max(1, (int) ($_GET['per_page'] ?? 8000)))
                : min(100, max(10, (int) ($_GET['per_page'] ?? 10))),
            'year'        => $year,
        ];

        try {
            $result = $this->quotationService->getSalesData($filters);

            if ($export) {
                $this->sendCsv($result['records'] ?? $result['data']['records'] ?? []);
                return;
            }

            if (!empty($result['error']) || (isset($result['success']) && $result['success'] === false)) {
                $this->jsonResponse([
                    'success' => false,
                    'message' => $result['message'] ?? 'Unable to fetch sales data from SAP',
                    'error'   => $result['error'] ?? 'SAP request failed',
                    'data'    => [],
                    'meta'    => [
                        'source' => 'SAP',
                        'count'  => 0,
                    ],
                ], 200);
                return;
            }

            $this->jsonResponse($result);
        } catch (Throwable $e) {
            $this->jsonResponse([
                'success' => false,
                'message' => 'Unable to fetch sales data from SAP: ' . $e->getMessage(),
                'error'   => $e->getMessage(),
                'data'    => [],
                'meta'    => [
                    'source' => 'SAP',
                    'count'  => 0,
                ],
            ], 500);
        }
    }

    private function sendCsv(array $records): void
    {
        $filename = 'kapis-order-lines-' . date('Ymd-His') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        $out = fopen('php://output', 'w');
        fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));
        fputcsv($out, [
            'Quotation', 'Item', 'Material', 'Description', 'Plant',
            'Date', 'Qty', 'Net Value', 'Sales Order', 'Category', 'Customer',
        ]);
        foreach ($records as $row) {
            fputcsv($out, [
                $row['quotation'] ?? '',
                $row['line_item'] ?? '',
                $row['material'] ?? '',
                $row['style'] ?? '',
                $row['plant'] ?? '',
                $row['date'] ?? '',
                $row['qty'] ?? '',
                $row['net_amount'] ?? '',
                $row['sales_order'] ?? '',
                $row['item_category'] ?? '',
                $row['customer'] ?? '',
            ]);
        }
        fclose($out);
    }
}
