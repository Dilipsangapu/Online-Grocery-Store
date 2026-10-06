/**
 * FreshCart — Products Page Controller
 * Handles: catalog render, deals filtering, search, filtering, sorting, product detail modal, wishlist toggle
 * Clean SVG icons throughout (no emojis)
 */
class ProductsController {
  constructor() {
    this.category = "all";
    this.dealsOnly = false;
    this.search = "";
    this.priceRange = "all";
    this.rating = "all";
    this.availability = "all";
    this.discount = "all";
    this.sort = "popular";
  }

  init() {
    // Check URL parameters on initialization
    const params = new URLSearchParams(window.location.search);
    if (params.get("deals") === "1" || params.get("deals") === "true") {
      this.dealsOnly = true;
    }
    const cat = params.get("category");
    if (cat && cat !== "all") {
      this.category = cat;
    }

    this.updateDealsHeader();
    this.renderCategoryPills();
    this.renderProducts();
    this.bindEvents();
  }

  bindEvents() {
    // Search
    const s = document.getElementById("product-search-input");
    if (s) s.addEventListener("input", e => { this.search = e.target.value.trim().toLowerCase(); this.renderProducts(); });

    // Sort
    const sort = document.getElementById("product-sort-select");
    if (sort) sort.addEventListener("change", e => { this.sort = e.target.value; this.renderProducts(); });

    // Filter radios
    ["price","rating","availability","discount"].forEach(name => {
      document.querySelectorAll(`.filter-${name}-radio`).forEach(el => {
        el.addEventListener("change", e => { this[name==="price"?"priceRange":name] = e.target.value; this.renderProducts(); });
      });
    });

    // Escape to close modal
    document.addEventListener("keydown", e => { if (e.key === "Escape") this.closeModal(); });
  }

  getFiltered() {
    let p = window.freshCartAPI.getProducts();

    // Deals filter: products with >=15% discount or with a deal/offer badge
    if (this.dealsOnly) {
      p = p.filter(x => (Number(x.discount) >= 15) || (x.badge && (x.badge.toLowerCase().includes("deal") || x.badge.toLowerCase().includes("off") || x.badge.toLowerCase().includes("value") || x.badge.toLowerCase().includes("special") || x.badge.toLowerCase().includes("save"))));
    }

    if (this.category !== "all") p = p.filter(x => x.category === this.category);
    if (this.search) p = p.filter(x => x.name.toLowerCase().includes(this.search) || x.brand.toLowerCase().includes(this.search) || x.category.includes(this.search) || (x.tags||[]).some(t => t.toLowerCase().includes(this.search)));
    if (this.priceRange === "under-100")  p = p.filter(x => x.price < 100);
    if (this.priceRange === "100-250")    p = p.filter(x => x.price >= 100 && x.price <= 250);
    if (this.priceRange === "250-500")    p = p.filter(x => x.price >= 250 && x.price <= 500);
    if (this.priceRange === "above-500")  p = p.filter(x => x.price > 500);
    if (this.rating === "4-plus")         p = p.filter(x => x.rating >= 4);
    if (this.rating === "3-plus")         p = p.filter(x => x.rating >= 3);
    if (this.availability === "in-stock") p = p.filter(x => x.stock > 0);
    if (this.discount === "10-plus")      p = p.filter(x => x.discount >= 10);
    if (this.discount === "20-plus")      p = p.filter(x => x.discount >= 20);
    if (this.discount === "30-plus")      p = p.filter(x => x.discount >= 30);
    if (this.sort === "price-low")  p.sort((a,b) => a.price - b.price);
    else if (this.sort === "price-high") p.sort((a,b) => b.price - a.price);
    else if (this.sort === "rating")     p.sort((a,b) => b.rating - a.rating);
    else if (this.sort === "discount")   p.sort((a,b) => b.discount - a.discount);
    else if (this.sort === "newest")     p.reverse();
    else p.sort((a,b) => (b.featured?1:0)-(a.featured?1:0) || b.discount - a.discount);
    return p;
  }

  setDealsOnly(enabled) {
    this.dealsOnly = enabled;
    this.updateDealsHeader();
    this.renderCategoryPills();
    this.renderProducts();
    if (enabled) {
      showToast("Showing exclusive deals & offers!", "success");
    }
  }

