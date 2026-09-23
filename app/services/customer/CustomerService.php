<?php
/*
 * AUTHOR : NANDHAKUMAR S V
 * DATE : 23/09/2026
 * DESCRIPTION : Customer service
 */
class CustomerService
{
    private CustomerModel $model;

    public function __construct()
    {
        $this->model = new CustomerModel();
    }

    public function retailDashboard(): ?array
    {
        return $this->model->retailDashboard();
    }

    public function storeChannels(): array
    {
        return $this->model->storeChannels();
    }

    public function recentTransactions(): array
    {
        return $this->model->recentTransactions();
    }
}
