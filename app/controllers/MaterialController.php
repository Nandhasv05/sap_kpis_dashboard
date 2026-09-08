<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 07/09/2026
 * DESCRIPTION : Material Controller — ZI_MaterialAPI_HUB
 */
require_once base_path('app/models/MaterialModel.php');
require_once base_path('app/models/DashboardModel.php');

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

        $this->view('material/index', [
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
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => $e->getMessage()]);
            return;
        }

        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
        echo json_encode($payload);
    }
}