  setCategory(cat) {
    this.category = cat;
    this.renderCategoryPills();
    this.renderProducts();
    document.getElementById("products-section")?.scrollIntoView({ behavior:"smooth" });
  }

  clearFilters() {
    this.category = "all"; this.dealsOnly = false; this.search = ""; this.priceRange = "all";
    this.rating = "all"; this.availability = "all"; this.discount = "all"; this.sort = "popular";
    const s = document.getElementById("product-search-input"); if (s) s.value = "";
    const sort = document.getElementById("product-sort-select"); if (sort) sort.value = "popular";
    document.querySelectorAll("input[type=radio][value=all]").forEach(r => r.checked = true);
    // Remove query params from url cleanly
    window.history.replaceState({}, document.title, window.location.pathname);
    this.updateDealsHeader();
    this.renderCategoryPills();
    this.renderProducts();
    showToast("All filters cleared.", "info");
  }

  updateDealsHeader() {
    const heading = document.getElementById("shop-page-title");
    const banner = document.getElementById("deals-active-banner");
    if (heading) {
      if (this.dealsOnly) {
        heading.innerHTML = `<span class="flex items-center gap-2 text-orange-600"><i data-lucide="zap" class="w-6 h-6 fill-orange-500 text-orange-500"></i> Today's Best Deals & Offers</span>`;
      } else {
        heading.textContent = "Popular Groceries";
      }
    }
    if (banner) {
      banner.classList.toggle("hidden", !this.dealsOnly);
    }
    if (window.lucide) lucide.createIcons();
  }

  renderCategoryPills() {
    const container = document.getElementById("category-filter-pills");
    if (!container) return;
    const pills = [
      { id:"all", label:"All Items", icon:"grid", isDeal:false },
      { id:"deals", label:"Today's Deals", icon:"zap", isDeal:true },
      { id:"fruits", label:"Fruits", icon:"apple", isDeal:false },
      { id:"vegetables", label:"Vegetables", icon:"carrot", isDeal:false },
      { id:"dairy", label:"Dairy & Eggs", icon:"milk", isDeal:false },
      { id:"bakery", label:"Bakery", icon:"croissant", isDeal:false },
      { id:"snacks", label:"Snacks", icon:"cookie", isDeal:false },
      { id:"beverages", label:"Beverages", icon:"cup-soda", isDeal:false },
      { id:"rice-grains", label:"Rice & Grains", icon:"wheat", isDeal:false },
      { id:"cooking-essentials", label:"Oils & Ghee", icon:"flame", isDeal:false },
      { id:"meat-seafood", label:"Meat & Fish", icon:"fish", isDeal:false },
      { id:"frozen-foods", label:"Frozen", icon:"snowflake", isDeal:false },
      { id:"personal-care", label:"Personal Care", icon:"sparkles", isDeal:false },
      { id:"household", label:"Household", icon:"home", isDeal:false }
    ];
    container.innerHTML = pills.map(p => {
      if (p.isDeal) {
        const active = this.dealsOnly;
        return `
          <button onclick="window.productsCtrl.setDealsOnly(${!this.dealsOnly})"
            class="whitespace-nowrap px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs ${active ? "bg-orange-600 text-white ring-2 ring-orange-400" : "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"}">
            <i data-lucide="${p.icon}" class="w-3.5 h-3.5 ${active ? "fill-white" : "fill-orange-500"}"></i>
            <span>${p.label}</span>
          </button>`;
      }
      const active = !this.dealsOnly && this.category === p.id;
      return `
        <button onclick="window.productsCtrl.dealsOnly = false; window.productsCtrl.setCategory('${p.id}'); window.productsCtrl.updateDealsHeader();"
          class="whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${active ? "bg-emerald-700 text-white shadow-sm" : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"}">
          <i data-lucide="${p.icon}" class="w-3.5 h-3.5"></i>
          <span>${p.label}</span>
        </button>`;
    }).join("");
    if (window.lucide) lucide.createIcons();
  }

