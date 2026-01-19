export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function setRectFillWidth(rect, pct) {
  if (!rect) return;
  if (!rect.dataset.baseWidth) {
    const base = parseFloat(rect.getAttribute("width") || "0");
    rect.dataset.baseWidth = Number.isFinite(base) ? String(base) : "0";
  }
  const base = parseFloat(rect.dataset.baseWidth || "0");
  const safe = clamp(pct, 0, 100) / 100;
  rect.setAttribute("width", (base * safe).toFixed(3));
}

export function setCondVisible(visible, ...els) {
  els.forEach((el) => {
    if (!el) return;
    el.style.display = visible ? "inline" : "none";
  });
}

export function setCondCritical(el, critical) {
  if (!el) return;
  el.classList.toggle("cond_critical", !!critical);
}

export function setSvgText(el, value) {
  if (!el) return;
  const text = value == null ? "" : String(value);
  const tspans = el.querySelectorAll ? el.querySelectorAll("tspan") : null;
  if (tspans && tspans.length > 0) {
    tspans.forEach((tspan, idx) => {
      tspan.textContent = idx === 0 ? text : "";
    });
    return;
  }
  el.textContent = text;
}

export function setSvgMultilineText(el, lines) {
  if (!el) return;
  const text = Array.isArray(lines) ? lines : String(lines || "").split("\n");
  const x = el.getAttribute("x") || "0";
  const y = el.getAttribute("y") || "0";
  while (el.firstChild) el.removeChild(el.firstChild);
  text.filter((line) => line !== "").forEach((line, idx) => {
    const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tspan.setAttribute("x", x);
    if (idx === 0) {
      tspan.setAttribute("y", y);
    } else {
      tspan.setAttribute("dy", "1.2em");
    }
    tspan.textContent = line;
    el.appendChild(tspan);
  });
}

export function cacheSvgTextBase(el) {
  if (!el || el.dataset.baseX || el.dataset.baseY) return;
  const first = el.querySelector("tspan");
  if (!first) return;
  const baseX = first.getAttribute("x") || "";
  const baseY = first.getAttribute("y") || "";
  if (baseX) el.dataset.baseX = baseX;
  if (baseY) el.dataset.baseY = baseY;
}

export function setSvgFlowText(el, lines) {
  if (!el) return;
  const text = Array.isArray(lines) ? lines : String(lines || "").split("\n");
  const align = el.dataset.align || "start";
  const anchor = align === "end" ? "end" : "start";
  el.setAttribute("text-anchor", anchor);

  while (el.firstChild) el.removeChild(el.firstChild);
  const filtered = text.filter((line) => line !== "");
  if (!filtered.length) return;
  filtered.forEach((line, idx) => {
    const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    if (idx > 0) tspan.setAttribute("dy", "1.2em");
    tspan.textContent = line;
    el.appendChild(tspan);
  });
}

export function setSvgImageHref(el, href) {
  if (!el) return;
  const url = href ? normalizeIconHref(String(href)) : "";
  if (!url) {
    el.removeAttribute("href");
    el.removeAttributeNS("http://www.w3.org/1999/xlink", "href");
    el.style.display = "none";
    return;
  }
  el.setAttribute("href", url);
  el.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
  el.style.display = "";
}

export function normalizeIconHref(href) {
  const trimmed = (href || "").trim();
  if (!trimmed) return "";
  if (/^(data:|https?:|file:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("icons/")) return trimmed;
  return `icons/${trimmed.replace(/^\/+/, "")}`;
}

export function prefixSvgIds(svgText, prefix) {
  if (!svgText || !prefix) return svgText;
  const idPrefix = `${prefix}__`;
  const withIds = svgText.replace(/id="([^"]+)"/g, (match, id) => {
    if (id.startsWith(idPrefix)) return match;
    return `id="${idPrefix}${id}"`;
  });
  const withUrls = withIds.replace(/url\(#([^)]+)\)/g, (match, id) => {
    if (id.startsWith(idPrefix)) return match;
    return `url(#${idPrefix}${id})`;
  });
  const withHref = withUrls.replace(/href="#([^"]+)"/g, (match, id) => {
    if (id.startsWith(idPrefix)) return match;
    return `href="#${idPrefix}${id}"`;
  });
  return withHref.replace(/xlink:href="#([^"]+)"/g, (match, id) => {
    if (id.startsWith(idPrefix)) return match;
    return `xlink:href="#${idPrefix}${id}"`;
  });
}

