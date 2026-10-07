# 🛒 FreshCart — Online Grocery Store

A modern, fully-featured **frontend-only online grocery store** built with pure HTML, CSS, and Vanilla JavaScript. FreshCart offers a seamless shopping experience with a rich product catalogue, cart management, checkout flow, and a complete admin dashboard — all without any backend.

---

## 📸 Preview

> **FreshCart** — *Fresh groceries, delivered.*

---

## ✨ Features

### 🛍️ Customer Storefront
- **Home Page** — Animated hero, category grid, featured deals, and promotional banners
- **Shop / Product Listing** — Filter by category, search, sort by price/rating
- **Product Detail Page** — Rich product info, reviews, add to cart / wishlist
- **Shopping Cart** — Quantity management, coupon codes, live order summary
- **Checkout** — Address form, delivery slot selection, payment method picker
- **Order Success** — Animated confirmation with order tracking info
- **Order Tracking** — Real-time-style delivery status tracker
- **Account Page** — User profile, order history, saved addresses
- **About & Contact Pages** — Brand story and support contact form

### 🔧 Admin Dashboard (`/admin`)
| Page | Description |
|---|---|
| `dashboard.html` | KPI cards, revenue chart, recent orders |
| `products.html` | Full product CRUD with stock management |
| `categories.html` | Category management with item counts |
| `orders.html` | Order list with status updates |
| `customers.html` | Customer directory and spend analytics |
| `inventory.html` | Stock level alerts and restocking |
| `payments.html` | Transaction history and payment status |
| `delivery.html` | Delivery agent assignment and tracking |
| `coupons.html` | Coupon creation and discount management |
| `reviews.html` | Customer review moderation |
| `reports.html` | Sales, revenue, and category reports |
| `settings.html` | Store configuration and preferences |

---

## 🗂️ Project Structure

```
FreshCart/
├── index.html              # Home / Landing page
├── shop.html               # Product listing & filters
├── product.html            # Product detail page
├── cart.html               # Shopping cart
├── checkout.html           # Checkout flow
├── order-success.html      # Order confirmation
├── track-order.html        # Order tracking
├── account.html            # User account & orders
├── about.html              # About us page
├── contact.html            # Contact & support
├── admin.html              # Admin entry point
│
├── admin/                  # Admin dashboard pages
│   ├── dashboard.html
│   ├── products.html
│   ├── categories.html
│   ├── orders.html
│   ├── customers.html
│   ├── inventory.html
│   ├── payments.html
│   ├── delivery.html
│   ├── coupons.html
│   ├── reviews.html
│   ├── reports.html
│   ├── settings.html
│   └── login.html
│
├── js/                     # JavaScript modules
│   ├── app.js              # Main app controller (homepage, modals, nav)
│   ├── api.js              # In-memory mock API (CRUD operations)
│   ├── data.js             # Seed data — products, categories, orders
│   ├── products.js         # Product listing & detail logic
│   ├── cart.js             # Cart & checkout management
│   ├── checkout.js         # Checkout flow & order placement
│   ├── animations.js       # GSAP scroll animations & transitions
│   └── admin.js            # Admin dashboard logic
│
├── css/
│   └── style.css           # Custom styles (complements Tailwind CSS)
│
└── assets/
    ├── images/             # Logo and local images
    └── icons/              # Icon assets
```

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| **HTML5** | Semantic page structure |
| **Tailwind CSS** (CDN) | Utility-first styling |
| **Vanilla JavaScript** | App logic, routing, state management |
| **GSAP + ScrollTrigger** | Scroll animations and transitions |
| **Lucide Icons** | Clean SVG icon library |
| **Google Fonts** | Plus Jakarta Sans & Inter typefaces |

> ⚡ No build tools, no frameworks, no backend — just open `index.html` in a browser!

---

## 📦 Product Catalogue

The store ships with **32 seed products** across **12 categories**:

- 🍎 Fruits · 🥦 Vegetables · 🥛 Dairy & Eggs · 🍞 Bakery
- 🍗 Meat & Seafood · 🍿 Snacks · 🧃 Beverages · 🌾 Rice & Grains
- 🫙 Cooking Essentials · 🧊 Frozen Foods · 🧴 Personal Care · 🧹 Household

---

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dilipsangapu/Online-Grocery-Store.git
   cd Online-Grocery-Store
   ```

2. **Open in browser**
   ```bash
   # Simply open the file — no server needed
   start index.html          # Windows
   open index.html           # macOS
   xdg-open index.html       # Linux
   ```

   > 💡 For the best experience, use a local development server like [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code.

3. **Access the Admin Panel**
   ```
   Open admin/login.html
   ```

---

## 🌐 Live Demo

> *(Deploy to GitHub Pages, Netlify, or Vercel by pointing to `index.html` as the entry point.)*

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Dilip Sangapu**  
GitHub: [@Dilipsangapu](https://github.com/Dilipsangapu)

---

<p align="center">Made with ❤️ for fresh groceries and clean code.</p>
