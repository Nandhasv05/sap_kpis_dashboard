<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 03/09/2026
 * DESCRIPTION : Router class
 */

/*
 * Router class
 */
class Router
{
    /** @var array<int, array{method:string, pattern:string, handler:callable|array}> */
    private array $routes = [];

    /*
     * Get method
     */
    public function get(string $pattern, $handler): void
    {
        $this->add('GET', $pattern, $handler);
    }

    /*
     * Post method
     */
    public function post(string $pattern, $handler): void
    {
        $this->add('POST', $pattern, $handler);
    }

    /*
     * Add method
     */
    private function add(string $method, string $pattern, $handler): void
    {
        $this->routes[] = [
            'method'  => strtoupper($method),
            'pattern' => trim($pattern, '/'),
            'handler' => $handler,
        ];
    }

    /*
     * Dispatch method
     */
    public function dispatch(string $method, string $uri): void
    {
        $method = strtoupper($method);
        $path = str_replace('\\', '/', (string) $uri);
        if (str_contains($path, '://') || str_contains($path, '?')) {
            $parsed = parse_url($path, PHP_URL_PATH);
            if (is_string($parsed) && $parsed !== '') {
                $path = $parsed;
            }
        }
        if (function_exists('kapis_strip_url_prefix') && preg_match('#^/(?:KPIS|Kapis)(/|$)#i', $path)) {
            $path = kapis_strip_url_prefix($path);
        } elseif (preg_match('#^/(?:KPIS|Kapis)(/|$)#i', $path)) {
            $stripped = preg_replace('#^/(?:KPIS|Kapis)(?=/|$)#i', '', $path);
            $path = ($stripped === null || $stripped === '') ? '/' : $stripped;
        }
        $path = preg_replace('#/index\.php(/|$)#i', '/', $path) ?: '/';
        $uri = trim($path, '/');
        if ($uri === '' || strcasecmp($uri, 'index.php') === 0) {
            $uri = 'sales';
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method && !($method === 'HEAD' && $route['method'] === 'GET')) {
                continue;
            }

            $regex = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $route['pattern']);
            $regex = '#^' . $regex . '$#';

            if (!preg_match($regex, $uri, $matches)) {
                continue;
            }

            $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
            $handler = $route['handler'];

            if (is_array($handler)) {
                [$class, $action] = $handler;
                $controller = new $class();
                call_user_func_array([$controller, $action], $params);
                return;
            }

            call_user_func_array($handler, $params);
            return;
        }

        require_once base_path('app/controllers/ErrorController.php');
        (new ErrorController())->notFound();
    }
}
