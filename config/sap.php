<?php
/**
 * SAP OData — ZI_SalesApi_HUB CDS view (KPIS Sales)
 * Material hub uses material_service (ZI_MaterialAPI_HUB).
 */

return [
    'enabled'          => true,
    'base_url'         => 'http://APP-PROD.evolvclothing.com:8000',
    'resolve'          => [
        'APP-PROD.evolvclothing.com:8000:10.103.10.18',
        'app-prod.evolvclothing.com:8000:10.103.10.18',
    ],
    'service'          => '/sap/opu/odata/sap/ZI_SALESAPI_HUB_CDS/ZI_SalesApi_HUB',
    'material_service' => '/sap/opu/odata/sap/ZI_MATERIALAPI_HUB_CDS/ZI_MaterialAPI_HUB',
    'username'         => 'APIUSER',
    'password'         => 'Api@321',
    'page_size'        => 500,
    'max_rows'         => 25000,
    // Material master: fewer pages + smaller payload (dashboard, not full extract)
    'material_max_rows' => 4000,
    'material_page_size' => 500,
    'timeout'          => 90,
    // Year SAP sync TTL (serve stale files after this; only re-pull when missing)
    'cache_ttl'        => 3600,
    // Per-filter API response cache (keeps dashboard snappy)
    'query_cache_ttl'  => 180,
    // Material range/disk cache — longer so KPI reloads stay fast
    'material_query_cache_ttl' => 900,
    'material_range_cache_ttl' => 3600,
    'cache_version'    => 8,
    'material_cache_version' => 3,
    'currency'         => 'USD',
    'currency_symbol'  => '$',
    'division_labels'  => [
        '10' => 'Apparel',
        '20' => 'Accessories',
    ],
    'status_labels'    => [
        'A' => 'Active',
        'B' => 'In Progress',
        'C' => 'Completed',
    ],
];