  renderProducts() {
    const grid   = document.getElementById("products-grid");
    const count  = document.getElementById("products-count");
    const empty  = document.getElementById("products-empty-state");
    if (!grid) return;
    const products = this.getFiltered();
    const wishlist = window.freshCartAPI.getWishlist();
    if (count) count.textContent = `Showing ${products.length} ${this.dealsOnly ? "discounted deal" : "grocery"} items`;
    if (products.length === 0) { grid.innerHTML = ""; empty?.classList.remove("hidden"); return; }
    empty?.classList.add("hidden");

    grid.innerHTML = products.map(p => {
      const inWl  = wishlist.includes(p.id);
      const out   = p.stock <= 0;
      const low   = p.stock > 0 && p.stock <= p.minStock;
      const hasDiscount = p.discount > 0;
      return `
        <div class="product-item-card product-card-hover group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:border-emerald-300">
          <div class="absolute top-3 left-3 z-10 flex flex-col gap-1">
            ${p.badge ? `<span class="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-md shadow-xs ${p.badge.includes("OFF")||p.badge.includes("Deal") ? "bg-orange-600 text-white" : "bg-emerald-700 text-white"}">${p.badge}</span>` : (hasDiscount ? `<span class="px-2 py-0.5 text-[10px] font-extrabold bg-orange-500 text-white rounded-md">${p.discount}% OFF</span>` : "")}
            ${low ? `<span class="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md">Only ${p.stock} left</span>` : ""}
          </div>
          <button onclick="window.productsCtrl.toggleWishlist('${p.id}',event)" class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 shadow-xs transition-colors" aria-label="Wishlist">
            <i data-lucide="heart" class="w-4 h-4 ${inWl?"fill-red-500 text-red-500":""}"></i>
          </button>
          <a href="product.html?id=${p.id}" class="relative w-full pt-[85%] bg-slate-50 overflow-hidden cursor-pointer block">
            <img src="${p.image}" alt="${p.name}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
            ${out?`<div class="absolute inset-0 bg-white/80 flex items-center justify-center"><span class="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg uppercase">Out of Stock</span></div>`:""}
          </a>
          <div class="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span class="uppercase tracking-wider font-semibold text-emerald-700">${p.category.replace(/-/g," ")}</span>
                <div class="flex items-center gap-1 font-semibold text-amber-500">
                  <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>
                  <span>${p.rating}</span><span class="text-slate-400 text-[10px]">(${p.reviewsCount})</span>
                </div>
              </div>
              <a href="product.html?id=${p.id}" class="block">
                <h4 class="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 cursor-pointer">${p.name}</h4>
              </a>
              <p class="text-xs text-slate-500 mt-0.5">${p.unit}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div class="flex items-baseline gap-1.5">
                  <span class="text-base font-extrabold text-slate-900">₹${p.price}</span>
                  ${p.originalPrice>p.price?`<span class="text-xs text-slate-400 line-through">₹${p.originalPrice}</span>`:""}
                </div>
                ${p.discount>0?`<span class="text-[10px] font-bold text-emerald-600">${p.discount}% OFF</span>`:""}
              </div>
              ${out?`<button disabled class="px-3 py-1.5 bg-slate-100 text-slate-400 text-xs font-semibold rounded-xl cursor-not-allowed">Unavailable</button>`:`
              <button onclick="window.cartManager.addItem('${p.id}',1)" class="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs" aria-label="Add ${p.name}">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i><span>Add</span>
              </button>`}
            </div>
          </div>
        </div>`;
    }).join("");

    if (window.lucide) lucide.createIcons();
    if (window.freshCartAnimations) window.freshCartAnimations.animateCards(".product-item-card");
  }

  toggleWishlist(id, e) {
    if (e) e.stopPropagation();
    const r = window.freshCartAPI.toggleWishlist(id);
    const p = window.freshCartAPI.getProductById(id);
    showToast(r.isAdded ? `${p?.name||"Item"} saved to wishlist!` : `${p?.name||"Item"} removed from wishlist.`, r.isAdded?"success":"info");
    window.cartManager.updateBadges();
    this.renderProducts();
  }

  openProductModal(id) {
    window.location.href = `product.html?id=${encodeURIComponent(id)}`;
  }
}

window.productsCtrl = new ProductsController();
document.addEventListener("DOMContentLoaded", () => window.productsCtrl.init());
