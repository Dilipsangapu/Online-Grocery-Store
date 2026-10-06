/**
 * FreshCart — app.js
 * Main customer app controller (homepage, categories, deals, wishlist helpers, modals, nav)
 */
class FreshCartApp {
  constructor() {
    this.location = "Tirupati, Andhra Pradesh";
  }

  init() {
    this.renderCategories();
    this.renderDeals();
    this.updateLocation();
    if (window.freshCartAnimations) window.freshCartAnimations.init();
  }

  updateLocation() {
    document.querySelectorAll(".current-location-text").forEach(el => el.textContent = this.location);
  }

  setLocation(loc) {
    this.location = loc;
    this.updateLocation();
    this.closeModal("location-modal");
    showToast(`Location set to ${loc}`, "success");
  }

  renderCategories() {
    const grid = document.getElementById("categories-grid"); if (!grid) return;
    const cats = window.freshCartAPI.getCategories();
    grid.innerHTML = cats.map(cat => `
      <a href="shop.html?category=${cat.id}" class="category-item-card category-card-hover group flex flex-col items-center text-center p-3.5 bg-white border border-slate-200/80 rounded-2xl cursor-pointer shadow-xs hover:border-emerald-400">
        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50/70 p-1.5 mb-2.5 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
          <img src="${cat.image}" alt="${cat.name}" class="w-full h-full object-cover rounded-xl" loading="lazy">
        </div>
        <h3 class="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors leading-tight">${cat.name}</h3>
        <span class="text-[11px] text-slate-500 mt-0.5">${cat.itemCount} items</span>
      </a>`).join("");
    if (window.freshCartAnimations) window.freshCartAnimations.animateCategoryCards();
  }

  renderDeals() {
    const grid = document.getElementById("deals-grid"); if (!grid) return;
    const deals = [
      { title:"Fresh Harvest Deals", discount:"UP TO 30% OFF", desc:"Crisp organic apples, Devgad Alphonso & farm greens", tag:"FRUITS & VEGGIES", image:"https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80", cat:"fruits" },
      { title:"Pure Vedic Essentials", discount:"BUY 1 GET 1 AT 50%", desc:"A2 Gir cow ghee, cold-pressed oils & Kashmiri kesar", tag:"COOKING STAPLES", image:"https://crm.swadeshivip.com/storage/images/uploads/image_20241112_150359.png", cat:"cooking-essentials" },
      { title:"Artisan Bakery Basket", discount:"FLAT 20% OFF", desc:"Sourdough loaves, flaky butter croissants & cookies", tag:"FRESH BAKERY", image:"https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80", cat:"bakery" }
    ];
    grid.innerHTML = deals.map(d => `
      <a href="shop.html?category=${d.cat}&deals=1" class="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 flex flex-col justify-between cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300">
        <img src="${d.image}" alt="${d.title}" class="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500">
        <div class="relative z-10">
          <span class="inline-block px-3 py-1 bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider rounded-lg mb-2">${d.tag}</span>
          <h3 class="text-xl font-black">${d.title}</h3>
          <p class="text-xs text-slate-200 mt-1 max-w-[220px]">${d.desc}</p>
        </div>
        <div class="relative z-10 mt-8 flex items-center justify-between">
          <span class="text-sm font-black text-amber-300">${d.discount}</span>
          <span class="px-3.5 py-1.5 bg-white text-slate-900 group-hover:bg-emerald-400 font-bold text-xs rounded-xl transition-colors flex items-center gap-1">Shop Deals <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></span>
        </div>
      </a>`).join("");
    if (window.lucide) lucide.createIcons();
  }

  copyCoupon(code) {
    navigator.clipboard.writeText(code).catch(() => {});
    showToast(`Coupon '${code}' copied!`, "success");
  }

  openModal(id) { document.getElementById(id)?.classList.remove("hidden"); if (window.lucide) lucide.createIcons(); }
  closeModal(id) { document.getElementById(id)?.classList.add("hidden"); }

  closeAllModals() {
    document.querySelectorAll(".app-modal").forEach(m => m.classList.add("hidden"));
    window.cartManager?.closeDrawer();
  }
}

window.freshCartApp = new FreshCartApp();
document.addEventListener("DOMContentLoaded", () => window.freshCartApp.init());
