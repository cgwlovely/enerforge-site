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
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") Array.prototype.forEach.call(items, close); });
  var burger = nav.querySelector(".nav__burger"), menu = nav.querySelector(".nav__menu");
  burger.addEventListener("click", function () {
    var on = burger.getAttribute("aria-expanded") !== "true";
    burger.setAttribute("aria-expanded", String(on)); nav.classList.toggle("is-menu-open", on);
    burger.textContent = on ? "Close" : "Menu";
  });
  /* compact the bar once the reader has scrolled */
  var last = 0; window.addEventListener("scroll", function () {
    var y = window.scrollY || 0; if ((y > 80) !== (last > 80)) nav.classList.toggle("is-compact", y > 80); last = y;
  }, { passive: true });
})();
