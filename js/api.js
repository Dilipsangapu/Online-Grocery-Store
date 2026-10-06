/**
 * FreshCart API Layer — LocalStorage persistence
 * Replace localStorage calls with fetch('/api/...') for backend integration.
 */
const STORAGE_KEYS = {
  PRODUCTS:"fc_products", CATEGORIES:"fc_categories", ORDERS:"fc_orders",
  CUSTOMERS:"fc_customers", COUPONS:"fc_coupons", REVIEWS:"fc_reviews",
  SETTINGS:"fc_settings", CART:"fc_cart", WISHLIST:"fc_wishlist",
  USER:"fc_user", ADMIN_AUTH:"fc_admin_auth"
};

class FreshCartAPI {
  constructor() { this._init(); }

  _init() {
    const DATA_VERSION = "2.5";
    if (localStorage.getItem("fc_data_version") !== DATA_VERSION) {
      // Merge/update default product images & info
      const existing = this._get(STORAGE_KEYS.PRODUCTS, null);
      if (existing && Array.isArray(existing)) {
        const updated = existing.map(p => {
          const fresh = INITIAL_PRODUCTS.find(ip => ip.id === p.id);
          return fresh ? { ...p, image: fresh.image, name: fresh.name, description: fresh.description, brand: fresh.brand, unit: fresh.unit } : p;
        });
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      } else {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      }

      // Merge/update orders item images & details
      const existingOrders = this._get(STORAGE_KEYS.ORDERS, null);
      if (existingOrders && Array.isArray(existingOrders)) {
        const updatedOrders = existingOrders.map(o => {
          const updatedItems = (o.items || []).map(item => {
            const freshProd = INITIAL_PRODUCTS.find(p => p.id === item.productId);
            return freshProd ? { ...item, image: freshProd.image, name: freshProd.name } : item;
          });
          return { ...o, items: updatedItems };
        });
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));
      } else {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      }

