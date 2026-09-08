<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 03/09/2026
 * DESCRIPTION : Sales Controller for the sales dashboard
 */
require_once base_path('app/models/SalesModel.php');
require_once base_path('app/models/DashboardModel.php');

/*
 * Sales controller
 */
class SalesController extends Controller
{
    private SalesModel $model;

    /*
     * Constructor
     */
    public function __construct()
    {
        $this->model = new SalesModel();
    }

    /*
     * Index method
     */
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

        $this->view('sales/index', [
            'pageTitle'        => $cfg['title'],
            'pageSubtitle'     => $live['data_source'] === 'sap' ? 'SAP live data' : 'Sample data',
            'activeNav'        => 'sales',
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
            'currencySymbol'   => $live['currency_symbol'] ?? '$',
        ]);
    }

    /*
     * Data method
     */
    public function data(): void
    {
        $dashModel = new DashboardModel();
        $year = $dashModel->year();
        $export = strtolower((string) ($_GET['export'] ?? '')) === 'csv';
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = $export
            ? min(8000, max(1, (int) ($_GET['per_page'] ?? 8000)))
            : min(100, max(10, (int) ($_GET['per_page'] ?? 25)));
        $search = trim((string) ($_GET['q'] ?? ''));
        $from = trim((string) ($_GET['from'] ?? ''));
        $to = trim((string) ($_GET['to'] ?? ''));

        try {
            $payload = $this->model->paginatedRecords($year, $page, $perPage, $search, $from, $to);
        } catch (Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => $e->getMessage()]);
            return;
        }

        if ($export) {
            $this->sendCsv($payload['records'] ?? []);
            return;
        }

        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
        echo json_encode($payload);
    }

    /*
     * Send CSV method
     */
    private function sendCsv(array $records): void
    {
        $filename = 'kapis-order-lines-' . date('Ymd-His') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        $out = fopen('php://output', 'w');
        fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));
        fputcsv($out, [
            'Sales Order', 'Line', 'Material', 'Plant', 'Division',
            'Date', 'Qty', 'Net Amount', 'Status', 'Category',
        ]);
        foreach ($records as $row) {
            fputcsv($out, [
                $row['sales_order'] ?? '',
                $row['line_item'] ?? '',
                $row['material'] ?? '',
                $row['plant'] ?? '',
                $row['division'] ?? '',
                $row['date'] ?? '',
                $row['qty'] ?? '',
                $row['net_amount'] ?? '',
                $row['status'] ?? '',
                $row['item_category'] ?? '',
            ]);
        }
        fclose($out);
    }
}
