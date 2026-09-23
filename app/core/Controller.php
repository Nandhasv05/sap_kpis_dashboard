<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 03/09/2026
 * DESCRIPTION : Controller class
 */

/*
 * Controller class
 */
class Controller
{
    /*
     * View method
     */
    protected function view(string $view, array $data = [], ?string $layout = 'layouts/main'): void
    {
        extract($data, EXTR_SKIP);

        $viewFile = base_path('app/views/' . str_replace('.', '/', $view) . '.php');
        if (!is_file($viewFile)) {
            http_response_code(500);
            echo 'View not found: ' . e($view);
            return;
        }

        if ($layout === null) {
            require $viewFile;
            return;
        }

        $layoutFile = base_path('app/views/' . str_replace('.', '/', $layout) . '.php');
        if (!is_file($layoutFile)) {
            require $viewFile;
            return;
        }

        ob_start();
        require $viewFile;
        $content = ob_get_clean();

        require $layoutFile;
    }

    /*
     * Not found method
     */
    protected function notFound(string $message = 'Page not found.'): void
    {
        (new ErrorController())->notFound($message);
    }

    /*
     * JSON Response helper method
     */
    protected function jsonResponse(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
        echo json_encode($data);
    }

    protected function sapODataClient(): SapODataClient
    {
        require_once base_path('app/core/SapODataClient.php');
        return new SapODataClient();
    }

    protected function sapBaseUrl(): string
    {
        $cfg = config('sap');
        return rtrim((string) ($cfg['base_url'] ?? 'http://APP-PROD.evolvclothing.com:8000'), '/');
    }
}
