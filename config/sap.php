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
    'page_size'        => 1000,
    'max_rows'         => 4000,
    // Material master: fewer pages + smaller payload (dashboard, not full extract)
    'material_max_rows' => 2000,
    'material_page_size' => 1000,
    'timeout'          => 25,
    'connect_timeout'  => 8,
    'cache_ttl'        => 0,
    'query_cache_ttl'  => 0,
    'material_query_cache_ttl' => 0,
    'material_range_cache_ttl' => 0,
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
