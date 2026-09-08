<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 03/09/2026
 * DESCRIPTION : Error pages (404, etc.)
 */
require_once base_path('app/models/DashboardModel.php');

/*
 * Error controller
 */
class ErrorController extends Controller
{
    /*
     * Not found method
     */
    public function notFound(string $message = 'The page you are looking for does not exist or has been moved.'): void
    {
        http_response_code(404);

        $this->view('errors/404', [
            'pageTitle'        => 'Page not found',
            'pageSubtitle'     => '404',
            'activeNav'        => '',
            'primaryColor'     => '#1b5e4b',
            'primaryDark'      => '#0f3d32',
            'showPeriodFilter' => false,
            'message'          => $message,
            'navDashboards'    => (new DashboardModel())->kapis(),
        ]);
    }
}
