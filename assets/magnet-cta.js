/* Magnet CTA + TikTok @3jsa7. Aidan engine: package the $100 resource. */
(function () {
  "use strict";
  var MAGNET_HREF = "magnet.html";
  var MAGNET_LABEL = 'Free towing pocket card';
  var TIKTOK = "https://www.tiktok.com/@3jsa7";
  function magnetBanner() {
    if (document.querySelector("[data-magnet-cta]")) return;
    var h1 = document.querySelector("main h1, h1");
    if (!h1) return;
    var bar = document.createElement("p");
    bar.setAttribute("data-magnet-cta", "1");
    bar.style.cssText = "margin:.6rem 0 1.1rem;padding:.7rem .9rem;border-left:4px solid #f59e0b;background:rgba(245,158,11,.08);font-size:1.02rem";
    var a = document.createElement("a");
    a.href = MAGNET_HREF;
    a.textContent = MAGNET_LABEL + " — print it, 10 minutes.";
    a.style.fontWeight = "700";
    bar.appendChild(a);
    h1.parentNode.insertBefore(bar, h1.nextSibling);
  }
  function tiktok() {
    document.querySelectorAll("footer").forEach(function (footer) {
      if (footer.querySelector("[data-tiktok-cta]")) return;
      footer.appendChild(document.createTextNode(" · "));
      var link = document.createElement("a");
      link.href = TIKTOK;
      link.rel = "noopener";
      link.target = "_blank";
      link.setAttribute("data-tiktok-cta", "1");
      link.textContent = "TikTok @3jsa7";
      footer.appendChild(link);
    });
  }
  function go() { magnetBanner(); tiktok(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
  else go();
})();