export function stripSvgIds(root) {
  if (!root) return;
  if (root.hasAttribute && root.hasAttribute("id")) root.removeAttribute("id");
  const withIds = root.querySelectorAll ? root.querySelectorAll("[id]") : [];
  withIds.forEach((el) => el.removeAttribute("id"));
}

export function parseTranslate(transform) {
  if (!transform) return { x: 0, y: 0 };
  const match = transform.match(/translate\(\s*([-\d.]+)[ ,]([-\d.]+)\s*\)/);
  if (!match) return { x: 0, y: 0 };
  const x = Number(match[1]);
  const y = Number(match[2]);
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0
  };
}

export function parseMatrix(transform) {
  if (!transform) return null;
  const match = transform.match(/matrix\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(/[,\s]+/).map((v) => Number(v));
  if (parts.length !== 6 || parts.some((v) => !Number.isFinite(v))) return null;
  return {
    a: parts[0],
    b: parts[1],
    c: parts[2],
    d: parts[3],
    e: parts[4],
    f: parts[5]
  };
}

export function getShapeInsideRectId(el) {
  if (!el) return "";
  const style = el.getAttribute("style") || "";
  const match = style.match(/shape-inside:url\(#([^)]+)\)/);
  return match ? match[1] : "";
}

export function measureTspanWidth(tspan) {
  if (!tspan) return 0;
  if (typeof tspan.getComputedTextLength === "function") {
    const len = tspan.getComputedTextLength();
    return Number.isFinite(len) ? len : 0;
  }
  const box = tspan.getBBox?.();
  return box && Number.isFinite(box.width) ? box.width : 0;
}

export function wrapSvgText(el, text, maxWidth, maxLines) {
  if (!el) return;
  const tspans = el.querySelectorAll ? Array.from(el.querySelectorAll("tspan")) : [];
  if (!tspans.length) {
    el.textContent = text || "";
    return;
  }
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) {
    tspans.forEach((tspan) => { tspan.textContent = ""; });
    return;
  }
  const lineLimit = Math.max(1, Math.min(maxLines || tspans.length, tspans.length));
  const lines = [];
  let line = "";
  let idx = 0;
  while (idx < words.length && lines.length < lineLimit - 1) {
    const candidate = line ? `${line} ${words[idx]}` : words[idx];
    tspans[0].textContent = candidate;
    tspans.slice(1).forEach((tspan) => { tspan.textContent = ""; });
    const width = measureTspanWidth(tspans[0]);
    if (width <= maxWidth || !line) {
      line = candidate;
      idx += 1;
      continue;
    }
    lines.push(line);
    line = "";
  }
  const remaining = words.slice(idx);
  const lastLine = line ? `${line}${remaining.length ? " " : ""}${remaining.join(" ")}` : remaining.join(" ");
  if (lastLine) lines.push(lastLine);
  tspans.forEach((tspan, i) => {
    tspan.textContent = lines[i] || "";
  });
}

export function scaleSvgFont(el, scale) {
  if (!el || !Number.isFinite(scale) || scale <= 0) return;
  const style = el.getAttribute("style") || "";
  const match = style.match(/font-size:\s*([0-9.]+)px/i);
  if (match) {
    const base = Number(match[1]);
    if (Number.isFinite(base) && base > 0) {
      const next = (base * scale).toFixed(3);
      const nextStyle = style.replace(/font-size:\s*[0-9.]+px/i, `font-size:${next}px`);
      el.setAttribute("style", nextStyle);
      return;
    }
  }
  const attrSize = Number(el.getAttribute("font-size"));
  if (Number.isFinite(attrSize) && attrSize > 0) {
    el.setAttribute("font-size", (attrSize * scale).toFixed(3));
  }
}

export function applyIconClipLayoutRect(iconEl, clipRect, scale = 0.7) {
  if (!iconEl || !clipRect) return;
  const rectX = Number(clipRect.getAttribute("x"));
  const rectY = Number(clipRect.getAttribute("y"));
  const rectW = Number(clipRect.getAttribute("width"));
  const rectH = Number(clipRect.getAttribute("height"));
  if (![rectX, rectY, rectW, rectH].every(Number.isFinite)) return;
  const nextW = rectW * scale;
  const nextH = rectH * scale;
  const nextX = rectX + (rectW - nextW) / 2;
  const nextY = rectY + (rectH - nextH) / 2;
  iconEl.setAttribute("x", `${nextX}`);
  iconEl.setAttribute("y", `${nextY}`);
  iconEl.setAttribute("width", `${nextW}`);
  iconEl.setAttribute("height", `${nextH}`);
  iconEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
}
