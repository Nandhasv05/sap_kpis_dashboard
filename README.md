# 👕 Evolv Clothing

<p align="center">
  <img src="https://img.shields.io/badge/Evolv-Clothing-blue?style=for-the-badge" alt="Evolv Clothing" />
  <img src="https://img.shields.io/badge/PHP-MVC-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP MVC" />
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
</p>

<p align="center">
  <strong>Apparel Operations & Management Dashboard</strong>
</p>

<p align="center">
  <a href="http://10.103.10.33/">🚀 Open Application</a>
  &nbsp;•&nbsp;
  <a href="https://www.evolvclothing.com/">🌐 Evolv Clothing</a>
</p>

---

## ✨ Overview

**Evolv Clothing** is an MVC-based apparel operations dashboard designed to provide a centralized platform for monitoring and managing business operations.

The application provides dedicated modules for:

* 📊 Dashboard
* 💰 Sales
* 👥 Customers
* 📦 Inventory
* 🧵 Materials
* 🏭 Production
* 📈 Reports
* ⚙️ Operational Management

The application follows a clean **PHP MVC architecture** with centralized routing, controllers, models, and views.

---

## 🎬 Project Preview

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=1000&color=2563EB&center=true&vCenter=true&width=650&lines=Evolv+Clothing+Dashboard;Apparel+Operations+Management;Sales+%7C+Inventory+%7C+Production;Built+with+PHP+MVC" alt="Animated Introduction" />
</p>

---

## 🚀 Live Application

### Internal Server

```text
http://10.103.10.33/
```

### Company Website

```text
https://www.evolvclothing.com/
```

---

## 🛠️ Technology Stack

| Technology     | Purpose                  |
| -------------- | ------------------------ |
| PHP            | Backend Application      |
| MVC            | Application Architecture |
| MySQL          | Database                 |
| HTML5          | UI Structure             |
| CSS3           | Styling                  |
| JavaScript     | Frontend Interactions    |
| Apache / Nginx | Web Server               |
| Git            | Version Control          |
| Linux          | Server Environment       |

---

## 📂 Project Structure

```text
evolvclothing/
│
├── app/
│   ├── controllers/
│   ├── models/
│   ├── views/
│   └── core/
│
├── config/
│
├── public/
│   ├── index.php
│   ├── .htaccess
│   ├── css/
│   ├── js/
│   ├── images/
│   └── assets/
│
├── routes/
│
├── docs/
│
└── README.md
```

---

## 🧩 Application Modules

### 📊 Dashboard

Centralized overview of apparel business operations.

```text
/
```

Controller:

```text
DashboardController@index
```

---

### 💰 Sales

Sales-related information and operational monitoring.

```text
/sales
```

Controller:

```text
SalesController@index
```

---

### 👥 Customers

Customer information and customer-related operations.

```text
/customers
```

Controller:

```text
CustomerController@index
```

---

### 📈 Reports

Business and operational reporting.

```text
/reports
```

Controller:

```text
ReportController@index
```

---

### 📦 Inventory

Inventory and stock-related operational information.

```text
/inventory
```

Controller:

```text
DashboardController@show
```

---

### 🧵 Material

Material-related operations and information.

```text
/material
```

Controller:

```text
DashboardController@show
```

---

### 🏭 Production

Production-related operations and monitoring.

```text
/production
```

Controller:

```text
DashboardController@show
```

---

## 🛣️ Routes

| Path          | Controller          | Method  |
| ------------- | ------------------- | ------- |
| `/`           | DashboardController | `index` |
| `/sales`      | SalesController     | `index` |
| `/customers`  | CustomerController  | `index` |
| `/reports`    | ReportController    | `index` |
| `/inventory`  | DashboardController | `show`  |
| `/material`   | DashboardController | `show`  |
| `/production` | DashboardController | `show`  |

---

## 🏗️ MVC Architecture

```text
                 ┌──────────────────┐
                 │      Browser     │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │      Router      │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │    Controller    │
                 └───────┬───┬──────┘
                         │   │
              ┌──────────┘   └──────────┐
              ▼                         ▼
      ┌──────────────┐          ┌──────────────┐
      │     Model    │          │     View     │
      └──────┬───────┘          └──────────────┘
             │
             ▼
      ┌──────────────┐
      │    MySQL     │
      └──────────────┘
```

---

## ⚡ Quick Start

### 1. Clone Repository

```bash
git clone <REPOSITORY_URL>
```

### 2. Enter Project

```bash
cd evolvclothing
```

### 3. Configure Database

Update the database configuration inside:

```text
config/
```

### 4. Configure Web Server

Set the web root to:

```text
/home/evolv/evolvclothing/evolvclothing/public/
```

### 5. Start Application

Open:

```text
http://10.103.10.33/
```

---

## 💻 Local Development

For MAMP development:

```text
http://localhost/evolvclothing/public/
```

The application requires URL rewriting for clean routes.

---

## 🔀 Git Workflow

### Check Status

```bash
git status
```

### Pull Latest Changes

```bash
git pull origin main
```

### Add Changes

```bash
git add .
```

### Commit

```bash
git commit -m "Update Evolv dashboard"
```

### Push

```bash
git push origin main
```

---

## 🚀 Deployment

Production project directory:

```text
/home/evolv/evolvclothing/evolvclothing/
```

Public web root:

```text
/home/evolv/evolvclothing/evolvclothing/public/
```

After deployment:

```bash
cd /home/evolv/evolvclothing/evolvclothing
git pull origin main
```

Check Nginx:

```bash
sudo nginx -t
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

---

## 🔐 Security

Production credentials should **never** be committed to Git.

Do not expose:

```text
.env
database passwords
API keys
private keys
server credentials
```

Keep sensitive configuration outside the public web root whenever possible.

---

## 🧪 Testing Checklist

* [ ] Dashboard
* [ ] Sales
* [ ] Customers
* [ ] Reports
* [ ] Inventory
* [ ] Material
* [ ] Production
* [ ] Database connection
* [ ] Pretty URLs
* [ ] Forms
* [ ] CRUD operations
* [ ] Static assets
* [ ] Server deployment

---

## 📌 Server Information

| Item         | Value                                             |
| ------------ | ------------------------------------------------- |
| Application  | Evolv Clothing                                    |
| Environment  | Internal Server                                   |
| Server URL   | `http://10.103.10.33/`                            |
| Project Path | `/home/evolv/evolvclothing/evolvclothing/`        |
| Web Root     | `/home/evolv/evolvclothing/evolvclothing/public/` |
| Architecture | MVC                                               |
| Backend      | PHP                                               |
| Database     | MySQL                                             |

---

## 🌟 Project Status

<p align="center">

<img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Active" />
<img src="https://img.shields.io/badge/Environment-Production-orange?style=for-the-badge" alt="Production" />
<img src="https://img.shields.io/badge/Architecture-MVC-purple?style=for-the-badge" alt="MVC" />

</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:2563EB,100:7C3AED&height=120&section=footer" alt="Footer Animation" />
</p>

<p align="center">
  <strong>Built for Evolv Clothing 👕</strong>
</p>
