/* Site navigation: mega menus on desktop, accordion on small screens, keyboard operable. */
(function () {
  "use strict";
  var nav = document.getElementById("site-nav"); if (!nav) return;
  var items = nav.querySelectorAll(".nav__item--menu");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  function close(item) { var b = item.querySelector(".nav__toggle"), p = item.querySelector(".mega");
    b.setAttribute("aria-expanded", "false"); p.hidden = true; item.classList.remove("is-open"); }
  function open(item) { Array.prototype.forEach.call(items, function (i) { if (i !== item) close(i); });
    var b = item.querySelector(".nav__toggle"), p = item.querySelector(".mega");
    b.setAttribute("aria-expanded", "true"); p.hidden = false; item.classList.add("is-open"); }
  function toggle(item) { item.classList.contains("is-open") ? close(item) : open(item); }
  Array.prototype.forEach.call(items, function (item) {
    var b = item.querySelector(".nav__toggle");
    b.addEventListener("click", function (e) { e.preventDefault(); toggle(item); });
    if (fine) {
      var t; item.addEventListener("mouseenter", function () { clearTimeout(t); open(item); });
      item.addEventListener("mouseleave", function () { t = setTimeout(function () { close(item); }, 160); });
    }
    item.addEventListener("focusout", function (e) { if (!item.contains(e.relatedTarget)) close(item); });
  });
  var burger, closeBurger;
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") Array.prototype.forEach.call(items, close); });
  /* Dismiss on a click outside the nav.
     Escape closed a menu and a second click on the toggle closed it, but the move
     everyone actually makes — open a menu, then click the page to get rid of it —
     did nothing, and the menu stayed over the content. On a touch screen there is
     no hover to close it either, so the panel could only be dismissed by finding
     the toggle again. Site-wide: every page carried this. */
  document.addEventListener("click", function (e) {
    if (nav.contains(e.target)) return;
    Array.prototype.forEach.call(items, close);
    if (burger && burger.getAttribute("aria-expanded") === "true") closeBurger();
  });
  burger = nav.querySelector(".nav__burger");
  function setBurger(on) {
    burger.setAttribute("aria-expanded", String(on));
    nav.classList.toggle("is-menu-open", on);
    burger.textContent = on ? "Close" : "Menu";
  }
  closeBurger = function () { setBurger(false); };
  burger.addEventListener("click", function () {
    setBurger(burger.getAttribute("aria-expanded") !== "true");
  });
  /* Escape should also close the mobile menu, not only the mega panels */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") closeBurger();
  });
  /* compact the bar once the reader has scrolled */
  var last = 0; window.addEventListener("scroll", function () {
    var y = window.scrollY || 0; if ((y > 80) !== (last > 80)) nav.classList.toggle("is-compact", y > 80); last = y;
  }, { passive: true });
})();
