<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 03/09/2026
 * DESCRIPTION : Customer Model for the customer dashboard
 */

/*
 * Customer Model class
 */
class CustomerModel
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
     * Retail dashboard method
     */
    public function retailDashboard(): ?array
    {
        return $this->dashboards->find('retail');
    }

    /*
     * Store channels method
     */
    public function storeChannels(): array
    {
        $cfg = $this->retailDashboard();
        return $cfg['channels'] ?? [];
    }

    /*
     * Recent transactions method
     */
    public function recentTransactions(): array
    {
        $cfg = $this->retailDashboard();
        return $cfg['recent']['rows'] ?? [];
    }
}
?>