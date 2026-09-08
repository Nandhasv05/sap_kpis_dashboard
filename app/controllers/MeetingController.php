<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 03/09/2026
 * DESCRIPTION : Open Meeting Hall from the Evolv Clothing session
 */

require_once base_path('app/core/portal_auth.php');

/*
 * Meeting controller
 */
class MeetingController extends Controller
{
    /*
     * Launch method
     */
    public function launch(): void
    {
        portal_require_login();
        $ticket = portal_meeting_sso_ticket();
        $target = '/Meeting/';
        if ($ticket !== '') {
            $target .= '?sso=' . rawurlencode($ticket);
        }
        header('Location: ' . $target);
        exit;
    }
}
