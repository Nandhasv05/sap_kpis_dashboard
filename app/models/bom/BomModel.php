<?php
class BomModel
{
    private BomService $service;

    public function __construct()
    {
        $this->service = new BomService();
    }

    public function bySalesOrder(string $salesOrder): array
    {
        return $this->service->bySalesOrder($salesOrder);
    }
}
