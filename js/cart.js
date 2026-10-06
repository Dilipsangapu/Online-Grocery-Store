/**
 * FreshCart — Toast notification helper (shared across all pages)
 */
function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const colors = {
    success: "bg-emerald-900 text-white border-emerald-700",
    error:   "bg-red-900 text-white border-red-700",
    warning: "bg-amber-900 text-white border-amber-700",
    info:    "bg-slate-900 text-white border-slate-700"
  };
  const icons = {
    success: "check-circle-2",
    error:   "alert-circle",
    warning: "alert-triangle",
    info:    "info"
  };
  const toast = document.createElement("div");
  toast.className = `toast-item flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all transform translate-y-2 opacity-0 ${colors[type]||colors.info}`;
  toast.innerHTML = `<i data-lucide="${icons[type]||"info"}" class="w-5 h-5 flex-shrink-0 opacity-80"></i><div class="flex-1">${message}</div><button onclick="this.parentElement.remove()" class="text-white/60 hover:text-white p-1"><i data-lucide="x" class="w-4 h-4"></i></button>`;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => toast.classList.remove("translate-y-2","opacity-0"), 10);
  setTimeout(() => { toast.classList.add("opacity-0","translate-y-2"); setTimeout(() => toast.remove(), 300); }, 3500);
}

/**
 * Cart Manager — shared cart state used on all pages
 */
class CartManager {
  constructor() {
    this.cart = window.freshCartAPI.getCart();
    this.appliedCoupon = null;
  }

  getCart() { return this.cart; }

  addItem(productId, quantity = 1) {
    const product = window.freshCartAPI.getProductById(productId);
    if (!product) { showToast("Product not found.", "error"); return; }
    if (product.stock < quantity) { showToast(`Only ${product.stock} units in stock.`, "warning"); return; }
    const idx = this.cart.findIndex(i => i.productId === productId);
    if (idx > -1) {
      const newQty = this.cart[idx].quantity + quantity;
      if (newQty > product.stock) { showToast(`Stock limit: ${product.stock} units.`, "warning"); return; }
      this.cart[idx].quantity = newQty;
    } else {
      this.cart.push({ productId: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, unit: product.unit, image: product.image, category: product.category, quantity });
    }
    window.freshCartAPI.saveCart(this.cart);
    this.updateBadges();
    showToast(`${product.name} added to cart!`, "success");
    if (window.gsap) gsap.fromTo(".cart-btn-icon", { scale: 1.4 }, { scale: 1, duration: .3, ease: "back.out(2)" });
  }

  updateQuantity(productId, qty) {
    if (qty <= 0) { this.removeItem(productId); return; }
    const idx = this.cart.findIndex(i => i.productId === productId);
    if (idx < 0) return;
    this.cart[idx].quantity = qty;
    window.freshCartAPI.saveCart(this.cart);
    this.updateBadges();
    this.renderDrawer();
  }

  removeItem(productId) {
    const item = this.cart.find(i => i.productId === productId);
    this.cart = this.cart.filter(i => i.productId !== productId);
    window.freshCartAPI.saveCart(this.cart);
    this.updateBadges();
    this.renderDrawer();
    if (item) showToast(`${item.name} removed.`, "info");
  }

  clearCart() {
    this.cart = []; this.appliedCoupon = null;
    window.freshCartAPI.saveCart(this.cart);
    this.updateBadges(); this.renderDrawer();
  }

  applyCoupon(code) {
    if (!code) { showToast("Enter a coupon code.", "warning"); return false; }
    const r = window.freshCartAPI.validateCoupon(code, this.getCalcs().subtotal);
    if (r.valid) {
      this.appliedCoupon = { code: r.coupon.code, discount: r.discount };
      this.renderDrawer(); showToast(r.message, "success"); return true;
    }
    showToast(r.message, "error"); return false;
  }

  removeCoupon() { this.appliedCoupon = null; this.renderDrawer(); showToast("Coupon removed.", "info"); }

  getCalcs() {
    const subtotal = this.cart.reduce((s,i) => s + i.price * i.quantity, 0);
    const settings = window.freshCartAPI.getSettings();
    const threshold = settings.freeDeliveryThreshold || 499;
    const deliveryFee = (subtotal >= threshold || subtotal === 0) ? 0 : (settings.defaultDeliveryFee || 49);
    let discount = 0;
    if (this.appliedCoupon) {
      const v = window.freshCartAPI.validateCoupon(this.appliedCoupon.code, subtotal);
      discount = v.valid ? v.discount : 0;
      if (!v.valid) this.appliedCoupon = null;
    }
    const total = Math.max(0, subtotal + deliveryFee - discount);
    const itemCount = this.cart.reduce((s,i) => s + i.quantity, 0);
    return { subtotal, deliveryFee, discount, total, itemCount, threshold, freeDeliveryShortfall: Math.max(0, threshold - subtotal), freeDeliveryProgress: Math.min(100, Math.round(subtotal / threshold * 100)) };
  }

  updateBadges() {
    const { itemCount, total } = this.getCalcs();
    document.querySelectorAll(".cart-count-badge").forEach(el => { el.textContent = itemCount; el.classList.toggle("hidden", itemCount === 0); });
    document.querySelectorAll(".cart-total-badge").forEach(el => { el.textContent = `₹${total}`; });
    const wl = window.freshCartAPI.getWishlist();
    document.querySelectorAll(".wishlist-count-badge").forEach(el => { el.textContent = wl.length; el.classList.toggle("hidden", wl.length === 0); });
  }

