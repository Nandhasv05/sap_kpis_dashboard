<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 03/09/2026
 * DESCRIPTION : Customer Controller for the retail dashboard
 */

class CustomerController extends Controller
{
    private CustomerService $service;

    public function __construct()
    {
        $this->service = new CustomerService();
    }

    /*
     * Index method
     */
    public function index(): void
    {
        $cfg = $this->service->retailDashboard();
        if (!$cfg) {
            $this->notFound('Customer / retail data not found.');
            return;
        }

        $dashModel = new DashboardModel();
        $year = $dashModel->year();
        $items = $dashModel->prepareItems($cfg);

        $this->view('customer/customerView', [
            'pageTitle'        => 'Customers',
            'pageSubtitle'     => 'Retail stores, footfall & customer transactions',
            'activeNav'        => 'customers',
            'primaryColor'     => $cfg['primary'],
            'primaryDark'      => $cfg['primary_dark'],
            'showPeriodFilter' => true,
            'cfg'              => $cfg,
            'items'            => $items,
            'year'             => $year,
            'defaultFrom'      => "{$year}-01-01",
            'defaultTo'        => "{$year}-12-31",
            'extraHead'        => '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>',
            'channels'         => $this->service->storeChannels(),
            'transactions'     => $this->service->recentTransactions(),
            'navDashboards'    => $dashModel->kapis(),
        ]);
    }
}
