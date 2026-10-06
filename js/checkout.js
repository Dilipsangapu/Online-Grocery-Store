/**
 * FreshCart — Checkout Controller
 * Handles checkout form validation, order placement, and order success.
 */
class CheckoutController {
  init() {
    this.renderSummary();
    this.bindEvents();
  }

  bindEvents() {
    const btn = document.getElementById("place-order-btn");
    if (btn) btn.addEventListener("click", () => this.placeOrder());
  }

  renderSummary() {
    const container = document.getElementById("checkout-order-summary");
    if (!container || !window.cartManager) return;
    const cart  = window.cartManager.getCart();
    const calcs = window.cartManager.getCalcs();

    if (cart.length === 0 && window.location.pathname.includes("checkout")) {
      showToast("Your cart is empty. Redirecting…", "warning");
      setTimeout(() => window.location.href = "shop.html", 1500);
      return;
    }

    container.innerHTML = `
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>Order Summary</span><span class="text-emerald-700 font-bold">${calcs.itemCount} Items</span>
        </h4>
        <div class="max-h-52 overflow-y-auto space-y-2 pr-1">
          ${cart.map(item=>`
            <div class="flex items-center justify-between text-xs py-1">
              <div class="flex items-center gap-2 truncate pr-2">
                <img src="${item.image}" alt="${item.name}" class="w-8 h-8 rounded-md object-cover flex-shrink-0">
                <span class="truncate text-slate-700 font-medium">${item.name} <span class="text-slate-400">×${item.quantity}</span></span>
              </div>
              <span class="font-bold text-slate-900 flex-shrink-0">₹${item.price*item.quantity}</span>
            </div>`).join("")}
        </div>
        <div class="space-y-2 text-xs border-t border-slate-100 pt-3">
          <div class="flex justify-between text-slate-600"><span>Subtotal</span><span class="font-medium">₹${calcs.subtotal}</span></div>
          <div class="flex justify-between text-slate-600"><span>Delivery</span><span class="font-medium ${calcs.deliveryFee===0?"text-emerald-600 font-semibold":""}">${calcs.deliveryFee===0?"FREE":"₹"+calcs.deliveryFee}</span></div>
          ${calcs.discount>0?`<div class="flex justify-between text-emerald-600 font-medium"><span>Discount</span><span>-₹${calcs.discount}</span></div>`:""}
          <div class="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-100 pt-3"><span>Grand Total</span><span class="text-emerald-700">₹${calcs.total}</span></div>
        </div>
        <button id="place-order-btn" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2">
          <i data-lucide="shield-check" class="w-4 h-4"></i> Place Order (₹${calcs.total})
        </button>
        <p class="text-[10px] text-center text-slate-400">🔒 256-Bit SSL Encrypted & Secure Checkout</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    this.bindEvents();
  }

  placeOrder() {
    const name   = document.getElementById("co-name")?.value.trim();
    const phone  = document.getElementById("co-phone")?.value.trim();
    const email  = document.getElementById("co-email")?.value.trim();
    const addr   = document.getElementById("co-address")?.value.trim();
    const city   = document.getElementById("co-city")?.value.trim();
    const state  = document.getElementById("co-state")?.value.trim();
    const pin    = document.getElementById("co-pincode")?.value.trim();
    const slot   = document.querySelector("input[name='delivery-slot']:checked")?.value || "30–60 minutes";
    const pay    = document.querySelector("input[name='payment-method']:checked")?.value || "UPI";

    if (!name||!phone||!addr||!city||!pin) { showToast("Please fill in all mandatory fields (*).", "warning"); return; }

    const calcs = window.cartManager.getCalcs();
    const cart  = window.cartManager.getCart();

    const order = window.freshCartAPI.createOrder({
      customer:{ name, phone, email, address:addr, city, state, pincode:pin },
      items: cart, subtotal:calcs.subtotal, deliveryFee:calcs.deliveryFee,
      discount:calcs.discount, couponCode:window.cartManager.appliedCoupon?.code||null,
      tax:0, total:calcs.total, paymentMethod:pay,
      paymentStatus:pay==="Cash on Delivery"?"Pending":"Paid",
      deliverySlot:slot
    });

    window.cartManager.clearCart();

    // Save last order ID for success & tracking pages
    sessionStorage.setItem("lastOrderId", order.id);
    showToast("🎉 Order placed successfully!", "success");
    setTimeout(() => window.location.href = "order-success.html", 800);
  }
}

window.checkoutCtrl = new CheckoutController();
document.addEventListener("DOMContentLoaded", () => window.checkoutCtrl.init());
