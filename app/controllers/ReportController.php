<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 03/09/2026
 * DESCRIPTION : Report Controller for the reports
 */
require_once base_path('app/models/ReportModel.php');
require_once base_path('app/models/DashboardModel.php');

/*
 * Report controller
 */
class ReportController extends Controller
{
    private ReportModel $model;

    /*
     * Constructor
     */
    public function __construct()
    {
        $this->model = new ReportModel();
    }

    /*
     * Index method
     */
    public function index(): void
    {
        $this->view('reports/index', [
            'pageTitle'        => 'Reports',
            'pageSubtitle'     => 'Cross-dashboard apparel ops reports',
            'activeNav'        => 'reports',
            'primaryColor'     => '#1b5e4b',
            'primaryDark'      => '#0f3d32',
            'showPeriodFilter' => false,
            'cards'            => $this->model->summaryCards(),
            'navDashboards'    => (new DashboardModel())->kapis(),
        ]);
    }
}
?>