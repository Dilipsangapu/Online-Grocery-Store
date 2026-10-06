/**
 * FreshCart — GSAP Animations (shared)
 * Respects prefers-reduced-motion.
 */
class FreshCartAnimations {
  constructor() { this.rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

  init() {
    if (this.rm || !window.gsap) return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    this.heroEntrance();
    this.initScrollReveals();
  }

  heroEntrance() {
    if (this.rm || !window.gsap) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    const safe = (sel, from, to, pos="-=0.4") => {
      if (document.querySelector(sel)) tl.fromTo(sel, from, to, pos);
    };
    tl.fromTo(".hero-badge",    { opacity:0, y:-15 }, { opacity:1, y:0, duration:.6, delay:.1 });
    safe(".hero-heading",       { opacity:0, y:20  }, { opacity:1, y:0, duration:.8 });
    safe(".hero-subheading",    { opacity:0, y:15  }, { opacity:1, y:0, duration:.6 });
    safe(".hero-cta-group",     { opacity:0, y:15  }, { opacity:1, y:0, duration:.6 });
    safe(".hero-stats",         { opacity:0, y:10  }, { opacity:1, y:0, duration:.5 });
    safe(".hero-image-card",    { opacity:0, scale:.94, y:20 }, { opacity:1, scale:1, y:0, duration:1, ease:"power2.out" });
    safe(".hero-floating-badge",{ opacity:0, scale:.8 }, { opacity:1, scale:1, duration:.6, stagger:.15, ease:"back.out(1.7)" });
  }

  animateCards(selector) {
    if (this.rm || !window.gsap) return;
    gsap.fromTo(selector, { opacity:0, y:18 }, { opacity:1, y:0, duration:.4, stagger:.04, ease:"power2.out" });
  }

  animateCategoryCards() {
    if (this.rm || !window.gsap || !window.ScrollTrigger) return;
    gsap.fromTo(".category-item-card", { opacity:0, scale:.95 }, { opacity:1, scale:1, duration:.4, stagger:.05, ease:"power2.out", scrollTrigger:{ trigger:"#categories-section", start:"top 85%" } });
  }

  animateKPICounters() {
    if (this.rm || !window.gsap) return;
    document.querySelectorAll(".kpi-counter").forEach(el => {
      const val = parseFloat(el.getAttribute("data-target")||0);
      const isCurr = el.getAttribute("data-currency")==="true";
      const obj = { v:0 };
      gsap.to(obj, { v:val, duration:1.2, ease:"power2.out", onUpdate:() => {
        el.textContent = isCurr ? "₹"+Math.round(obj.v).toLocaleString("en-IN") : Math.round(obj.v).toLocaleString("en-IN");
      }});
    });
  }

  animateOrderTracker(stepIndex=3) {
    if (this.rm || !window.gsap) return;
    gsap.fromTo("#tracking-progress-bar", { width:"0%" }, { width:`${Math.min(100,(stepIndex/4)*100)}%`, duration:1.2, ease:"power3.inOut" });
    gsap.fromTo(".tracking-step-node", { scale:.8, opacity:.5 }, { scale:1, opacity:1, duration:.4, stagger:.15, ease:"back.out(2)" });
  }

  initScrollReveals() {
    if (this.rm || !window.gsap || !window.ScrollTrigger) return;
    document.querySelectorAll(".scroll-reveal").forEach(el => {
      gsap.fromTo(el, { opacity:0, y:25 }, { opacity:1, y:0, duration:.6, ease:"power2.out", scrollTrigger:{ trigger:el, start:"top 90%" } });
    });
  }
}

window.freshCartAnimations = new FreshCartAnimations();
