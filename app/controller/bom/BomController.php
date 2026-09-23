<?php
class BomController extends Controller
{
    private BomModel $model;

    public function __construct()
    {
        $this->model = new BomModel();
    }

    public function data(): void
    {
        $salesOrder = trim((string) ($_GET['sales_order'] ?? ''));
        $this->jsonResponse($this->model->bySalesOrder($salesOrder));
    }
}
