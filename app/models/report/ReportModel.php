<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 03/09/2026
 * DESCRIPTION : Report Model for the reports
 */

/*
 * Report Model class
 */
class ReportModel
{
    private DashboardModel $dashboards;

    /*
     * Constructor
     */
    public function __construct()
    {
        $this->dashboards = new DashboardModel();
    }

    /*
     * Summary cards method
     */
    public function summaryCards(): array
    {
        $all = $this->dashboards->all();
        $cards = [];
        foreach ($all as $slug => $cfg) {
            $cards[] = [
                'slug'     => $slug,
                'title'    => $cfg['title'],
                'subtitle' => $cfg['subtitle'],
                'primary'  => $cfg['primary'],
                'icon'     => $cfg['nav_icon'],
            ];
        }
        return $cards;
    }
}
?>
