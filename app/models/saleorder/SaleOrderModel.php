<?php
class SaleOrderModel
{
    private SaleOrderService $service;

    public function __construct()
    {
        $this->service = new SaleOrderService();
    }

    public function linesByOrder(string $salesOrder): array
    {
        return $this->service->getSalesApiHubByOrder($salesOrder);
    }
}
