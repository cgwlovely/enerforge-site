/* =============================================================================
   Heliovulcan Energy Advisors — CASE STUDY RENDERER
   Reads window.HELIOVULCAN_CASES (from cases/data.js) and renders:
     • the index grid + project map on  case-studies.html  (#cases-mount)
     • a full individual case page on    case.html?id=<id> (#case-mount)
   Pure vanilla JS. No build step. Works on file:// and any static host.
   Do not edit content here — edit cases/data.js instead.
   ============================================================================= */
(function () {
  "use strict";

  var CASES = window.HELIOVULCAN_CASES || [];

  /* ---- small helpers ----------------------------------------------------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function byId(id) { return CASES.filter(function (c) { return c.id === id; })[0]; }
  function paras(arr) { return (arr || []).map(function (p) { return "<p>" + p + "</p>"; }).join(""); }
  function figure(f) {
    if (!f || !f.src) return "";
    return '<figure class="case-figure">' +
      '<a href="' + esc(f.src) + '" target="_blank" rel="noopener">' +
        '<img src="' + esc(f.src) + '" alt="' + esc(f.alt || "") + '" loading="lazy" />' +
      "</a>" +
      (f.caption ? '<figcaption>' + f.caption + "</figcaption>" : "") +
      "</figure>";
  }
  function mapEmbed(m) {
    if (!m || !m.src) return "";
    return '<figure class="case-figure">' +
      '<div class="case-embed">' +
        '<iframe src="' + esc(m.src) + '" title="' + esc(m.title || "Interactive context map") + '" loading="lazy"></iframe>' +
      "</div>" +
      (m.caption ? '<figcaption>' + m.caption + "</figcaption>" : "") +
      "</figure>";
  }

  /* ---- Australia map outline (shared) ------------------------------------ */
  var AUS_PATH = "M 709,40 L 756,122 L 786,185 L 865,283 L 954,370 L 963,433 L 911,584 L 881,674 L 800,705 L 733,700 L 616,607 L 556,602 L 442,527 L 230,584 L 137,609 L 70,595 L 86,539 L 35,399 L 46,300 L 237,211 L 346,110 L 437,80 L 489,55 L 600,120 L 660,200 L 695,90 Z";
  var TAS_PATH = "M 792,748 Q 770,762 778,792 Q 792,832 824,826 Q 852,812 842,772 Q 828,742 792,748 Z";

  function mapMarker(c) {
    var p = c.pin; if (!p) return "";
    var hollow = p.type === "hollow";
    var w = Math.max(150, (p.label ? p.label.length : 16) * 8 + 24);
    return (
      '<a class="map-link" href="case.html?id=' + esc(c.id) + '">' +
        '<title>' + esc("Case " + (c.num || "") + " — " + (c.location || c.title)) + '</title>' +
        '<g class="pin-group" data-case="' + esc(c.id) + '">' +
          '<g transform="translate(' + p.x + "," + p.y + ')"' + (hollow ? ' class="pin--hollow"' : "") + '>' +
            '<circle class="pin__halo" r="17" />' +
            '<circle class="pin pin__dot" r="7" />' +
          '</g>' +
          '<g transform="translate(' + (p.x + 18) + "," + (p.y - 10) + ')">' +
            '<rect class="pin__chip" x="0" y="0" rx="7" width="' + w + '" height="26" />' +
            '<text class="pin__chip-txt" x="12" y="17">' + esc(p.label || c.title) + '</text>' +
          '</g>' +
        '</g>' +
      '</a>'
    );
  }

  function buildTipHTML(c) {
    var tone = (c.status && c.status.tone) || "warn";
    var toneCls = tone === "ok" ? "maptip__status--ok" : tone === "bad" ? "maptip__status--bad" : "maptip__status--warn";
    var srcLabel = c.source === "illustrative" ? "Hypothetical project" : "Public-data screen";
    return (
      '<p class="maptip__head">Case ' + esc(c.num || "") + " · " + esc(c.industry || "") + "</p>" +
      '<p class="maptip__loc">' + esc(c.location || "") + "</p>" +
      '<p class="maptip__type">' + esc(c.projectType || "") + "</p>" +
      '<span class="maptip__badge">' + esc(srcLabel) + "</span>" +
      (c.status ? '<p class="maptip__status ' + toneCls + '">' + esc(c.status.label) + "</p>" : "")
    );
  }

  /* ---- INDEX: map + case tiles ------------------------------------------- */
  function renderIndex(mount) {
    var ordered = CASES.slice().sort(function (a, b) { return (a.num || "").localeCompare(b.num || ""); });

    var map =
      '<figure class="map-wrap">' +
        '<svg class="aus-map" viewBox="0 0 1000 820" role="img" aria-label="Map of Australia showing project locations">' +
          '<path class="aus-land" d="' + AUS_PATH + '" />' +
          '<path class="aus-tas" d="' + TAS_PATH + '" />' +
          ordered.map(mapMarker).join("") +
        '</svg>' +
        '<figcaption class="map-legend">' +
          '<span><i class="solid"></i> Public-data / located project</span>' +
          '<span><i class="hollow"></i> Representative (illustrative) site</span>' +
        '</figcaption>' +
      '</figure>';

    var tiles = ordered.map(function (c) {
      var tone = (c.status && c.status.tone) || "amber";
      var pillCls = tone === "ok" ? "pill--green" : tone === "bad" ? "pill--red" : "pill--amber";
      var tags = (c.tags || []).map(function (t) { return '<span class="t">' + esc(t) + "</span>"; }).join("");
      var stats = (c.stats || []).slice(0, 3).map(function (s) {
        return '<span class="case-tile__stat"><b>' + s.value + "</b><span>" + s.label + "</span></span>";
      }).join("");
      return (
        '<a class="case-tile" href="case.html?id=' + esc(c.id) + '">' +
          '<div class="case-tile__top">' +
            '<span class="case-tile__num">Case ' + esc(c.num || "") + "</span>" +
            (c.status ? '<span class="pill ' + pillCls + '">' + esc(c.status.label) + "</span>" : "") +
          "</div>" +
          (tags ? '<div class="case-tile__tags">' + tags + "</div>" : "") +
          "<h3>" + c.title + "</h3>" +
          (c.summary ? '<p class="case-tile__sum">' + c.summary + "</p>" : "") +
          (stats ? '<div class="case-tile__stats">' + stats + "</div>" : "") +
          '<span class="case-tile__cta">Read case &rarr;</span>' +
        "</a>"
      );
    }).join("");

    mount.innerHTML =
      map +
      '<div class="case-index">' + tiles +
        '<div class="case-soon">More cases are being added as projects are screened &mdash;<br />industrial solar, storage, diesel displacement and weak-grid sites.</div>' +
      "</div>";

    // ---- map hover tooltips ------------------------------------------------
    var mapWrap = mount.querySelector(".map-wrap");
    if (mapWrap) {
      var tip = document.createElement("div");
      tip.className = "maptip";
      tip.setAttribute("aria-hidden", "true");
      tip.hidden = true;
      mapWrap.appendChild(tip);

      mount.querySelectorAll(".pin-group[data-case]").forEach(function (pg) {
        var c = byId(pg.getAttribute("data-case"));
        if (!c) return;

        function showTip(e) {
          tip.innerHTML = buildTipHTML(c);
          tip.hidden = false;
          moveTip(e);
        }
        function moveTip(e) {
          var rect = mapWrap.getBoundingClientRect();
          var tx = e.clientX - rect.left + 16;
          var ty = e.clientY - rect.top - 20;
          // flip left if near right edge
          if (tx + 240 > rect.width) { tx = e.clientX - rect.left - 240 - 16; }
          tip.style.left = Math.max(4, tx) + "px";
          tip.style.top  = Math.max(4, ty) + "px";
        }
        pg.addEventListener("mouseenter", showTip);
        pg.addEventListener("mousemove",  moveTip);
        pg.addEventListener("mouseleave", function () { tip.hidden = true; });
      });
    }
  }

  /* ---- DETAIL section builders ------------------------------------------ */
  function sec(cls, inner) { return '<section class="section' + (cls ? " " + cls : "") + '"><div class="container">' + inner + "</div></section>"; }
  function head(eyebrow, title, intro) {
    return '<p class="eyebrow">' + eyebrow + "</p>" +
      (title ? '<h2 class="section-title">' + title + "</h2>" : "") +
      (intro ? '<p class="section-intro">' + intro + "</p>" : "");
  }

  function heroBlock(c) {
    var tone = (c.status && c.status.tone) || "warn";
    var chipCls = tone === "ok" ? "is-ok" : "";
    var srcLabel = c.source === "public" ? "public-data screen" : "illustrative screen";
    var eyebrow = "Case " + (c.num || "") + (c.location ? " &middot; " + esc(c.location.split(",")[0]) : "") + " &middot; " + srcLabel;
    return (
      '<section class="case-hero"><div class="container">' +
        '<p class="eyebrow">' + eyebrow + "</p>" +
        "<h1>" + c.title + "</h1>" +
        (c.subtitle ? '<p class="case-hero__sub">' + c.subtitle + "</p>" : "") +
        (c.status ? '<span class="status-chip ' + chipCls + '">' + esc(c.status.label) + "</span>" : "") +
        (c.lesson ? '<div class="callout"><p class="eyebrow">The lesson</p><p>' + c.lesson + "</p></div>" : "") +
      "</div></section>"
    );
  }

  function glanceBlock(c) {
    var meta = "";
    var items = [["Industry", c.industry], ["Location", c.location], ["Project type", c.projectType]]
      .filter(function (x) { return x[1]; });
    if (items.length) {
      meta = '<dl class="case-meta">' + items.map(function (x) {
        return "<div><dt>" + esc(x[0]) + "</dt><dd>" + x[1] + "</dd></div>";
      }).join("") + "</dl>";
    }
    var kpis = "";
    if (c.kpis && c.kpis.length) {
      kpis = '<div class="kpi-row" style="margin-top:24px;">' + c.kpis.map(function (k) {
        return '<div class="kpi"><b>' + k.value + "</b><span>" + k.label + "</span></div>";
      }).join("") + "</div>";
    }
    if (!meta && !kpis) return "";
    return sec("section--tint", head("At a glance", "Project snapshot") + meta + kpis);
  }

  function figureBlock(c) {
    if (!c.frameworkFigure) return "";
    return sec("", head("The Pre-DD workflow", "How this screen sequences the work") + figure(c.frameworkFigure));
  }

  function questionBlock(c) {
    if (!(c.problem || c.method)) return "";
    var inner = head("Where it starts", "The project question");
    inner += '<div class="prose" style="margin-top:24px;">' + paras(c.problem) + "</div>";
    if (c.method && c.method.length) {
      inner += '<h3 style="margin-top:40px;font-size:20px;">How it was screened</h3>';
      inner += '<div class="prose" style="margin-top:14px;">' + paras(c.method) + "</div>";
    }
    if (c.siteEmbed) inner += mapEmbed(c.siteEmbed);
    else if (c.siteFigure) inner += figure(c.siteFigure);
    return sec("", inner);
  }

  function setupBlock(c) {
    if (!(c.assumptions || c.dataSources)) return "";
    var inner = head("Inputs", "Case setup");
    if (c.assumptions && c.assumptions.length) {
      inner += '<div class="table" style="margin-top:28px;">' + c.assumptions.map(function (r, i) {
        var emph = i === c.assumptions.length - 1 ? " is-emphasis" : "";
        return '<div class="table__row' + emph + '"><span class="k">' + r.k + '</span><span class="v">' + r.v + "</span></div>";
      }).join("") + "</div>";
    }
    if (c.dataSources && c.dataSources.length) {
      inner += '<h3 style="margin-top:40px;font-size:20px;">Data sources</h3>';
      inner += '<ul class="src-list">' + c.dataSources.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ul>";
    }
    return sec("section--tint", inner);
  }

  function scenariosBlock(c) {
    if (!(c.scenarios && c.scenarios.length)) return "";
    var cards = c.scenarios.map(function (s) {
      return '<article class="card"><span class="card__tag">' + esc(s.tag) + "</span><h3>" + esc(s.name) + "</h3><p>" + s.desc + "</p></article>";
    }).join("");
    var cls = c.scenarios.length === 3 ? "grid--3" : "grid--2";
    return sec("", head("How the project was framed", "Scenarios tested") +
      '<div class="grid ' + cls + '" style="margin-top:36px;">' + cards + "</div>");
  }

  function matrixBlock(c) {
    if (!(c.matrix && c.matrix.rows)) return "";
    var m = c.matrix;
    var thead = "<tr><th>Metric</th>" + m.columns.map(function (col) {
      return "<th" + (col.win ? ' class="win"' : "") + ">" + esc(col.label) + "</th>";
    }).join("") + "</tr>";
    var tbody = m.rows.map(function (row) {
      return "<tr><td class=\"metric\">" + row.metric + "</td>" + row.cells.map(function (cell) {
        var cls = "num" + (cell.cls ? " " + cell.cls : "");
        return '<td class="' + cls + '">' + cell.html + "</td>";
      }).join("") + "</tr>";
    }).join("");
    var inner = head("The part that decides it", "Scenario comparison", m.note ? null : null);
    inner += '<div class="article-wide" style="max-width:none;margin-top:28px;">';
    if (m.note) inner += '<span class="cap" style="display:block;font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:14px;">' + esc(m.note) + "</span>";
    inner += '<table class="matrix"><thead>' + thead + "</thead><tbody>" + tbody + "</tbody></table></div>";
    if (c.insight) inner += '<p class="insight">' + c.insight + "</p>";
    return sec("section--tint", inner);
  }

  function findingsBlock(c) {
    if (!(c.keyFindings && c.keyFindings.length)) return "";
    var lis = c.keyFindings.map(function (f) { return "<li>" + f + "</li>"; }).join("");
    return sec("section--navy", head("The point", "Key findings") + '<ul class="points">' + lis + "</ul>");
  }

  function readingBlock(c) {
    if (!(c.finance || c.customer)) return "";
    var inner = head("Read the number, not the headline", "Financial &amp; bankability reading");
    inner += '<div class="prose" style="margin-top:24px;">' + paras(c.finance) + "</div>";
    if (c.pullQuote) inner += '<div class="pull">' + c.pullQuote + "</div>";
    if (c.customer && c.customer.length) {
      inner += '<h3 style="margin-top:40px;font-size:20px;">Customer / owner economics</h3>';
      inner += '<div class="prose" style="margin-top:14px;">' + paras(c.customer) + "</div>";
    }
    return sec("", inner);
  }

  function outputsBlock(c) {
    if (!(c.outputs || c.downloads)) return "";
    var inner = head("The output", "What a screen like this produces");
    if (c.outputs && c.outputs.length) {
      var cls = c.outputs.length === 3 ? "grid--3" : "grid--2";
      inner += '<div class="grid ' + cls + '" style="margin-top:36px;">' + c.outputs.map(function (o, i) {
        return '<article class="card"><span class="card__tag">' + String(i + 1).padStart(2, "0") + "</span><h3>" + o.title + "</h3><p>" + o.desc + "</p></article>";
      }).join("") + "</div>";
    }
    if (c.downloads && c.downloads.length) {
      inner += '<div class="dl-row">' + c.downloads.map(function (d) {
        var live = d.href && d.href.length;
        return live
          ? '<a class="dl" href="' + esc(d.href) + '" download><b>' + d.label + "</b><span>" + (d.note || "download") + "</span></a>"
          : '<span class="dl" aria-disabled="true"><b>' + d.label + "</b><span>" + (d.note || "coming soon") + "</span></span>";
      }).join("") + "</div>";
    }
    if (c.downloadsNote) {
      inner += '<p class="section-intro" style="margin-top:20px;font-size:15px;">' + c.downloadsNote + "</p>";
    }
    return sec("section--tint", inner);
  }

  function limitationsBlock(c) {
    var inner = head("Where it goes from here", "Limitations &amp; how to read this");
    if (c.limitations && c.limitations.length) inner += '<div class="prose" style="margin-top:24px;">' + paras(c.limitations) + "</div>";
    // standard disclaimer on EVERY case page
    inner += '<div class="note"><span class="cap">Important disclaimer</span><p>' +
      "Heliovulcan Energy Advisors case studies are independent, early-stage screens for discussion only. They are not legal, financial, tax, engineering or investment advice, not an EPC design, bankable feasibility study or financing offer, and (for public-data cases) are not commissioned by, endorsed by or verified with the project owner. All figures are indicative and must be validated against owner data before any commercial decision." +
      "</p></div>";
    return sec("", inner);
  }

  function ctaBlock() {
    // standard free-sanity-check CTA on EVERY case page
    return (
      '<section class="section section--navy"><div class="container">' +
        '<p class="eyebrow">Peer project review</p>' +
        '<h2 class="section-title">Looking at a project like this?</h2>' +
        '<p class="section-intro">' +
          "This is a free, peer-style sanity check, not a formal consulting engagement. If you are screening an industrial solar + BESS or diesel-displacement idea, I&rsquo;m happy to pressure-test the project logic with you: what looks sound, what needs testing, and what to ask before EPC quotes or investor discussions." +
        "</p>" +
        '<div class="cta-row">' +
          '<a class="btn btn--primary" href="index.html#contact">Request a free sanity check <span class="btn__arrow">&rarr;</span></a>' +
          '<a class="btn btn--ghost-light" href="case-studies.html">All case studies</a>' +
        "</div>" +
      "</div></section>"
    );
  }

  function renderCase(mount) {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    var c = id ? byId(id) : CASES[0];
    if (!c) {
      mount.innerHTML = sec("", '<p class="eyebrow">Not found</p><h2 class="section-title">That case study doesn&rsquo;t exist.</h2>' +
        '<div class="cta-row"><a class="btn btn--primary" href="case-studies.html">All case studies <span class="btn__arrow">&rarr;</span></a></div>');
      return;
    }
    document.title = "Case " + (c.num || "") + ": " + String(c.title).replace(/<[^>]+>/g, "") + " | Heliovulcan Energy Advisors";
    mount.innerHTML =
      heroBlock(c) +
      glanceBlock(c) +
      figureBlock(c) +
      questionBlock(c) +
      setupBlock(c) +
      scenariosBlock(c) +
      matrixBlock(c) +
      findingsBlock(c) +
      readingBlock(c) +
      outputsBlock(c) +
      limitationsBlock(c) +
      ctaBlock();
  }

  /* ---- boot -------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    var idx = document.getElementById("cases-mount");
    if (idx) renderIndex(idx);
    var det = document.getElementById("case-mount");
    if (det) renderCase(det);
  });
})();
