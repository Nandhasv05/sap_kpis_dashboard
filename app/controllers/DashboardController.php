<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 03/09/2026
 * DESCRIPTION : Dashboard Controller for the dashboard
 */
require_once base_path('app/models/DashboardModel.php');

class DashboardController extends Controller
{
    private DashboardModel $model;

    /*
     * Constructor
     */
    public function __construct()
    {
        $this->model = new DashboardModel();
    }

    /*
     * Index method
     */
    public function index(): void
    {
        header('Location: ' . kapis_dash_url('sales'));
        exit;
    }

    /*
     * Show method
     */
    public function show(string $type): void
    {
        $cfg = $this->model->find($type);
        if (!$cfg) {
            $this->notFound('Dashboard not found.');
            return;
        }

        $year = $this->model->year();
        $items = $this->model->prepareItems($cfg);

        $this->view('dashboard/show', [
            'pageTitle'        => $cfg['title'],
            'pageSubtitle'     => $cfg['subtitle'] ?? '',
            'activeNav'        => $cfg['mode'],
            'primaryColor'     => $cfg['primary'],
            'primaryDark'      => $cfg['primary_dark'],
            'showPeriodFilter' => true,
            'cfg'              => $cfg,
            'items'            => $items,
            'year'             => $year,
            'defaultFrom'      => "{$year}-01-01",
            'defaultTo'        => "{$year}-12-31",
            'extraHead'        => '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>',
            'navDashboards'    => $this->model->kapis(),
        ]);
    }
}
?>