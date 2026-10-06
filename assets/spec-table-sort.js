/* Click-to-sort for the spec table. The rows are already in the HTML. */
(function () {
  var table = document.getElementById("spec-table");
  if (!table || !table.tBodies[0]) return;
  var ths = table.querySelectorAll("thead th");
  function sortBy(th, idx) {
    var asc = th.getAttribute("aria-sort") !== "ascending";
    ths.forEach(function (h) { h.removeAttribute("aria-sort"); });
    th.setAttribute("aria-sort", asc ? "ascending" : "descending");
    var tbody = table.tBodies[0];
    var rows = Array.prototype.slice.call(tbody.rows);
    rows.sort(function (a, b) {
      var av = a.cells[idx].getAttribute("data-sort") || "";
      var bv = b.cells[idx].getAttribute("data-sort") || "";
      var an = parseFloat(av);
      var bn = parseFloat(bv);
      var c;
      if (av !== "" && bv !== "" && !isNaN(an) && !isNaN(bn)) c = an - bn;
      else c = av.localeCompare(bv, "en", { numeric: true, sensitivity: "base" });
      return asc ? c : -c;
    });
    rows.forEach(function (r) { tbody.appendChild(r); });
  }
  ths.forEach(function (th, idx) {
    th.tabIndex = 0;
    th.style.cursor = "pointer";
    th.addEventListener("click", function () { sortBy(th, idx); });
    th.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        sortBy(th, idx);
      }
    });
  });
})();