      localStorage.setItem("fc_data_version", DATA_VERSION);
    }
    const seed = (key, data) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(data)); };
    seed(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    seed(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    seed(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    seed(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    seed(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
    seed(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    seed(STORAGE_KEYS.SETTINGS, STORE_SETTINGS);
    seed(STORAGE_KEYS.CART, []);
    seed(STORAGE_KEYS.WISHLIST, ["prod-1","prod-20","prod-3"]);
    seed(STORAGE_KEYS.USER, { id:"CUST-101", name:"Dileep Kumar", email:"dileep.kumar@example.com", phone:"+91 98490 12345", address:"Flat 402, Sri Krishna Heights, Balaji Colony", city:"Tirupati", state:"Andhra Pradesh", pincode:"517501" });
  }

  _get(key, fallback=[]) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
  _set(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

  /* PRODUCTS */
  getProducts() { return this._get(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS); }
  getProductById(id) { return this.getProducts().find(p=>p.id===id)||null; }
  addProduct(product) {
    const products = this.getProducts();
    const p = { id:"prod-"+Date.now(), sku:"SKU-"+Math.floor(1000+Math.random()*9000), rating:5.0, reviewsCount:0, badge:null, featured:false, ...product, price:Number(product.price), originalPrice:Number(product.originalPrice||product.price), stock:Number(product.stock||0), minStock:Number(product.minStock||5), status:Number(product.stock)>0?"In Stock":"Out of Stock" };
    products.unshift(p); this._set(STORAGE_KEYS.PRODUCTS, products); return p;
  }
  updateProduct(id, fields) {
    const products = this.getProducts(); const i = products.findIndex(p=>p.id===id);
    if (i<0) return null;
    products[i] = { ...products[i], ...fields, price:Number(fields.price??products[i].price), originalPrice:Number(fields.originalPrice??products[i].originalPrice), stock:Number(fields.stock??products[i].stock), status:Number(fields.stock??products[i].stock)>0?"In Stock":"Out of Stock" };
    this._set(STORAGE_KEYS.PRODUCTS, products); return products[i];
  }
  deleteProduct(id) { let p=this.getProducts(); const had=p.length; p=p.filter(x=>x.id!==id); this._set(STORAGE_KEYS.PRODUCTS,p); return p.length<had; }
  restockProduct(id, qty=25) { const p=this.getProductById(id); return p?this.updateProduct(id,{stock:Number(p.stock)+Number(qty)}):null; }

  /* CATEGORIES */
  getCategories() { return this._get(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES); }
  addCategory(cat) { const cats=this.getCategories(); const c={id:cat.name.toLowerCase().replace(/[^a-z0-9]+/g,"-"),itemCount:0,status:"Active",...cat}; cats.push(c); this._set(STORAGE_KEYS.CATEGORIES,cats); return c; }
  updateCategory(id,fields) { const cats=this.getCategories(); const i=cats.findIndex(c=>c.id===id); if(i<0)return null; cats[i]={...cats[i],...fields}; this._set(STORAGE_KEYS.CATEGORIES,cats); return cats[i]; }
  deleteCategory(id) { let c=this.getCategories(); c=c.filter(x=>x.id!==id); this._set(STORAGE_KEYS.CATEGORIES,c); return true; }

  /* ORDERS */
  getOrders() { return this._get(STORAGE_KEYS.ORDERS, INITIAL_ORDERS); }
  getOrder(id) { return this.getOrders().find(o=>o.id===id)||null; }
  createOrder(data) {
    const orders=this.getOrders(); const id="FC-"+(8950+Math.floor(Math.random()*1000));
    const now=new Date(); const timeStr=now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    const order={ id, createdAt:now.toISOString(), orderStatus:"Confirmed", paymentStatus:"Paid", deliveryPartner:"Ramesh Reddy (+91 98877 11223)", timeline:[ {step:"Order Placed",time:timeStr,done:true},{step:"Confirmed",time:timeStr,done:true},{step:"Preparing",time:"Pending",done:false},{step:"Out for Delivery",time:"Pending",done:false},{step:"Delivered",time:"Pending",done:false} ], ...data };
    orders.unshift(order); this._set(STORAGE_KEYS.ORDERS,orders);
    order.items.forEach(item=>{ const p=this.getProductById(item.productId); if(p) this.updateProduct(p.id,{stock:Math.max(0,p.stock-item.quantity)}); });
    return order;
  }
  updateOrderStatus(id,status) {
    const orders=this.getOrders(); const i=orders.findIndex(o=>o.id===id); if(i<0)return null;
    orders[i].orderStatus=status;
    const steps=["Order Placed","Confirmed","Preparing","Out for Delivery","Delivered"]; const si=steps.indexOf(status);
    if(si>=0&&orders[i].timeline) orders[i].timeline=orders[i].timeline.map((t,idx)=>idx<=si?{...t,done:true,time:t.time==="Pending"?new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):t.time}:{...t,done:false});
    this._set(STORAGE_KEYS.ORDERS,orders); return orders[i];
  }

  /* CUSTOMERS */
  getCustomers() { return this._get(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS); }

  /* COUPONS */
  getCoupons() { return this._get(STORAGE_KEYS.COUPONS, INITIAL_COUPONS); }
  validateCoupon(code,subtotal) {
    if(!code) return {valid:false,message:"Enter a coupon code."};
    const c=this.getCoupons().find(x=>x.code.toUpperCase()===code.trim().toUpperCase()&&x.status==="Active");
    if(!c) return {valid:false,message:"Invalid or expired coupon."};
    if(subtotal<c.minOrder) return {valid:false,message:`Min. order ₹${c.minOrder} required.`};
    let discount=c.discountType==="flat"?c.discountValue:c.discountType==="percentage"?Math.min(c.maxDiscount,Math.round(subtotal*c.discountValue/100)):49;
    return {valid:true,coupon:c,discount,message:`'${c.code}' applied! Saved ₹${discount}.`};
  }
  addCoupon(c) { const coupons=this.getCoupons(); const n={...c,code:c.code.toUpperCase().trim(),usedCount:0,status:"Active"}; coupons.push(n); this._set(STORAGE_KEYS.COUPONS,coupons); return n; }
  deleteCoupon(code) { this._set(STORAGE_KEYS.COUPONS,this.getCoupons().filter(c=>c.code!==code)); return true; }

  /* REVIEWS */
  getReviews() { return this._get(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS); }
  deleteReview(id) { this._set(STORAGE_KEYS.REVIEWS,this.getReviews().filter(r=>r.id!==id)); return true; }

  /* SETTINGS */
  getSettings() { return this._get(STORAGE_KEYS.SETTINGS, STORE_SETTINGS); }
  updateSettings(s) { const merged={...this.getSettings(),...s}; this._set(STORAGE_KEYS.SETTINGS,merged); return merged; }

  /* CART */
  getCart() { return this._get(STORAGE_KEYS.CART, []); }
  saveCart(cart) { this._set(STORAGE_KEYS.CART,cart); }

  /* WISHLIST */
  getWishlist() { return this._get(STORAGE_KEYS.WISHLIST, []); }
  toggleWishlist(id) { let w=this.getWishlist(); const had=w.includes(id); w=had?w.filter(x=>x!==id):[...w,id]; this._set(STORAGE_KEYS.WISHLIST,w); return {wishlist:w,isAdded:!had}; }

  /* USER */
  getCurrentUser() { return this._get(STORAGE_KEYS.USER, null); }
  updateCurrentUser(data) { const u={...this.getCurrentUser(),...data}; this._set(STORAGE_KEYS.USER,u); return u; }

  /* ADMIN AUTH */
  isAdminAuthenticated() { return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH)==="true"; }
  loginAdmin(email,password) {
    const validEmail=email&&(email.includes("admin")||email.includes("@"));
    const validPass=password&&password.length>=4;
    if(validEmail&&validPass){ localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH,"true"); return {success:true,name:email.split("@")[0]}; }
    return {success:false,message:"Try admin@freshcart.com / admin123"};
  }
  logoutAdmin() { localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH); }

  /* KPIs */
  getKPIs() {
    const products=this.getProducts(); const orders=this.getOrders(); const customers=this.getCustomers();
    return {
      totalSales:486240+orders.reduce((s,o)=>o.orderStatus!=="Cancelled"?s+Number(o.total||0):s,0),
      ordersCount:1286+orders.length, customersCount:8420+customers.length, productsCount:products.length,
      lowStockCount:products.filter(p=>p.stock<=p.minStock).length||18,
      pendingOrdersCount:orders.filter(o=>["Preparing","Confirmed","New"].includes(o.orderStatus)).length||42
    };
  }
}

window.freshCartAPI = new FreshCartAPI();
