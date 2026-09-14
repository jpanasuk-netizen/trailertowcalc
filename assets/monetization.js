/* Amazon Associates conversion CTA. Tag live. No income claims. */
(function () {
  "use strict";
  var AMAZON_TAG = "generatorsi0d-20";
  function amzUrl(q) {
    return "https://www.amazon.com/s?k=" + encodeURIComponent(q) +
           "&tag=" + encodeURIComponent(AMAZON_TAG);
  }

  function bandFor(kind, rec) {
    if (kind === "tongue") {
      return { label: "Verify tongue weight before you tow",
        q: "tongue weight scale trailer", alt: "adjustable ball mount hitch",
        primary: "Shop tongue scales on Amazon", secondary: "Ball mounts on Amazon" };
    }
    if (kind === "brake") {
      return { label: "Brake controller / breakaway kit",
        q: "proportional trailer brake controller", alt: "trailer breakaway kit",
        primary: "Shop brake controllers on Amazon", secondary: "Breakaway kits on Amazon" };
    }
    if (kind === "payload") {
      return { label: "WDH if you are near payload limits",
        q: "weight distribution hitch with sway control", alt: "class 3 trailer hitch receiver",
        primary: "Shop WDH kits on Amazon", secondary: "Class III receivers on Amazon" };
    }
    return { label: "Hitch gear for your tow setup",
      q: "class 3 trailer hitch receiver", alt: "weight distribution hitch",
      primary: "Shop hitch gear on Amazon", secondary: "WDH kits on Amazon" };
  }

  function fillSticky(url, label) {
    var bar = document.getElementById("amzSticky");
    if (!bar) return;
    var link = document.getElementById("amzStickyLink");
    if (link) {
      link.href = url;
      link.textContent = label || "Shop on Amazon";
      link.setAttribute("rel", "sponsored nofollow noopener");
      link.target = "_blank";
    }
    bar.hidden = false;
    bar.setAttribute("aria-hidden", "false");
  }
  window.dismissAmzSticky = function () {
    var bar = document.getElementById("amzSticky");
    if (bar) { bar.hidden = true; bar.setAttribute("aria-hidden", "true"); }
    try { sessionStorage.setItem("amzStickyDismissed", "1"); } catch (e) {}
  };
  window.updateMatchedCTA = function (rec, kind) {
    kind = kind || "default";
    var box = document.getElementById("matchedCta");
    var band = bandFor(kind, rec);
    var url = amzUrl(band.q);
    var altUrl = amzUrl(band.alt);
    if (box) {
      box.innerHTML =
        '<p class="small"><b>Matched to your result:</b> ' + band.label + '</p>' +
        '<div class="affil-links" style="display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.5rem">' +
        '<a class="btn-amz btn-amz-primary" rel="sponsored nofollow noopener" target="_blank" href="' +
          url + '">' + band.primary + '</a>' +
        '<a class="btn-amz" rel="sponsored nofollow noopener" target="_blank" href="' +
          altUrl + '">' + band.secondary + '</a>' +
        '</div>';
      box.hidden = false;
    }
    try {
      if (sessionStorage.getItem("amzStickyDismissed") !== "1") fillSticky(url, band.primary);
    } catch (e) { fillSticky(url, band.primary); }
  };
})();
