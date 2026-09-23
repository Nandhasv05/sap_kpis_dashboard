<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 07/09/2026
 * DESCRIPTION : Material Model — ZI_MaterialAPI_HUB
 */

class MaterialModel
{
    private MaterialService $sap;

    /*
     * Constructor
     */
    public function __construct()
    {
        $this->sap = new MaterialService();
    }

    /*
     * Page context method
     */
    public function pageContext(): array
    {
        return $this->sap->pageContext();
    }

    /*
     * Paginated records method
     */
    public function paginatedRecords(int $page, int $perPage, string $search, string $from, string $to): array
    {
        return $this->sap->paginatedRecords($page, $perPage, $search, $from, $to);
    }
}
