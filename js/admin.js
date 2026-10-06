/**
 * FreshCart — Admin Dashboard Controller
 * All 13 admin panels + login, KPIs, chart, product CRUD, orders, inventory, etc.
 */
class AdminDashboard {
  constructor() {
    this.chart = null;
    this.editingProductId = null;
    this.deletingProductId = null;
    this.productSearch = "";
    this.productCatFilter = "all";
    this.orderStatusFilter = "all";
  }

  init() {
    this.checkAuth();
    if (!window.freshCartAPI.isAdminAuthenticated()) return;
    this.renderKPIs();
    this.initChart();
    this.renderAll();
    this.bindGlobal();
  }

  checkAuth() {
    const overlay = document.getElementById("admin-login-modal");
    if (!window.freshCartAPI.isAdminAuthenticated() && overlay) {
      overlay.classList.remove("hidden");
    } else {
      overlay?.classList.add("hidden");
    }
  }

  login(email, password) {
    const r = window.freshCartAPI.loginAdmin(email, password);
    if (r.success) {
      showToast(`Welcome, ${r.name}!`, "success");
      document.getElementById("admin-login-modal")?.classList.add("hidden");
      this.renderKPIs(); this.renderAll();
      if (window.freshCartAnimations) window.freshCartAnimations.animateKPICounters();
    } else {
      showToast(r.message, "error");
    }
  }

  logout() { window.freshCartAPI.logoutAdmin(); showToast("Logged out.", "info"); setTimeout(() => location.reload(), 600); }

  renderAll() {
    this.renderRecentOrders(); this.renderProductsTable(); this.renderInventory();
    this.renderOrdersTable(); this.renderCategories(); this.renderCustomers();
    this.renderCoupons(); this.renderReviews(); this.renderDelivery(); this.renderPayments(); this.renderReports();
    this.loadSettings();
  }

  bindGlobal() {
    const ps = document.getElementById("admin-product-search");
    if (ps) ps.addEventListener("input", e => { this.productSearch = e.target.value.toLowerCase(); this.renderProductsTable(); });
    const pc = document.getElementById("admin-product-cat-filter");
    if (pc) pc.addEventListener("change", e => { this.productCatFilter = e.target.value; this.renderProductsTable(); });
    const os = document.getElementById("admin-order-status-filter");
    if (os) os.addEventListener("change", e => { this.orderStatusFilter = e.target.value; this.renderOrdersTable(); });
    document.addEventListener("keydown", e => { if (e.key==="Escape") this.closeModal("admin-product-form-modal"); });
  }

  switchView(view) {
    document.querySelectorAll(".admin-view-panel").forEach(p => p.classList.add("hidden"));
    document.getElementById(`admin-panel-${view}`)?.classList.remove("hidden");
    document.querySelectorAll(".admin-nav-item").forEach(item => {
      const isActive = item.dataset.view === view;
      item.classList.toggle("bg-emerald-700", isActive);
      item.classList.toggle("text-white", isActive);
      item.classList.toggle("text-slate-300", !isActive);
      item.classList.toggle("hover:bg-slate-800", !isActive);
    });
    if (view==="dashboard") { this.renderKPIs(); this.initChart(); this.renderRecentOrders(); }
    else if (view==="products")  this.renderProductsTable();
    else if (view==="inventory") this.renderInventory();
    else if (view==="orders")    this.renderOrdersTable();
    else if (view==="categories") this.renderCategories();
    else if (view==="customers") this.renderCustomers();
    else if (view==="coupons")   this.renderCoupons();
    else if (view==="reviews")   this.renderReviews();
    else if (view==="delivery")  this.renderDelivery();
    else if (view==="payments")  this.renderPayments();
    else if (view==="reports")   this.renderReports();
    if (window.lucide) lucide.createIcons();
  }

  renderKPIs() {
    const kpis = window.freshCartAPI.getKPIs();
    const set = (id, val, currency=false, target=val) => {
      const el = document.getElementById(id); if (!el) return;
      el.setAttribute("data-target", target);
      el.setAttribute("data-currency", currency ? "true" : "false");
      el.textContent = currency ? "₹"+val.toLocaleString("en-IN") : val.toLocaleString("en-IN");
    };
    set("kpi-sales", kpis.totalSales, true, kpis.totalSales);
    set("kpi-orders", kpis.ordersCount, false);
    set("kpi-customers", kpis.customersCount, false);
    set("kpi-products", kpis.productsCount, false);
    set("kpi-low-stock", kpis.lowStockCount, false);
    set("kpi-pending", kpis.pendingOrdersCount, false);
  }