  renderDrawer() {
    const itemsEl   = document.getElementById("cart-items-container");
    const summaryEl = document.getElementById("cart-summary-container");
    const emptyEl   = document.getElementById("cart-empty-state");
    const footerEl  = document.getElementById("cart-drawer-footer");
    if (!itemsEl) return;
    const calcs = this.getCalcs();

    if (this.cart.length === 0) {
      itemsEl.innerHTML = "";
      emptyEl?.classList.remove("hidden");
      summaryEl?.classList.add("hidden");
      footerEl?.classList.add("hidden");
      return;
    }
    emptyEl?.classList.add("hidden");
    summaryEl?.classList.remove("hidden");
    footerEl?.classList.remove("hidden");

    itemsEl.innerHTML = this.cart.map(item => `
      <div class="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-emerald-200 transition-colors">
        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-slate-50">
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-semibold text-slate-900 truncate">${item.name}</h4>
          <p class="text-[11px] text-slate-500">${item.unit}</p>
          <div class="flex items-center justify-between mt-1">
            <span class="text-xs font-bold text-slate-900">₹${item.price}</span>
            <div class="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
              <button onclick="window.cartManager.updateQuantity('${item.productId}',${item.quantity-1})" class="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 font-bold" aria-label="Decrease">-</button>
              <span class="px-2 py-0.5 text-xs font-semibold bg-white">${item.quantity}</span>
              <button onclick="window.cartManager.updateQuantity('${item.productId}',${item.quantity+1})" class="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 font-bold" aria-label="Increase">+</button>
            </div>
          </div>
        </div>
        <button onclick="window.cartManager.removeItem('${item.productId}')" class="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" aria-label="Remove"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </div>`).join("");

    summaryEl.innerHTML = `
      <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-3">
        <div class="flex justify-between text-xs mb-1.5">
          <span class="font-medium text-emerald-900">${calcs.freeDeliveryShortfall===0?'<span class="flex items-center gap-1 font-semibold text-emerald-700"><i data-lucide="check-circle" class="w-3.5 h-3.5 inline"></i> FREE Delivery unlocked!</span>':`Add <strong class="text-emerald-800">₹${calcs.freeDeliveryShortfall}</strong> more for <strong>FREE Delivery</strong>`}</span>
          <span class="text-[11px] font-bold text-emerald-700">${calcs.freeDeliveryProgress}%</span>
        </div>
        <div class="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
          <div class="bg-emerald-600 h-full rounded-full transition-all duration-300" style="width:${calcs.freeDeliveryProgress}%"></div>
        </div>
      </div>
      <div class="mb-3">${this.appliedCoupon?`
        <div class="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
          <div class="flex items-center gap-1.5"><i data-lucide="tag" class="w-4 h-4 text-emerald-600"></i><span class="font-bold text-emerald-800">${this.appliedCoupon.code}</span><span class="text-slate-500">(-₹${this.appliedCoupon.discount})</span></div>
          <button onclick="window.cartManager.removeCoupon()" class="text-xs font-semibold text-red-600 hover:underline">Remove</button>
        </div>`:`
        <div class="flex gap-1.5">
          <input id="cart-coupon-input" type="text" placeholder="Promo code (WELCOME100)" class="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 uppercase">
          <button onclick="window.cartManager.applyCoupon(document.getElementById('cart-coupon-input').value)" class="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600">Apply</button>
        </div>`}
      </div>
      <div class="space-y-1.5 text-xs border-t border-slate-100 pt-2.5">
        <div class="flex justify-between text-slate-600"><span>Subtotal (${calcs.itemCount} items)</span><span class="font-medium text-slate-800">₹${calcs.subtotal}</span></div>
        <div class="flex justify-between text-slate-600"><span>Delivery</span><span class="font-medium ${calcs.deliveryFee===0?"text-emerald-600 font-semibold":"text-slate-800"}">${calcs.deliveryFee===0?"FREE":"₹"+calcs.deliveryFee}</span></div>
        ${calcs.discount>0?`<div class="flex justify-between text-emerald-600 font-medium"><span>Coupon Discount</span><span>-₹${calcs.discount}</span></div>`:""}
        <div class="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-100 pt-2"><span>Total Amount</span><span class="text-emerald-700">₹${calcs.total}</span></div>
      </div>`;
    if (window.lucide) lucide.createIcons();
  }

  openDrawer() {
    const drawer  = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");
    if (!drawer || !overlay) return;
    drawer.classList.remove("translate-x-full");
    overlay.classList.remove("hidden");
    setTimeout(() => overlay.classList.remove("opacity-0"), 10);
    this.renderDrawer();
  }

  closeDrawer() {
    const drawer  = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");
    if (!drawer || !overlay) return;
    drawer.classList.add("translate-x-full");
    overlay.classList.add("opacity-0");
    setTimeout(() => overlay.classList.add("hidden"), 300);
  }
}

window.cartManager = new CartManager();

// Init badges on load
document.addEventListener("DOMContentLoaded", () => {
  window.cartManager.updateBadges();
});
