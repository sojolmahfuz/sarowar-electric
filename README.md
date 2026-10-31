# সারোয়ার ইলেকট্রিক এন্ড হার্ডওয়্যার (Sarowar Electric & Hardware)
### Authorized HAMKO Dealer & RR Kābel Partner — Natore, Bangladesh

[![Live Website](https://img.shields.io/badge/Live%20Website-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://sojolmahfuz.github.io/sarowar-electric/)
[![Admin Dashboard](https://img.shields.io/badge/Admin%20Console-Live%20Portal-orange?style=for-the-badge&logo=shield)](https://sojolmahfuz.github.io/sarowar-electric/admin.html)
[![Database](https://img.shields.io/badge/Database-SQLite%203-blue?style=for-the-badge&logo=sqlite)](data/sarowar.sqlite)
[![Status](https://img.shields.io/badge/Status-Live%20%26%20Active-success?style=for-the-badge)]()

A creative, full-stack, responsive web application with a built-in SQLite relational database designed for **Sarowar Electric & Hardware** (সারোয়ার ইলেকট্রিক এন্ড হার্ডওয়্যার), based on the business page analysis (`web.facebook.com/sarowarelectrics`).

---

## 🌐 Live URLs

- **Public Live Storefront:** [https://sojolmahfuz.github.io/sarowar-electric/](https://sojolmahfuz.github.io/sarowar-electric/)
- **Live Admin Dashboard:** [https://sojolmahfuz.github.io/sarowar-electric/admin.html](https://sojolmahfuz.github.io/sarowar-electric/admin.html)
- **Admin PIN:** `1234`

---

## 📌 Business Profile & Key Highlights
- **Business Name:** Sarowar Electric & Hardware (সারোয়ার ইলেকট্রিক এন্ড হার্ডওয়্যার)
- **Key Official Partnerships:**
  - 🏆 **Authorized HAMKO Dealer** (হামকো অথোরাইজড ডিলার) — Tubular batteries, DSP Sine Wave IPS, Solar Inverters with 30-month official warranty.
  - ⚡ **RR Kābel Partner** ("Wires Without Worries") — 100% pure electrolytic copper flame-retardant (FR) cables.
- **Location:** মিশন হাসপাতালের পূর্ব পার্শ্বে, ঢাকা রোড, বড় হরিশপুর, নাটোর (East of Mission Hospital, Dhaka Road, Boro Horishpur, Natore - 6400).
- **Contact Numbers:** `01780-904878`, `01714-246866`, `01300-122400`
- **Email:** `sarowarelectrics@gmail.com`
- **WhatsApp:** `+8801780904878`
- **Facebook:** [Sarowar Electrics & Hardware](https://web.facebook.com/sarowarelectrics)

---

## 🌟 Key Features Built-in

1. **Creative & Modern UI/UX (Bilingual বাংলা / English):**
   - Real storefront photography, branding, authentic badges, and product showcases.
   - One-click instant language switcher (বাংলা / English).
2. **Interactive Building Wiring & IPS Estimator:**
   - Real-time material calculator for flats, duplexes, and shops (1.5 RM, 2.5 RM coils, switchboards, DB boxes, conduits).
   - Appliance wattage calculator recommending exact Hamko IPS inverters and tubular battery capacities.
3. **Dynamic Product Catalog with Live Search & Filtering:**
   - Filter by Category (Cables, IPS/Battery, Lighting, Switches, Breakers, Hardware, Fans).
   - Filter by Brand (RR Kabel, Hamko, Super Star, Havells, Gazi).
   - Wholesale and Retail pricing tiers.
   - Quick-view modal with detailed technical specifications table.
4. **Shopping Cart & Checkout System:**
   - Instant slide-over cart drawer.
   - Cash on Delivery (COD), bKash / Nagad options, or Store Pickup at Boro Horishpur.
   - Automated order tracking ID generation (`SEH-XXXXXX`).
   - Direct 1-click WhatsApp order confirmation and invoice sharing.
5. **Contractor & Wholesale Quotations Engine:**
   - Tailored for electricians, building owners, and contractors with database storage.
6. **On-demand Electrician & Technician Booking:**
   - Book certified electricians for wiring, short-circuit troubleshooting, or IPS setup in Natore.
7. **Customer Reviews & Ratings System:**
   - Customer feedback with star ratings saved directly to the database.
8. **Relational SQLite Database (`data/sarowar.sqlite`):**
   - Pure, zero-dependency SQLite backend powered by `sql.js`.
   - Tables: `products`, `categories`, `orders`, `quotations`, `service_bookings`, `reviews`, `site_settings`.
9. **Full Admin Management Dashboard (`admin.html`):**
   - Default PIN: `1234`
   - Real-time stats: Total sales revenue, pending orders, wholesale requests, electrician bookings, and low-stock alerts.
   - Product stock management and modal editing.
   - Order status management (Pending, Confirmed, Shipped, Delivered).
   - One-click database export/backup in JSON format.

---

## 🎛️ Full-Control Admin Dashboard (`admin.html`)

The website includes a dedicated, standalone **Admin Control Console** with complete authority over every aspect of the business:

- **Default PIN:** `1234` (Can be changed anytime inside the settings panel).
- **Control Abilities:**
  1. **📊 Overview & Metrics:** Real-time revenue (৳), order counters, low-stock warnings, and category breakdown.
  2. **📦 Product & Inventory CRUD:**
     - Add new products with image upload (Multer) or image URL.
     - Edit existing products with safe form setters.
     - Set prices, wholesale rates, units, and technical specifications (JSON).
     - Inline stock adjustments (`+ / -`) and low-stock alerts.
     - 1-click Featured and In-Stock toggle badges.
  3. **🛒 Order Management & Invoicing:**
     - Update order statuses: *Pending → Confirmed → Processing → Shipped → Delivered → Cancelled*.
     - Printable official invoice slips with store header, customer details, and itemized totals.
     - 1-click **WhatsApp Customer** button with pre-filled status notifications.
  4. **💼 Wholesale Quotations:**
     - Manage contractor and builder quote requests.
     - Internal admin calculation notes & direct WhatsApp quotation replies.
  5. **🔧 Electrician Bookings:**
     - Assign technicians to house wiring and troubleshooting jobs in Natore.
  6. **⭐ Customer Reviews Moderation:**
     - Approve, feature, or add showroom feedback directly.
  7. **⚙️ Store Profile & Contact Settings:**
     - Update store name, hotlines (`01780-904878`), WhatsApp number, address, business hours, and admin security PIN.
  8. **🗄️ Database Management & Tools:**
     - Download complete JSON database backups.
     - Restore/Import database from JSON file.
     - Factory reset to default seed data.
     - Built-in SQL Query Console for running custom queries directly on the SQLite database.

---

## 🚀 How to Run Locally with Backend (Node + Express + SQLite)

### 1. Install Dependencies:
```bash
npm install
```

### 2. Start the Server:
```bash
npm start
```
Or directly:
```bash
node src/server.js
```

### 3. Access URLs:
- **Client Storefront:** `http://localhost:3000`
- **Admin Dashboard:** `http://localhost:3000/admin`
- **API Status:** `http://localhost:3000/api/settings`

---

## 📁 Repository Structure

```text
├── index.html               # Main public storefront (GitHub Pages root)
├── admin.html               # Full Admin Control Console
├── css/
│   └── style.css            # Custom CSS & Bangla typography
├── js/
│   ├── data.js              # Seed catalog data & static fallback
│   ├── app.js               # Client store interactivity & calculator
│   └── admin.js             # Admin dashboard controller
├── images/
│   └── fb/                  # Authentic Facebook photos & logos
├── data/
│   └── sarowar.sqlite       # Relational SQLite database
├── src/
│   ├── db.js                # SQLite sql.js database layer
│   └── server.js            # Express API server
├── public/                  # Static mirror
└── README.md                # Documentation & Guide
```

---

## 👨‍💻 Developer & Attribution
Designed & developed for **Sarowar Electric & Hardware**, Boro Horishpur, Dhaka Road, Natore.
Admin Portal & Database Infrastructure by **Al Amin Mahfuz (@sojolmahfuz)**.
