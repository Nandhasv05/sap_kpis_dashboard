<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 23/09/2026
 * DESCRIPTION : Procurement service (ZBUSINESS_API_SRV)
 */
class ProcurementService
{
    public function dashboard(string $salesDoc): array
    {
        if ($salesDoc === '' || $salesDoc === '—') {
            return [
                'status' => 'error',
                'error'  => 'Sales order is required for procurement.',
                'data'   => [],
            ];
        }
        $rawDoc = ltrim($salesDoc, '0');
        if ($rawDoc === '') {
            $rawDoc = $salesDoc;
        }
        $paddedDoc = str_pad($rawDoc, 10, '0', STR_PAD_LEFT);
        require_once base_path('app/core/SapODataClient.php');
        $client = new SapODataClient();
        $cfg = config('sap');
        $baseUrl = rtrim((string) ($cfg['base_url'] ?? 'http://APP-PROD.evolvclothing.com:8000'), '/');
        $targetUrl = $baseUrl . '/sap/opu/odata/sap/ZBUSINESS_API_SRV/ProcurementDashboardSet?$filter=' . urlencode("SalesDoc eq '{$rawDoc}'") . '&$format=json';
        $sapResponse = $client->fetchUrl($targetUrl, 25);

        if (!empty($sapResponse['body']['d']['results'])) {
            return [
                'status'     => 'ok',
                'source'     => 'sap_live',
                'sales_doc'  => $rawDoc,
                'target_url' => $targetUrl,
                'data'       => $sapResponse['body']['d']['results'],
            ];
        }

        if ($rawDoc !== $paddedDoc) {
            $targetUrlPadded = $baseUrl . '/sap/opu/odata/sap/ZBUSINESS_API_SRV/ProcurementDashboardSet?$filter=' . urlencode("SalesDoc eq '{$paddedDoc}'") . '&$format=json';
            $sapResponsePadded = $client->fetchUrl($targetUrlPadded, 25);
            if (!empty($sapResponsePadded['body']['d']['results'])) {
                return [
                    'status'     => 'ok',
                    'source'     => 'sap_live',
                    'sales_doc'  => $paddedDoc,
                    'target_url' => $targetUrlPadded,
                    'data'       => $sapResponsePadded['body']['d']['results'],
                ];
            }
        }

        return [
            'status'     => 'error',
            'error'      => $sapResponse['error'] ?? 'No procurement records found from SAP for Sales Doc ' . $salesDoc,
            'sales_doc'  => $salesDoc,
            'target_url' => $targetUrl,
            'data'       => [],
        ];
    }

    public function prSet(string $uri, string $salesDoc = '', string $compMat = ''): array
    {
        require_once base_path('app/core/SapODataClient.php');
        $client = new SapODataClient();

        if ($uri === '' && $compMat !== '') {
            $cfg = config('sap');
            $baseUrl = rtrim((string) ($cfg['base_url'] ?? 'http://APP-PROD.evolvclothing.com:8000'), '/');
            $paddedDoc = str_pad(ltrim($salesDoc, '0'), 10, '0', STR_PAD_LEFT);
            $encMat = rawurlencode($compMat);
            $uri = "{$baseUrl}/sap/opu/odata/sap/ZBUSINESS_API_SRV/ProcurementDashboardSet(SalesDoc='{$paddedDoc}',ComponentMaterial='{$encMat}')/ProcurementPRSet?\$format=json";
        }

        $sapResponse = $uri !== '' ? $client->fetchUrl($uri, 25) : ['body' => null, 'error' => 'No URI provided.'];

        if (!empty($sapResponse['body']['d']['results'])) {
            return [
                'status' => 'ok',
                'source' => 'sap_live',
                'uri'    => $uri,
                'data'   => $sapResponse['body']['d']['results'],
            ];
        }

        if (!empty($sapResponse['body']['d']) && !isset($sapResponse['body']['d']['results'])) {
            return [
                'status' => 'ok',
                'source' => 'sap_live',
                'uri'    => $uri,
                'data'   => [$sapResponse['body']['d']],
            ];
        }

        return [
            'status' => 'error',
            'error'  => $sapResponse['error'] ?? 'No PR records returned from SAP.',
            'uri'    => $uri,
            'data'   => [],
        ];
    }
}
