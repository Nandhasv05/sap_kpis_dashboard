<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 23/09/2026
 * DESCRIPTION : Sales order service (ZI_SalesApi_HUB)
 */
class SaleOrderService
{
    private QuotationService $quotation;

    public function __construct()
    {
        $this->quotation = new QuotationService();
    }

    public function getSalesApiHubByOrder(string $salesOrder): array
    {
        return $this->quotation->getSalesApiHubByOrder($salesOrder);
    }
}
