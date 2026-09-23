<?php
class ProcurementController extends Controller
{
    private ProcurementModel $model;

    public function __construct()
    {
        $this->model = new ProcurementModel();
    }

    public function data(): void
    {
        $salesDoc = trim((string) ($_GET['sales_doc'] ?? ''));
        $this->jsonResponse($this->model->dashboard($salesDoc));
    }

    public function prData(): void
    {
        $uri = trim((string) ($_GET['uri'] ?? ''));
        $salesDoc = trim((string) ($_GET['sales_doc'] ?? ''));
        $compMat = trim((string) ($_GET['component_material'] ?? ''));
        $this->jsonResponse($this->model->prSet($uri, $salesDoc, $compMat));
    }
}
