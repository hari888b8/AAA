# 🛒 AgriGalaxy — Input Supplier Marketplace

> The foundational marketplace for agricultural inputs — seeds, fertilizers, pesticides, and organic products.

---

## Overview

AgriGalaxy is the **initial app** in the AgriHub ecosystem platform. It connects agricultural input suppliers (seeds, fertilizers, pesticides, organic inputs) with farmers through a two-sided marketplace. Suppliers list their stores and products; farmers browse, compare prices, and purchase inputs.

---

## Key Features

### For Sellers (Supplier Role)
- **Store Management** — Create and manage your supplier store profile
- **Product Catalog** — List products with descriptions, pricing, and inventory
- **Order Management** — View and fulfill incoming orders
- **Analytics** — Track sales, popular products, and revenue

### For Buyers (Farmer Role)
- **Store Discovery** — Browse verified input suppliers near you
- **Product Search** — Search across all stores for specific inputs
- **Price Comparison** — Compare prices across multiple suppliers
- **Category Browsing** — Seeds, Fertilizers, Pesticides, Organic Inputs
- **Reviews & Ratings** — Read and write product/store reviews
- **Checkout & Payment** — Integrated payment flow

---

## Product Categories

| Category | Examples |
|----------|----------|
| 🌱 Seeds | Paddy, Cotton, Groundnut, Vegetables, Maize |
| 🧪 Fertilizers | Urea, DAP, NPK, Micronutrients |
| 🔬 Pesticides | Insecticides, Fungicides, Herbicides |
| 🌿 Organic | Neem oil, Bio-fertilizers, Vermicompost |

---

## User Modes

| Role | Default Tab | Features |
|------|-------------|----------|
| Supplier | My Store | Store setup, Products, Orders, Analytics |
| Farmer | Stores | Browse stores, Search, Cart, Orders |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agrigalaxy/stores` | List all stores |
| POST | `/agrigalaxy/stores` | Create a store (supplier) |
| GET | `/agrigalaxy/stores/:id` | Get store details |
| GET | `/agrigalaxy/products` | Search products |
| POST | `/agrigalaxy/products` | Add a product (supplier) |
| GET | `/agrigalaxy/orders` | List orders |
| POST | `/agrigalaxy/orders` | Place an order |
| GET | `/agrigalaxy/reviews/:productId` | Get product reviews |
| POST | `/agrigalaxy/reviews` | Submit a review |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/AgriGalaxyScreen.js` | Frontend screen component |
| `backend/src/routes/agrigalaxy.js` | API route handlers |

---

## Integration Points

- **Payments** — Integrated checkout via platform payment system
- **Reviews** — Shared review/rating system
- **Logistics** — Delivery tracking for ordered inputs
- **Trust Score** — Supplier trust scoring based on ratings & history
