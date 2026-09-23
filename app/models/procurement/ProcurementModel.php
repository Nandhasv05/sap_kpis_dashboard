<?php
class ProcurementModel
{
    private ProcurementService $service;

    public function __construct()
    {
        $this->service = new ProcurementService();
    }

    public function dashboard(string $salesDoc): array
    {
        return $this->service->dashboard($salesDoc);
    }

    public function prSet(string $uri, string $salesDoc = '', string $compMat = ''): array
    {
        return $this->service->prSet($uri, $salesDoc, $compMat);
    }
}
