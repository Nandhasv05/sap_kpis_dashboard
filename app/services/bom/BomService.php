<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 23/09/2026
 * DESCRIPTION : BOM service (ZC_COOISComp_Hub)
 */
class BomService
{
    public function bySalesOrder(string $salesOrder): array
    {
        if ($salesOrder === '' || $salesOrder === '—') {
            return [
                'status' => 'error',
                'error'  => 'Sales order is required for BOM.',
                'data'   => [],
            ];
        }

        $rawDoc = ltrim($salesOrder, '0');
        $paddedDoc = str_pad($rawDoc, 10, '0', STR_PAD_LEFT);
        require_once base_path('app/core/SapODataClient.php');
        $client = new SapODataClient();
        $cfg = config('sap');
        $baseUrl = rtrim((string) ($cfg['base_url'] ?? 'http://APP-PROD.evolvclothing.com:8000'), '/');

        $targetUrl = $baseUrl . '/sap/opu/odata/sap/ZC_COOISCOMP_HUB_CDS/ZC_COOISComp_Hub?$filter=' . urlencode("SalesOrder eq '{$rawDoc}'") . '&$format=json';
        $sapResponse = $client->fetchUrl($targetUrl, 30);

        if (!empty($sapResponse['body']['d']['results'])) {
            return [
                'status'      => 'ok',
                'source'      => 'sap_live',
                'sales_order' => $rawDoc,
                'target_url'  => $targetUrl,
                'count'       => count($sapResponse['body']['d']['results']),
                'data'        => $sapResponse['body']['d']['results'],
            ];
        }

        if ($rawDoc !== $paddedDoc) {
            $targetUrlPadded = $baseUrl . '/sap/opu/odata/sap/ZC_COOISCOMP_HUB_CDS/ZC_COOISComp_Hub?$filter=' . urlencode("SalesOrder eq '{$paddedDoc}'") . '&$format=json';
            $sapResponsePadded = $client->fetchUrl($targetUrlPadded, 30);
            if (!empty($sapResponsePadded['body']['d']['results'])) {
                return [
                    'status'      => 'ok',
                    'source'      => 'sap_live',
                    'sales_order' => $paddedDoc,
                    'target_url'  => $targetUrlPadded,
                    'count'       => count($sapResponsePadded['body']['d']['results']),
                    'data'        => $sapResponsePadded['body']['d']['results'],
                ];
            }
        }

        return [
            'status'      => 'error',
            'error'       => $sapResponse['error'] ?? 'No BOM records found from SAP for Sales Order ' . $salesOrder,
            'sales_order' => $salesOrder,
            'target_url'  => $targetUrl,
            'data'        => [],
        ];
    }
}