  initChart(tf="7days") {
    const canvas = document.getElementById("adminSalesChart");
    if (!canvas || !window.Chart) return;
    if (this.chart) this.chart.destroy();
    const data = {
      "7days":{labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],sales:[42500,51200,48900,62400,78100,94500,108640],orders:[112,134,125,168,204,255,288]},
      "30days":{labels:["Week 1","Week 2","Week 3","Week 4"],sales:[280400,312000,365000,486240],orders:[740,820,960,1286]},
      "3months":{labels:["August","September","October"],sales:[1150000,1380000,1540000],orders:[3100,3700,4150]},
      "1year":{labels:["Q1","Q2","Q3","Q4"],sales:[3800000,4200000,4900000,5600000],orders:[10200,11400,13200,15100]}
    }[tf];
    this.chart = new Chart(canvas.getContext("2d"),{
      type:"bar", data:{ labels:data.labels, datasets:[
        { label:"Sales (₹)", data:data.sales, backgroundColor:"#10b981", borderRadius:8, barThickness:28 },
        { type:"line", label:"Orders", data:data.orders.map(o=>o*100), borderColor:"#0284c7", backgroundColor:"rgba(2,132,199,.1)", tension:.3, borderWidth:2, pointRadius:4, fill:false }
      ]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:"top", labels:{ boxWidth:12, font:{ family:"Plus Jakarta Sans", size:11, weight:"bold" } } },
          tooltip:{ callbacks:{ label:(ctx)=>ctx.dataset.label.includes("Sales")?`Sales: ₹${ctx.raw.toLocaleString("en-IN")}`:`Orders: ${Math.round(ctx.raw/100)}` } } },
        scales:{ x:{ grid:{ display:false }, ticks:{ font:{ family:"Plus Jakarta Sans", size:11 } } },
          y:{ grid:{ color:"#f1f5f9" }, ticks:{ font:{ family:"Plus Jakarta Sans", size:11 }, callback:(v)=>"₹"+(v>=1000?v/1000+"k":v) } } }
      }
    });
    document.querySelectorAll(".chart-tf-btn").forEach(btn => {
      const active = btn.dataset.tf === tf;
      btn.classList.toggle("bg-emerald-600", active); btn.classList.toggle("text-white", active);
      btn.classList.toggle("bg-slate-100", !active); btn.classList.toggle("text-slate-600", !active);
    });
  }

  _trow(cells) { return `<tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-xs">${cells.map(c=>`<td class="py-3 px-4">${c}</td>`).join("")}</tr>`; }
  _status(text, map) {
    const cls = map[text] || "bg-slate-100 text-slate-600";
    return `<span class="px-2.5 py-1 rounded-md text-[10px] font-bold ${cls}">${text}</span>`;
  }

  renderRecentOrders() {
    const tbody = document.getElementById("admin-recent-orders-tbody"); if (!tbody) return;
    tbody.innerHTML = window.freshCartAPI.getOrders().slice(0,5).map(o => this._trow([
      `<span class="font-bold text-slate-900">${o.id}</span>`,
      `<span class="font-semibold">${o.customer.name}</span><span class="block text-[10px] text-slate-400">${o.customer.phone}</span>`,
      new Date(o.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
      o.items.length+" items",
      `<span class="font-bold">₹${o.total}</span>`,
      this._status(o.orderStatus,{Delivered:"bg-emerald-100 text-emerald-800",Cancelled:"bg-red-100 text-red-800","Out for Delivery":"bg-amber-100 text-amber-800",Preparing:"bg-blue-100 text-blue-800",Confirmed:"bg-blue-100 text-blue-800"}),
      `<button onclick="window.adminDash.openOrderModal('${o.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg font-bold text-[11px] transition-colors">View</button>`
    ])).join("");
  }

  renderProductsTable() {
    const tbody = document.getElementById("admin-products-tbody"); if (!tbody) return;
    let products = window.freshCartAPI.getProducts();
    if (this.productSearch) products = products.filter(p => p.name.toLowerCase().includes(this.productSearch)||p.sku.toLowerCase().includes(this.productSearch)||p.brand.toLowerCase().includes(this.productSearch));
    if (this.productCatFilter!=="all") products = products.filter(p => p.category===this.productCatFilter);
    const count = document.getElementById("admin-products-count"); if (count) count.textContent=`${products.length} products`;
    tbody.innerHTML = products.map(p => this._trow([
      `<div class="flex items-center gap-3"><img src="${p.image}" alt="${p.name}" class="w-10 h-10 object-cover rounded-lg"><div><span class="font-bold block line-clamp-1">${p.name}</span><span class="text-[10px] text-slate-400">SKU: ${p.sku} • ${p.unit}</span></div></div>`,
      `<span class="capitalize">${p.category.replace(/-/g," ")}</span>`,
      p.brand,
      `<span class="font-extrabold">₹${p.price}</span>`,
      p.discount>0?`<span class="font-semibold text-emerald-600">${p.discount}%</span>`:"—",
      `<span class="font-bold ${p.stock<=p.minStock?"text-amber-600":""}">${p.stock}</span>${p.stock<=p.minStock?'<span class="block text-[9px] text-amber-500 font-bold">Low</span>':""}`,
      this._status(p.stock>0?"Active":"Out of Stock",{Active:"bg-emerald-100 text-emerald-800","Out of Stock":"bg-red-100 text-red-800"}),
      `<div class="flex items-center gap-1.5">
        <button onclick="window.adminDash.openEditProduct('${p.id}')" class="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
        <button onclick="window.adminDash.openDeleteProduct('${p.id}')" class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </div>`
    ])).join("");
    if (window.lucide) lucide.createIcons();
  }

  openAddProduct() {
    this.editingProductId = null;
    document.getElementById("product-modal-title").textContent = "Add New Product";
    document.getElementById("admin-product-form")?.reset();
    document.getElementById("pf-id").value = "";
    document.getElementById("pf-img-preview").src = "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80";
    document.getElementById("admin-product-form-modal")?.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();
  }

  openEditProduct(id) {
    const p = window.freshCartAPI.getProductById(id); if (!p) return;
    this.editingProductId = id;
    document.getElementById("product-modal-title").textContent = `Edit: ${p.name}`;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set("pf-id", p.id); set("pf-name", p.name); set("pf-sku", p.sku); set("pf-brand", p.brand);
    set("pf-category", p.category); set("pf-price", p.price); set("pf-mrp", p.originalPrice);
    set("pf-discount", p.discount||0); set("pf-stock", p.stock); set("pf-minstock", p.minStock||5);
    set("pf-unit", p.unit); set("pf-image", p.image); set("pf-desc", p.description);
    document.getElementById("pf-img-preview").src = p.image;
    document.getElementById("admin-product-form-modal")?.classList.remove("hidden");
  }

  saveProduct(e) {
    e?.preventDefault();
    const g = id => document.getElementById(id)?.value.trim();
    const name=g("pf-name"), price=Number(g("pf-price")), stock=Number(g("pf-stock"));
    if (!name||isNaN(price)||isNaN(stock)) { showToast("Provide valid name, price, and stock.", "warning"); return; }
    const payload = { name, sku:g("pf-sku"), brand:g("pf-brand"), category:g("pf-category"),
      price, originalPrice:Number(g("pf-mrp")||price), discount:Number(g("pf-discount")||0),
      stock, minStock:Number(g("pf-minstock")||5), unit:g("pf-unit"), image:g("pf-image")||"https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80",
      description:g("pf-desc") };
    const id = document.getElementById("pf-id")?.value;
    if (id) { window.freshCartAPI.updateProduct(id, payload); showToast(`"${name}" updated!`, "success"); }
    else     { window.freshCartAPI.addProduct(payload);       showToast(`"${name}" added!`, "success"); }
    this.closeModal("admin-product-form-modal");
    this.renderProductsTable(); this.renderInventory(); this.renderKPIs();
  }

  openDeleteProduct(id) {
    const p = window.freshCartAPI.getProductById(id); if (!p) return;
    this.deletingProductId = id;
    const el = document.getElementById("admin-delete-name"); if (el) el.textContent = p.name;
    document.getElementById("admin-delete-modal")?.classList.remove("hidden");
  }

  confirmDelete() {
    if (!this.deletingProductId) return;
    window.freshCartAPI.deleteProduct(this.deletingProductId);
    showToast("Product deleted.", "info");
    this.closeModal("admin-delete-modal");
    this.deletingProductId = null;
    this.renderProductsTable(); this.renderInventory(); this.renderKPIs();
  }

  renderInventory() {
    const tbody = document.getElementById("admin-inventory-tbody"); if (!tbody) return;
    tbody.innerHTML = window.freshCartAPI.getProducts().map(p => {
      const out=p.stock<=0, low=p.stock>0&&p.stock<=p.minStock;
      return this._trow([
        `<div class="flex items-center gap-2.5"><img src="${p.image}" class="w-8 h-8 rounded-lg object-cover"><div><span class="font-bold">${p.name}</span><span class="block text-[10px] text-slate-400">${p.sku}</span></div></div>`,
        `<span class="font-bold ${out?"text-red-600":low?"text-amber-600":""}">${p.stock}</span>`,
        p.minStock,
        this._status(out?"Out of Stock":low?"Low Stock":"In Stock",{"In Stock":"bg-emerald-100 text-emerald-800","Low Stock":"bg-amber-100 text-amber-800","Out of Stock":"bg-red-100 text-red-800"}),
        `<button onclick="window.adminDash.quickRestock('${p.id}')" class="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg font-bold text-[11px] transition-colors">+25 Restock</button>`
      ]);
    }).join("");
  }

  quickRestock(id) {
    const p = window.freshCartAPI.restockProduct(id, 25);
    if (p) { showToast(`Restocked 25 units for ${p.name}. New: ${p.stock}`, "success"); this.renderInventory(); this.renderProductsTable(); this.renderKPIs(); }
  }

  renderOrdersTable() {
    const tbody = document.getElementById("admin-orders-tbody"); if (!tbody) return;
    let orders = window.freshCartAPI.getOrders();
    if (this.orderStatusFilter!=="all") orders = orders.filter(o=>o.orderStatus===this.orderStatusFilter);
    const count = document.getElementById("admin-orders-count"); if (count) count.textContent = `${orders.length} orders`;
    const statusMap = { Delivered:"bg-emerald-100 text-emerald-800", Cancelled:"bg-red-100 text-red-800", "Out for Delivery":"bg-amber-100 text-amber-800", Preparing:"bg-blue-100 text-blue-800", Confirmed:"bg-blue-100 text-blue-800", New:"bg-slate-100 text-slate-700" };
    tbody.innerHTML = orders.map(o => this._trow([
      `<span class="font-bold">${o.id}</span>`,
      `<span class="font-semibold">${o.customer.name}</span><span class="block text-[10px] text-slate-400">${o.customer.phone}</span>`,
      new Date(o.createdAt).toLocaleDateString(),
      o.items.length+" items",
      `<span class="font-bold">₹${o.total}</span>`,
      o.paymentMethod,
      `<select onchange="window.adminDash.changeStatus('${o.id}',this.value)" class="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500">
        ${["New","Confirmed","Preparing","Packed","Out for Delivery","Delivered","Cancelled"].map(s=>`<option ${o.orderStatus===s?"selected":""}>${s}</option>`).join("")}
      </select>`,
      `<button onclick="window.adminDash.openOrderModal('${o.id}')" class="px-3 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg font-bold text-[11px] transition-colors">Details</button>`
    ])).join("");
  }

  changeStatus(id, status) {
    window.freshCartAPI.updateOrderStatus(id, status);
    showToast(`Order ${id} → "${status}"`, "success");
    this.renderOrdersTable(); this.renderRecentOrders(); this.renderKPIs();
  }

  openOrderModal(id) {
    const o = window.freshCartAPI.getOrder(id); if (!o) return;
    const modal   = document.getElementById("admin-order-modal");
    const content = document.getElementById("admin-order-modal-content");
    if (!modal||!content) return;
    content.innerHTML = `<div class="p-6 space-y-5">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>${this._status(o.orderStatus,{Delivered:"bg-emerald-100 text-emerald-800",Cancelled:"bg-red-100 text-red-800","Out for Delivery":"bg-amber-100 text-amber-800"})}<h3 class="text-lg font-extrabold mt-1">Order #${o.id}</h3><p class="text-xs text-slate-400">${new Date(o.createdAt).toLocaleString()}</p></div>
        <button onclick="window.freshCartApp?.printOrderReceipt?.('${o.id}')||window.print()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1"><i data-lucide="printer" class="w-3.5 h-3.5"></i> Print</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200"><h4 class="font-bold mb-2">Customer & Delivery</h4>
          <p class="font-bold">${o.customer.name} • ${o.customer.phone}</p>
          <p class="text-slate-500 mt-1">${o.customer.address}, ${o.customer.city}, ${o.customer.state} - ${o.customer.pincode}</p>
          <p class="mt-1">Slot: <strong>${o.deliverySlot}</strong></p><p>Partner: <strong>${o.deliveryPartner||"Assigned"}</strong></p>
        </div>
        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200"><h4 class="font-bold mb-2">Payment</h4>
          <p>${o.paymentMethod} — <strong class="${o.paymentStatus==="Paid"?"text-emerald-700":"text-amber-700"}">${o.paymentStatus}</strong></p>
          <div class="border-t border-slate-200 mt-2 pt-2 space-y-1">
            <div class="flex justify-between"><span>Subtotal</span><span>₹${o.subtotal}</span></div>
            <div class="flex justify-between"><span>Delivery</span><span>${o.deliveryFee===0?"FREE":"₹"+o.deliveryFee}</span></div>
            ${o.discount>0?`<div class="flex justify-between text-emerald-600"><span>Discount</span><span>-₹${o.discount}</span></div>`:""}
            <div class="flex justify-between font-extrabold text-sm border-t pt-1 mt-1"><span>Total</span><span class="text-emerald-700">₹${o.total}</span></div>
          </div>
        </div>
      </div>
      <div><h4 class="text-xs font-bold uppercase tracking-wider mb-2">Items</h4>
        <div class="space-y-2 max-h-48 overflow-y-auto">${o.items.map(i=>{
          const prod = window.freshCartAPI.getProductById(i.productId);
          const img = (prod && prod.image) ? prod.image : i.image;
          return `<div class="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-xs"><div class="flex items-center gap-2"><img src="${img}" class="w-8 h-8 rounded-md object-cover"><div><h5 class="font-bold">${i.name}</h5><span class="text-[10px] text-slate-500">${i.unit} × ${i.quantity}</span></div></div><span class="font-bold">₹${i.price*i.quantity}</span></div>`;
        }).join("")}</div>
      </div>
    </div>`;
    modal.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();
  }

  renderCategories() {
    const tbody = document.getElementById("admin-categories-tbody"); if (!tbody) return;
    tbody.innerHTML = window.freshCartAPI.getCategories().map(c => this._trow([
      `<div class="flex items-center gap-2.5"><img src="${c.image}" class="w-8 h-8 rounded-lg object-cover"><span class="font-bold">${c.name}</span></div>`,
      `<span class="text-slate-500">${c.description}</span>`,
      c.itemCount+" items",
      this._status(c.status,{Active:"bg-emerald-100 text-emerald-800",Disabled:"bg-slate-100 text-slate-500"}),
      `<button onclick="if(confirm('Delete ${c.name}?')){window.freshCartAPI.deleteCategory('${c.id}');window.adminDash.renderCategories();showToast('Category removed.','info');}" class="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`
    ])).join("");
    if (window.lucide) lucide.createIcons();
  }

  renderCustomers() {
    const tbody = document.getElementById("admin-customers-tbody"); if (!tbody) return;
    tbody.innerHTML = window.freshCartAPI.getCustomers().map(c => this._trow([
      `<div class="flex items-center gap-2.5"><img src="${c.avatar}" class="w-8 h-8 rounded-full object-cover"><div><span class="font-bold">${c.name}</span><span class="block text-[10px] text-slate-400">${c.city}, ${c.state}</span></div></div>`,
      c.phone, c.email,
      `<span class="font-bold">${c.ordersCount}</span>`,
      `<span class="font-extrabold">₹${c.totalSpent.toLocaleString("en-IN")}</span>`,
      this._status(c.status,{Active:"bg-emerald-100 text-emerald-800",Inactive:"bg-slate-100 text-slate-500"})
    ])).join("");
  }

  renderCoupons() {
    const tbody = document.getElementById("admin-coupons-tbody"); if (!tbody) return;
    tbody.innerHTML = window.freshCartAPI.getCoupons().map(c => this._trow([
      `<span class="font-extrabold text-emerald-700 tracking-wider">${c.code}</span>`,
      c.discountType,
      c.discountType==="percentage"?`${c.discountValue}%`:`₹${c.discountValue}`,
      `₹${c.minOrder}`, c.expiry,
      `${c.usedCount} / ${c.usageLimit}`,
      `<button onclick="if(confirm('Delete ${c.code}?')){window.freshCartAPI.deleteCoupon('${c.code}');window.adminDash.renderCoupons();showToast('Coupon deleted.','info');}" class="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`
    ])).join("");
    if (window.lucide) lucide.createIcons();
  }

  addCouponPrompt() {
    const code  = prompt("Coupon code (e.g. MEGA50):");  if (!code) return;
    const value = prompt("Discount amount in ₹:", "50");
    const min   = prompt("Minimum order ₹:", "499");
    window.freshCartAPI.addCoupon({ code, discountType:"flat", discountValue:Number(value)||50, minOrder:Number(min)||499, maxDiscount:Number(value)||50, expiry:"2026-12-31", usageLimit:500 });
    showToast(`Coupon ${code} created!`, "success"); this.renderCoupons();
  }

  renderReviews() {
    const tbody = document.getElementById("admin-reviews-tbody"); if (!tbody) return;
    tbody.innerHTML = window.freshCartAPI.getReviews().map(r => this._trow([
      r.customerName, r.productName,
      `<span class="text-amber-500 font-bold">★ ${r.rating}</span>`,
      `<span class="truncate max-w-xs block">${r.comment}</span>`,
      r.date,
      this._status(r.status,{Approved:"bg-emerald-100 text-emerald-800",Hidden:"bg-slate-100 text-slate-500"})
    ])).join("");
  }

  renderDelivery() {
    const tbody = document.getElementById("admin-delivery-tbody"); if (!tbody) return;
    tbody.innerHTML = window.freshCartAPI.getOrders().map(o => this._trow([
      o.id, `${o.customer.name} (${o.customer.city})`,
      o.deliveryPartner||"Ramesh Reddy", o.deliverySlot,
      this._status(o.orderStatus,{Delivered:"bg-emerald-100 text-emerald-800",Cancelled:"bg-red-100 text-red-800","Out for Delivery":"bg-amber-100 text-amber-800"})
    ])).join("");
  }

  renderPayments() {
    const tbody = document.getElementById("admin-payments-tbody"); if (!tbody) return;
    tbody.innerHTML = window.freshCartAPI.getOrders().map((o,i) => this._trow([
      `<span class="font-mono text-[11px]">TXN-${8000+i}</span>`,
      o.id, o.customer.name,
      `<span class="font-extrabold">₹${o.total}</span>`,
      o.paymentMethod,
      this._status(o.paymentStatus,{Paid:"bg-emerald-100 text-emerald-800",Pending:"bg-amber-100 text-amber-800",Failed:"bg-red-100 text-red-800"})
    ])).join("");
  }

  renderReports() {
    const r = document.getElementById("report-revenue");
    if (r) { const kpis=window.freshCartAPI.getKPIs(); r.textContent="₹"+kpis.totalSales.toLocaleString("en-IN"); }
  }

  loadSettings() {
    const s = window.freshCartAPI.getSettings();
    const t = document.getElementById("setting-threshold"); if (t) t.value = s.freeDeliveryThreshold;
    const f = document.getElementById("setting-fee");       if (f) f.value = s.defaultDeliveryFee;
  }

  saveSettings(e) {
    e?.preventDefault();
    window.freshCartAPI.updateSettings({ freeDeliveryThreshold:Number(document.getElementById("setting-threshold")?.value||499), defaultDeliveryFee:Number(document.getElementById("setting-fee")?.value||49) });
    showToast("Settings saved!", "success");
  }

  exportCSV() {
    const orders = window.freshCartAPI.getOrders();
    let csv = "data:text/csv;charset=utf-8,Order ID,Customer,Phone,City,Total,Payment,Status,Date\n";
    orders.forEach(o => { csv += `${o.id},"${o.customer.name}","${o.customer.phone}","${o.customer.city}",${o.total},"${o.paymentMethod}","${o.orderStatus}","${o.createdAt}"\n`; });
    const a = Object.assign(document.createElement("a"), { href:encodeURI(csv), download:`FreshCart_Orders_${new Date().toISOString().split("T")[0]}.csv` });
    document.body.appendChild(a); a.click(); a.remove();
    showToast("CSV exported!", "success");
  }

  closeModal(id) { document.getElementById(id)?.classList.add("hidden"); }
}

window.adminDash = new AdminDashboard();
document.addEventListener("DOMContentLoaded", () => window.adminDash.init());
