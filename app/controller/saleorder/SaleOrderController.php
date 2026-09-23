<?php
class SaleOrderController extends Controller
{
    private SaleOrderModel $model;

    public function __construct()
    {
        $this->model = new SaleOrderModel();
    }

    public function data(): void
    {
        $salesOrder = trim((string) ($_GET['sales_order'] ?? $_GET['so'] ?? ''));
        if ($salesOrder === '' || $salesOrder === '—') {
            $this->jsonResponse([
                'success' => false,
                'error'   => 'Sales order is required',
                'records' => [],
            ]);
            return;
        }

        $this->jsonResponse($this->model->linesByOrder($salesOrder));
    }
}
