import Events from "./Events";

(function () {
  if (window.__FNV_HUD_INIT__) return;
  window.__FNV_HUD_INIT__ = true;
  /* ===================== */
  /* DOM Helpers           */
  /* ===================== */
  const elHudLeft = () => document.getElementById("hud_hp_fallout");
  const elHudLeftSvg = () => elHudLeft()?.querySelector("svg");

  const elCaps   = () => document.getElementById("caps_value");
  const elNotifs = () => document.getElementById("fnv_notify");

  // Right HUD (AP/CND/Ammo)
  const elRightSubBar    = () => document.getElementById("fnv_right_sub_bar");
  const getRightSubPrefix = () => elRightSubBar()?.dataset?.prefix || "";
  const queryRightSubId = (id) => {
    const root = elRightSubBar();
    if (!root) return null;
    const prefix = getRightSubPrefix();
    const targetId = prefix ? `${prefix}__${id}` : id;
    return root.querySelector(`#${targetId}`);
  };
  const queryRightSubAll = (selector) => {
    const root = elRightSubBar();
    if (!root) return [];
    const prefix = getRightSubPrefix();
    if (!prefix) return root.querySelectorAll(selector);
    const scoped = selector.replace(/#([A-Za-z0-9_-]+)/g, (_, id) => `#${prefix}__${id}`);
    return root.querySelectorAll(scoped);
  };
  const elApTicksClip    = () => queryRightSubId("rect60");
  const elAmmoText       = () => queryRightSubId("text45");
  const elAmmoTextSpan   = () => queryRightSubId("tspan45");
  const elCndArmorFill   = () => queryRightSubId("rect15");
  const elCndArmorEmpty  = () => queryRightSubId("rect14");
  const elCndArmorLabel  = () => queryRightSubId("text69");
  const elCndArmorChevronTop = () => queryRightSubId("g24");
  const elCndArmorChevronBottom = () => queryRightSubId("g35");
  const elCndWeaponFill  = () => queryRightSubId("rect37");
  const elCndWeaponEmpty = () => queryRightSubId("rect36");
  const elCndWeaponLabel = () => queryRightSubId("text70");
  const elCndWeaponChevronTop = () => queryRightSubId("g38");
  const elCndWeaponChevronBottom = () => queryRightSubId("g39");
  const elMicOpen        = () => document.getElementById("mic_open");
  const elMicOpenGlow    = () => document.getElementById("mic_open_glow");
  const elMicClosed      = () => document.getElementById("mic_closed");
  const elMicClosedGlow  = () => document.getElementById("mic_closed_glow");

  // Réticule
  const elReticle = () => document.getElementById("fnv_reticle");
  const elEnemy = () => document.getElementById("fnv_enemy");
  const elEnemyName = () => document.getElementById("fnv_enemy_name");
  const elEnemyFill = () => document.getElementById("fnv_enemy_fill");
  const elContainer = () => document.getElementById("fnv_container");
  const elContainerTitle = () => document.getElementById("fnv_container_title");
  const elContainerWeight = () => document.getElementById("fnv_container_weight");
  const elContainerList = () => document.getElementById("fnv_container_list");
  const elTransfer = () => document.getElementById("fnv_transfer");
  const elTransferLeftTitle = () => document.getElementById("fnv_transfer_left_title");
  const elTransferLeftWeight = () => document.getElementById("fnv_transfer_left_weight");
  const elTransferLeftList = () => document.getElementById("fnv_transfer_left_list");
  const elTransferLeftUp = () => document.getElementById("fnv_transfer_left_up");
  const elTransferLeftDown = () => document.getElementById("fnv_transfer_left_down");
  const elTransferRightTitle = () => document.getElementById("fnv_transfer_right_title");
  const elTransferRightWeight = () => document.getElementById("fnv_transfer_right_weight");
  const elTransferRightList = () => document.getElementById("fnv_transfer_right_list");
  const elTransferRightUp = () => document.getElementById("fnv_transfer_right_up");
  const elTransferRightDown = () => document.getElementById("fnv_transfer_right_down");
  const elTransferDetailsIcon = () => document.getElementById("fnv_transfer_details_icon");
  const elTransferStatsGrid = () => document.getElementById("fnv_transfer_stats_grid");
  const elTransferItemName = () => document.getElementById("fnv_transfer_item_name");
  const elRepairMenu = () => document.getElementById("fnv_repair_menu");
  const elRepairList = () => document.getElementById("fnv_repair_list");

  /* ===================== */
  /* Utils                 */
  /* ===================== */
  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  const HP_CLIP_FULL_WIDTH = 129.65158; // rect120 width in hp_compass_bar.svg
  const HP_CLIP_FULL_X = 7.5124135; // rect120 x in hp_compass_bar.svg
  const HP_CLIP_ANCHOR_RIGHT = false; // set true to keep the right edge fixed
  const COMPASS_PERIOD = 427.566051; // distance between compass cycles in hp_compass_bar.svg
  const COMPASS_BASE_OFFSET = 44.340181; // fallback if N label alignment markers are missing
  const COMPASS_RAW_SIGN = 1; // flip to +1 if compass movement is inverted
  const SVG_ATTR_PRECISION = 4; // reduce attribute churn while preserving SVG fidelity
  const DOM_EPSILON = 1e-4; // skip redundant DOM writes

  function setRectFillWidth(rect, pct) {
    if (!rect) return;
    if (!rect.dataset.baseWidth) {
      const base = parseFloat(rect.getAttribute("width") || "0");
      rect.dataset.baseWidth = Number.isFinite(base) ? String(base) : "0";
    }
    const base = parseFloat(rect.dataset.baseWidth || "0");
    const safe = clamp(pct, 0, 100) / 100;
    rect.setAttribute("width", (base * safe).toFixed(3));
  }

  function setCondVisible(visible, ...els) {
    els.forEach((el) => {
      if (!el) return;
      el.style.display = visible ? "inline" : "none";
    });
  }

  function setCondCritical(el, critical) {
    if (!el) return;
    el.classList.toggle("cond_critical", !!critical);
  }

  function setSvgText(el, value) {
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

  function setSvgMultilineText(el, lines) {
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

  function cacheSvgTextBase(el) {
    if (!el || el.dataset.baseX || el.dataset.baseY) return;
    const first = el.querySelector("tspan");
    if (!first) return;
    const baseX = first.getAttribute("x") || "";
    const baseY = first.getAttribute("y") || "";
    if (baseX) el.dataset.baseX = baseX;
    if (baseY) el.dataset.baseY = baseY;
  }

  function setSvgFlowText(el, lines) {
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

  function setSvgImageHref(el, href) {
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

  function normalizeIconHref(href) {
    const trimmed = (href || "").trim();
    if (!trimmed) return "";
    if (/^(data:|https?:|file:)/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("icons/")) return trimmed;
    return `icons/${trimmed.replace(/^\/+/, "")}`;
  }

  function stripSvgIds(root) {
    if (!root) return;
    if (root.hasAttribute && root.hasAttribute("id")) root.removeAttribute("id");
    const withIds = root.querySelectorAll ? root.querySelectorAll("[id]") : [];
    withIds.forEach((el) => el.removeAttribute("id"));
  }

  function getInvPrefix() {
    return invSvgState.root?.dataset?.prefix || "";
  }

  function invSvgRoot() {
    return invSvgState.svg || invSvgState.root || null;
  }

  function queryInvId(id) {
    const svg = invSvgState.svg;
    if (!svg) return null;
    const prefix = getInvPrefix();
    const targetId = prefix ? `${prefix}__${id}` : id;
    return svg.querySelector(`#${targetId}`);
  }

  function queryInvLabel(label) {
    const svg = invSvgState.svg;
    if (!svg) return null;
    return svg.querySelector(`[inkscape\\:label="${label}"]`);
  }

  function parseTranslate(transform) {
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

  function getClipPathIdByRectId(rectId) {
    const rect = queryInvId(rectId) || queryInvClipLabel(rectId);
    const parent = rect?.parentElement;
    if (!parent || parent.tagName !== "clipPath") return "";
    return parent.getAttribute("id") || "";
  }

  function queryInvClipLabel(label) {
    const root = invSvgRoot();
    if (!root || !label) return null;
    const selector = `[inkscape\\:label="${label}"]`;
    return root.querySelector(selector);
  }

  function applyTextClip(textEl, rectId, anchorEnd = false) {
    if (!textEl) return;
    if (anchorEnd) {
      textEl.setAttribute("text-anchor", "end");
      const tspans = textEl.querySelectorAll ? textEl.querySelectorAll("tspan") : null;
      if (tspans && tspans.length > 0) {
        tspans.forEach((tspan) => tspan.setAttribute("text-anchor", "end"));
      }
    }
    const clipId = getClipPathIdByRectId(rectId);
    if (!clipId) return;
    textEl.setAttribute("clip-path", `url(#${clipId})`);
  }

  function anchorTextToClipRight(textEl, clipLabel) {
    if (!textEl) return;
    const clipRect = queryInvClipLabel(clipLabel);
    if (!clipRect) return;
    const rectX = Number(clipRect.getAttribute("x"));
    const rectW = Number(clipRect.getAttribute("width"));
    if (!Number.isFinite(rectX) || !Number.isFinite(rectW)) return;
    const rightEdgeSvg = rectX + rectW;
    const tspans = textEl.querySelectorAll ? textEl.querySelectorAll("tspan") : null;
    const baseX = Number((tspans?.[0]?.getAttribute("x")) || textEl.getAttribute("x") || 0);
    if (!Number.isFinite(baseX)) return;
    let rightEdgeLocal = rightEdgeSvg;
    const transform = textEl.getAttribute("transform") || "";
    const match = transform.match(/matrix\(([^)]+)\)/);
    if (match) {
      const parts = match[1].split(/[,\s]+/).map((v) => Number(v)).filter(Number.isFinite);
      if (parts.length === 6) {
        const [a, b, c, d, e, f] = parts;
        const det = (a * d) - (b * c);
        if (det) {
          const invA = d / det;
          const invB = -b / det;
          const invC = -c / det;
          const invE = (c * f - d * e) / det;
          const localX = (invA * rightEdgeSvg) + (invC * 0) + invE;
          if (Number.isFinite(localX)) rightEdgeLocal = localX;
        }
      }
    }
    const dx = rightEdgeLocal - baseX;
    if (tspans && tspans.length > 0) {
      tspans.forEach((tspan) => tspan.setAttribute("dx", `${dx}`));
    }
  }

  function applyIconClipLayout(iconEl, clipLabel) {
    if (!iconEl) return;
    const clipRect = queryInvClipLabel(clipLabel);
    if (!clipRect) return;
    const rectX = Number(clipRect.getAttribute("x"));
    const rectY = Number(clipRect.getAttribute("y"));
    const rectW = Number(clipRect.getAttribute("width"));
    const rectH = Number(clipRect.getAttribute("height"));
    if (![rectX, rectY, rectW, rectH].every(Number.isFinite)) return;
    iconEl.setAttribute("x", `${rectX}`);
    iconEl.setAttribute("y", `${rectY}`);
    iconEl.setAttribute("width", `${rectW}`);
    iconEl.setAttribute("height", `${rectH}`);
    iconEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
    iconEl.classList?.add("inv_item_icon");
  }


  const apTickState = {
    current: null,
    target: null,
    timer: null,
    tickCount: null,
    baseWidth: null
  };

  const hudSvgState = {
    root: null,
    hpTicksGroup: null,
    hpClipRect: null,
    hpClipBaseWidth: null,
    hpClipBaseX: null,
    hpLastWidth: null,
    hpLastX: null,
    hpLowTimer: null,
    compassStripContent: null,
    compassBaseOffset: null,
    compassLastOffset: null
  };

  const invSvgState = {
    root: null,
    svg: null,
    prefix: "",
    itemScroll: null,
    itemFrame: null,
    rowTemplate: null,
    itemNameClipId: "",
    itemNameClipWidth: null,
    rowBaseTransform: "",
    rowHeight: null,
    rowHoverBaseHeight: null,
    rowHoverSingleHeight: null,
    condBarGroup: null,
    condBarEmpty: null,
    condBarFull: null,
    condBarChevrons: null,
    rowGap: null,
    itemNameScaleX: null,
    rows: [],
    weapons: [],
    listKey: "",
    scrollOffset: 0,
    scrollMax: 0,
    selectedId: null,
    hoverId: null,
    bound: false,
    ammoText: null,
    dpsText: null,
    vwText: null,
    weightText: null,
    valText: null,
    strText: null,
    degText: null,
    otherText: null,
    effectsText: null,
    iconImage: null,
    pdsText: null,
    dtText: null,
    hpText: null,
    capsText: null,
    effectsRow: null,
    effectsRowBaseTransform: "",
    effectsRowBaseX: 0,
    effectsRowBaseY: 0,
    effectsRowGap: null
  };

  const invUiState = {
    open: false,
    category: "OBJETS",
    subPage: "ARMES"
  };
  const invSubPageByCategory = {
    weapons: "ARMES",
    apparel: "ARMURE",
    aid: "SOINS",
    misc: "DIVERS",
    ammo: "MUNITIONS"
  };

  function initHudSvg(event) {
    const eventRoot = event?.detail?.root;
    const svgRoot = eventRoot?.querySelector?.("svg") || elHudLeftSvg();
    if (!svgRoot) return;
    hudSvgState.root = svgRoot;

    const ticks = svgRoot.querySelector("#hp_ticks_fill");
    hudSvgState.hpTicksGroup = ticks || null;

    const clipRect = svgRoot.querySelector("#rect120");
    hudSvgState.hpClipRect = clipRect || null;
    hudSvgState.hpClipBaseWidth = HP_CLIP_FULL_WIDTH;
    hudSvgState.hpClipBaseX = HP_CLIP_FULL_X;
    hudSvgState.hpLastWidth = null;
    hudSvgState.hpLastX = null;

    const stripContent = svgRoot.querySelector("#compass_strip_content");
    hudSvgState.compassStripContent = stripContent || null;
    hudSvgState.compassLastOffset = null;
    hudSvgState.compassBaseOffset = COMPASS_BASE_OFFSET;
    if (process.env.NODE_ENV === "development" && !stripContent) {
      console.log("[HUD] compass ids missing", { strip: !!stripContent });
    }
    if (stripContent) {
      const chevron = svgRoot.querySelector("#COMPASS_CHEVRON");
      const markN = svgRoot.querySelector("#mark_N");
      const chevronBox = chevron?.getBBox?.();
      const markBox = markN?.getBBox?.();
      if (chevronBox && markBox && Number.isFinite(chevronBox.x) && Number.isFinite(markBox.x)) {
        const chevronX = chevronBox.x + (Number(chevronBox.width) || 0) / 2;
        const markX = markBox.x + (Number(markBox.width) || 0) / 2;
        hudSvgState.compassBaseOffset = Number((chevronX - markX).toFixed(SVG_ATTR_PRECISION));
      }
    }
    if (stripContent && process.env.NODE_ENV === "development") {
      stripContent.setAttribute("transform", "translate(-5 0)");
      setTimeout(() => {
        stripContent.setAttribute("transform", "translate(0 0)");
      }, 60);
    }

    if (lastHudState) {
      const hpNow = Number(lastHudState?.hp ?? 0);
      const hpMax = Number(lastHudState?.hp_max ?? 0);
      const hpPct = hpMax > 0 ? (hpNow / hpMax) : 0;
      setHpTicks(hpPct);
      setHpLowState(hpMax > 0 && (hpPct * 100) < 20);
      renderCompass();
    }
  }

  function ensureHudSvgReady() {
    window.addEventListener("FNV:LeftHudReady", initHudSvg);
    if (elHudLeftSvg()) initHudSvg();
  }

  function initInventorySvg(event) {
    const root = event?.detail?.root || document.getElementById("fnv_inventory");
    if (!root) return;
    const svg = root.querySelector("svg");
    if (!svg) return;
    invSvgState.root = root;
    invSvgState.svg = svg;
    invSvgState.prefix = root.dataset?.prefix || "";

    invSvgState.itemScroll = queryInvId("item_scroll");
    invSvgState.itemFrame = queryInvId("item_frame");
    invSvgState.rowTemplate = queryInvId("item_row_template");
    invSvgState.rowBaseTransform = invSvgState.rowTemplate?.getAttribute("transform") || "";
    invSvgState.itemNameClipId = queryInvId("clipPath1")?.getAttribute("id") || "";
    const clipRect = queryInvClipLabel("item_name_clip");
    const clipWidth = parseFloat(clipRect?.getAttribute("width") || "");
    invSvgState.itemNameClipWidth = Number.isFinite(clipWidth) ? clipWidth : null;
    const nameTemplate = invSvgState.rowTemplate?.querySelector(
      invSvgState.prefix ? `#${invSvgState.prefix}__item_name` : "#item_name"
    );
    if (nameTemplate) {
      const transform = nameTemplate.getAttribute("transform") || "";
      const match = transform.match(/matrix\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(/[,\s]+/).map((v) => Number(v)).filter(Number.isFinite);
        if (parts.length === 6) {
          const scaleX = parts[0];
          if (Number.isFinite(scaleX) && scaleX > 0) invSvgState.itemNameScaleX = scaleX;
        }
      }
    }
    if (invSvgState.itemScroll) invSvgState.itemScroll.style.pointerEvents = "auto";

    const hoverId = invSvgState.prefix ? `#${invSvgState.prefix}__hovered_box` : "#hovered_box";
    const hovered = invSvgState.rowTemplate?.querySelector(hoverId);
    const baseHeight = hovered ? parseFloat(hovered.getAttribute("height") || "0") : null;
    if (Number.isFinite(baseHeight) && baseHeight > 0) {
      invSvgState.rowHoverBaseHeight = baseHeight;
      const tspanEls = nameTemplate ? Array.from(nameTemplate.children).filter((el) => el.tagName === "tspan") : [];
      if (tspanEls.length >= 2) {
        const y1 = Number(tspanEls[0].getAttribute("y"));
        const y2 = Number(tspanEls[1].getAttribute("y"));
        const transform = nameTemplate.getAttribute("transform") || "";
        const match = transform.match(/matrix\(([^)]+)\)/);
        const scaleY = match
          ? Number(match[1].split(/[,\s]+/).map((v) => Number(v)).find((_, idx) => idx === 3))
          : NaN;
        if (Number.isFinite(y1) && Number.isFinite(y2) && Number.isFinite(scaleY)) {
          const lineStep = (y2 - y1) * scaleY;
          if (lineStep > 0) {
            invSvgState.rowHoverSingleHeight = Math.max(0, baseHeight - lineStep);
          }
        }
      }
    }
    let rowHeight = null;
    if (Number.isFinite(baseHeight) && baseHeight > 0) {
      rowHeight = baseHeight;
    } else {
      const bb = invSvgState.rowTemplate?.getBBox?.();
      if (bb && Number.isFinite(bb.height) && bb.height > 0) rowHeight = bb.height;
    }
    if (rowHeight) {
      const rowSpacing = 0.7;
      invSvgState.rowHeight = rowHeight * rowSpacing;
    }
    if (invSvgState.rowHoverBaseHeight && invSvgState.rowHeight) {
      invSvgState.rowGap = Math.max(0, invSvgState.rowHeight - invSvgState.rowHoverBaseHeight);
    }

    if (invSvgState.rowTemplate) {
      invSvgState.rowTemplate.style.display = "none";
      invSvgState.rowTemplate.setAttribute("display", "none");
      invSvgState.rowTemplate.style.pointerEvents = "none";
    }

    invSvgState.ammoText = queryInvId("ammo_text_to_modify");
    invSvgState.dpsText = queryInvId("DPS_text_to_modify");
    invSvgState.vwText = queryInvId("value_over_weight_text_to_modify");
    invSvgState.weightText = queryInvId("weight_text_to_modify");
    invSvgState.valText = queryInvId("VAL_text_to_modify");
    invSvgState.strText = queryInvId("STR_text_to_modify");
    invSvgState.degText = queryInvId("DEG_text_to_modify");
    invSvgState.otherText = queryInvId("other_text_to_modify");
    invSvgState.effectsText = queryInvId("effets_text_to_modify");
    invSvgState.iconImage = queryInvId("item_icon");
    if (!invSvgState.iconImage) {
      const clipRect = queryInvClipLabel("item_icon_clip");
      if (clipRect?.ownerSVGElement) {
        const iconId = invSvgState.prefix ? `${invSvgState.prefix}__item_icon` : "item_icon";
        const imageEl = document.createElementNS("http://www.w3.org/2000/svg", "image");
        imageEl.setAttribute("id", iconId);
        imageEl.style.display = "none";
        const parent = clipRect.parentElement || clipRect.ownerSVGElement;
        parent.insertBefore(imageEl, clipRect.nextSibling);
        invSvgState.iconImage = imageEl;
      }
    }

    invSvgState.pdsText = queryInvId("PDS_text_to_modify");
    invSvgState.dtText = queryInvId("DT_text_to_modify");
    invSvgState.hpText = queryInvId("HP_text_to_modify");
    invSvgState.capsText = queryInvId("CAPS_text_to_modify");
    invSvgState.effectsRow = queryInvId("effects_row");
    if (invSvgState.effectsRow) {
      invSvgState.effectsRowBaseTransform = invSvgState.effectsRow.getAttribute("transform") || "";
      const { x, y } = parseTranslate(invSvgState.effectsRowBaseTransform);
      invSvgState.effectsRowBaseX = x;
      invSvgState.effectsRowBaseY = y;
      const bottomRow = queryInvLabel("bottom_row");
      if (bottomRow) {
        const { y: bottomY } = parseTranslate(bottomRow.getAttribute("transform") || "");
        if (Number.isFinite(bottomY)) {
          const gap = y - bottomY;
          invSvgState.effectsRowGap = Number.isFinite(gap) && gap > 0 ? gap : null;
        }
      }
    }
    invSvgState.condBarGroup = queryInvId("cond_bar");
    invSvgState.condBarEmpty = queryInvId("cond_bar_empty");
    invSvgState.condBarFull = queryInvId("cond_bar_full");
    invSvgState.condBarChevrons = queryInvId("chevrons");

    if (invSvgState.effectsText) {
      cacheSvgTextBase(invSvgState.effectsText);
      invSvgState.effectsText.dataset.align = "end";
    }

    applyTextClip(invSvgState.pdsText, "PDS_clip", true);
    applyTextClip(invSvgState.hpText, "HP_clip", true);
    applyTextClip(invSvgState.dtText, "DT_clip", true);
    applyTextClip(invSvgState.capsText, "CAPS_clip", true);
    applyTextClip(invSvgState.vwText, "value_over_weight_clip", true);
    applyTextClip(invSvgState.strText, "STR_clip", true);
    applyTextClip(invSvgState.dpsText, "DPS_clip", true);
    applyTextClip(invSvgState.weightText, "WEIGHT_clip", true);
    applyTextClip(invSvgState.degText, "DEG_clip", true);
    applyTextClip(invSvgState.valText, "VAL_clip", true);
    applyTextClip(invSvgState.effectsText, "EFFETS_clip", false);

    anchorTextToClipRight(invSvgState.pdsText, "PDS_clip");
    anchorTextToClipRight(invSvgState.hpText, "HP_clip");
    anchorTextToClipRight(invSvgState.dtText, "DT_clip");
    anchorTextToClipRight(invSvgState.capsText, "CAPS_clip");
    anchorTextToClipRight(invSvgState.vwText, "value_over_weight_clip");
    anchorTextToClipRight(invSvgState.strText, "STR_clip");
    anchorTextToClipRight(invSvgState.dpsText, "DPS_clip");
    anchorTextToClipRight(invSvgState.weightText, "WEIGHT_clip");
    anchorTextToClipRight(invSvgState.degText, "DEG_clip");
    anchorTextToClipRight(invSvgState.valText, "VAL_clip");

    applyIconClipLayout(invSvgState.iconImage, "item_icon_clip");


    bindInventorySvgInteractions();

    if (invState.data?.open) {
      renderInventory(invState.data);
    }
  }

  function ensureInventorySvgReady() {
    window.addEventListener("FNV:InventoryReady", initInventorySvg);
    if (document.getElementById("fnv_inventory")?.querySelector("svg")) initInventorySvg();
  }

  function setHpTicks(pct01) {
    if (!hudSvgState.hpClipRect || hudSvgState.hpClipBaseWidth == null) return;
    const safe = clamp(pct01, 0, 1);
    const baseWidth = hudSvgState.hpClipBaseWidth ?? HP_CLIP_FULL_WIDTH;
    const width = Number((baseWidth * safe).toFixed(SVG_ATTR_PRECISION));
    const baseX = hudSvgState.hpClipBaseX ?? HP_CLIP_FULL_X;
    const nextX = HP_CLIP_ANCHOR_RIGHT
      ? Number((baseX + (baseWidth - width)).toFixed(SVG_ATTR_PRECISION))
      : baseX;

    if (hudSvgState.hpLastWidth == null || Math.abs(width - hudSvgState.hpLastWidth) > DOM_EPSILON) {
      hudSvgState.hpClipRect.setAttribute("width", String(width));
      hudSvgState.hpLastWidth = width;
    }

    if (HP_CLIP_ANCHOR_RIGHT) {
      if (hudSvgState.hpLastX == null || Math.abs(nextX - hudSvgState.hpLastX) > DOM_EPSILON) {
        hudSvgState.hpClipRect.setAttribute("x", String(nextX));
        hudSvgState.hpLastX = nextX;
      }
    }
  }

  function setHpLowState(isLow) {
    const ticks = hudSvgState.hpTicksGroup;
    if (!ticks) return;
    if (isLow) {
      ticks.style.filter = "brightness(0.7)";
      if (!hudSvgState.hpLowTimer) {
        let on = true;
        hudSvgState.hpLowTimer = window.setInterval(() => {
          on = !on;
          ticks.style.opacity = on ? "1" : "0.35";
        }, 320);
      }
    } else {
      if (hudSvgState.hpLowTimer) {
        window.clearInterval(hudSvgState.hpLowTimer);
        hudSvgState.hpLowTimer = null;
      }
      ticks.style.opacity = "1";
      ticks.style.filter = "";
    }
  }

  function setCompassYaw(deg) {
    const strip = hudSvgState.compassStripContent;
    if (!strip) return;
    const yaw = normDeg(deg);
    const baseOffset = hudSvgState.compassBaseOffset ?? COMPASS_BASE_OFFSET;
    const rawOffset = baseOffset + (COMPASS_RAW_SIGN * yaw * COMPASS_PERIOD) / 360;
    const halfPeriod = COMPASS_PERIOD / 2;
    const wrapped = (((rawOffset + halfPeriod) % COMPASS_PERIOD) + COMPASS_PERIOD) % COMPASS_PERIOD;
    // Keep the strip centered in [-PERIOD/2, +PERIOD/2) to minimize drift.
    const finalOffset = wrapped - halfPeriod;
    if (hudSvgState.compassLastOffset == null || Math.abs(finalOffset - hudSvgState.compassLastOffset) > DOM_EPSILON) {
      hudSvgState.compassLastOffset = finalOffset;
      strip.setAttribute("transform", `translate(${finalOffset} 0)`);
    }
  }

  function getApTickCount() {
    if (apTickState.tickCount != null) return apTickState.tickCount;
    const ticks = queryRightSubAll("#hp_ticks_fill rect");
    const count = ticks ? ticks.length : 0;
    if (count > 0) apTickState.tickCount = count;
    return count;
  }

  function getApClipBaseWidth() {
    if (apTickState.baseWidth != null) return apTickState.baseWidth;
    const rect = elApTicksClip();
    if (!rect) return null;
    const base = parseFloat(rect.getAttribute("width") || "0");
    const safe = Number.isFinite(base) ? base : 0;
    if (safe > 0) apTickState.baseWidth = safe;
    return safe;
  }

  function applyApTicks(count) {
    const rect = elApTicksClip();
    const tickCount = getApTickCount();
    const baseWidth = getApClipBaseWidth();
    if (!rect || !tickCount || baseWidth == null) return;
    const safeCount = clamp(count, 0, tickCount);
    const width = (baseWidth * safeCount) / tickCount;
    rect.setAttribute("width", width.toFixed(4));
  }

  function animateApTicksTo(target) {
    const tickCount = getApTickCount();
    if (!tickCount) return;
    const safeTarget = clamp(target, 0, tickCount);
    if (apTickState.current == null) {
      apTickState.current = safeTarget;
      applyApTicks(safeTarget);
      return;
    }
    apTickState.target = safeTarget;
    if (apTickState.timer) return;
    apTickState.timer = window.setInterval(() => {
      if (apTickState.current === apTickState.target) {
        window.clearInterval(apTickState.timer);
        apTickState.timer = null;
        return;
      }
      const dir = apTickState.current < apTickState.target ? 1 : -1;
      apTickState.current += dir;
      applyApTicks(apTickState.current);
    }, 45);
  }

  function setMicState(open) {
    const showOpen = !!open;
    const openEls = [elMicOpen(), elMicOpenGlow()];
    const closedEls = [elMicClosed(), elMicClosedGlow()];
    openEls.forEach((el) => {
      if (!el) return;
      el.style.display = showOpen ? "inline" : "none";
    });
    closedEls.forEach((el) => {
      if (!el) return;
      el.style.display = showOpen ? "none" : "inline";
    });
  }

  function normDeg(d) {
    d = Number(d || 0);
    d = d % 360;
    if (d < 0) d += 360;
    return d;
  }

  // delta in [-180, +180]
  function shortestDeltaDeg(from, to) {
    return ((to - from + 540) % 360) - 180;
  }

  /* ===================== */
  /* HUD State             */
  /* ===================== */
  let stateReceived = false;
  let lastHudState = null;
  function setState(state) {
    stateReceived = true;
    lastHudState = state || null;
    // -------- HP --------
    const hp    = Number(state?.hp ?? 0);
    const hpMax = Number(state?.hp_max ?? 0);

    const hpPct = hpMax > 0 ? (hp / hpMax) : 0;
    setHpTicks(hpPct);
    setHpLowState(hpMax > 0 && (hpPct * 100) < 20);

    // -------- AP --------
    const apNow = Number(state?.ap?.now ?? 0);
    const apMax = Number(state?.ap?.max ?? 0);
    const apPct = apMax > 0 ? (apNow / apMax) * 100 : 100;
    const apTickCount = getApTickCount();
    const apTargetTicks = apTickCount ? Math.round((apPct / 100) * apTickCount) : 0;
    animateApTicksTo(apTargetTicks);
    const rightSub = elRightSubBar();
    if (rightSub) rightSub.classList.toggle("ap_low", apMax > 0 && apPct < 20);

    // -------- CND (placeholder) --------
    // Future contract:
    // state.cnd.armor_pct / state.cnd.weapon_pct in [0..100]
    // state.equip.armor_body / state.equip.weapon truthy when equipped
    const armorEquipped = !!(state?.equip?.armor || state?.equip?.armor_body);
    const weaponEquipped = !!state?.equip?.weapon;

    const armorPct = state?.cnd?.armor_pct;
    const weaponPct = state?.cnd?.weapon_pct;

    const armorVisible = !(!armorEquipped && (armorPct == null));
    const weaponVisible = !(!weaponEquipped && (weaponPct == null));

    setCondVisible(
      armorVisible,
      elCndArmorFill(),
      elCndArmorEmpty(),
      elCndArmorLabel(),
      elCndArmorChevronTop(),
      elCndArmorChevronBottom()
    );
    setCondVisible(
      weaponVisible,
      elCndWeaponFill(),
      elCndWeaponEmpty(),
      elCndWeaponLabel(),
      elCndWeaponChevronTop(),
      elCndWeaponChevronBottom()
    );

    if (armorVisible) {
      const pct = Number(armorPct ?? 100);
      setRectFillWidth(elCndArmorFill(), pct);
      setCondCritical(elCndArmorFill(), pct < 10);
    }

    if (weaponVisible) {
      const pct = Number(weaponPct ?? 100);
      setRectFillWidth(elCndWeaponFill(), pct);
      setCondCritical(elCndWeaponFill(), pct < 10);
    }
    if (!armorVisible) setCondCritical(elCndArmorFill(), false);
    if (!weaponVisible) setCondCritical(elCndWeaponFill(), false);

    // -------- Ammo (placeholder) --------
    const ammoNow = state?.ammo?.now;
    const ammoReserve = state?.ammo?.reserve;
    const ammoEl = elAmmoText();
    const ammoSpanEl = elAmmoTextSpan();
    const ammoText =
      (ammoNow == null || ammoReserve == null)
        ? "15/532"
        : `${Math.floor(Number(ammoNow))}/${Math.floor(Number(ammoReserve))}`;
    if (ammoSpanEl) ammoSpanEl.textContent = ammoText;
    if (ammoEl) {
      ammoEl.setAttribute("text-anchor", "middle");
      ammoEl.setAttribute("dominant-baseline", "alphabetic");
      if (!ammoSpanEl) ammoEl.textContent = ammoText;
    }

    // -------- Money --------
    const capsEl = elCaps();
    if (capsEl) capsEl.textContent = Math.floor(Number(state?.money?.caps ?? 0));

    const micOpen = !!(state?.voice?.talking ?? state?.voice?.open ?? state?.mic?.open);
    setMicState(micOpen);

    updateReticleState();
  }

  window.addEventListener("FNV:RightSubBarReady", () => {
    if (lastHudState) setState(lastHudState);
  });

  /* ===================== */
  /* Notifications         */
  /* ===================== */
  function normalizeIconPath(icon) {
    const raw = String(icon || "").trim();
    if (!raw) return "";
    const fileName = raw.split("/").pop() || "";
    if (fileName.includes(".")) return raw;
    return `${raw}.png`;
  }

  function splitNotifyText(text) {
    const lines = String(text || "").split("\n");
    if (lines.length <= 1) return { title: String(text || ""), subtitle: "" };
    return { title: lines[0], subtitle: lines.slice(1).join(" ") };
  }

  function notify(payload) {
    const baseText = payload?.text ?? "";
    const titleRaw = payload?.title ?? payload?.subject ?? "";
    const subtitleRaw = payload?.subtitle ?? payload?.detail ?? payload?.body ?? "";
    const iconRaw = normalizeIconPath(payload?.icon ?? payload?.icon_path ?? payload?.icon_url ?? "");

    const text = String(titleRaw || baseText || "");
    const subtitle = String(subtitleRaw || "");
    const lines = (!titleRaw && !subtitleRaw) ? splitNotifyText(baseText) : null;

    if (!text && !lines?.title) return;

    const notifs = elNotifs();
    if (!notifs) return;

    const ms = Number(payload?.ms ?? 3500);

    const wrap = document.createElement("div");
    wrap.className = "fnv_notify_item";

    const frame = document.createElement("div");
    frame.className = "fnv_notify_frame";

    const iconEl = document.createElement("div");
    iconEl.className = "fnv_notify_icon";
    if (iconRaw) {
      const img = document.createElement("img");
      img.className = "fnv_notify_icon_img";
      img.src = iconRaw;
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      iconEl.appendChild(img);
    } else {
      iconEl.classList.add("empty");
    }

    const textEl = document.createElement("div");
    textEl.className = "fnv_notify_text";

    const titleEl = document.createElement("div");
    titleEl.className = "fnv_notify_title";
    titleEl.textContent = lines ? lines.title : text;

    const subtitleEl = document.createElement("div");
    subtitleEl.className = "fnv_notify_subtitle";
    subtitleEl.textContent = lines ? lines.subtitle : subtitle;
    if (!subtitleEl.textContent) subtitleEl.classList.add("fnv_hidden");

    textEl.appendChild(titleEl);
    textEl.appendChild(subtitleEl);

    frame.appendChild(iconEl);
    frame.appendChild(textEl);
    wrap.appendChild(frame);

    notifs.appendChild(wrap);

    requestAnimationFrame(() => {
      wrap.classList.add("show");
    });

    const lifespan = clamp(ms, 800, 15000);
    window.setTimeout(() => {
      wrap.classList.add("hide");
      window.setTimeout(() => {
        wrap.remove();
      }, 260);
    }, lifespan);
  }

  /* ===================== */
  /* Repair Kit Menu       */
  /* ===================== */
  const repairMenuState = {
    open: false,
    slots: [],
    selected: 0,
    item: null,
    category: null,
    equipped: null
  };

  function isRepairKit(item) {
    const raw = String(item?.item_id ?? item?.id ?? "").toLowerCase();
    if (raw === "repair_kit" || raw === "repairkit") return true;
    if (raw.includes("repair_kit")) return true;
    return !!item?.repair_kit || !!item?.is_repair_kit;
  }

  function formatRepairLabel(slotLabel, item) {
    const name = String(item?.name ?? item?.item_id ?? "").trim();
    const cnd = Number(item?.cnd);
    const max = Number(item?.max_cnd ?? 0);
    let suffix = "";
    if (Number.isFinite(cnd) && Number.isFinite(max) && max > 0) {
      suffix = ` (${Math.round((cnd / max) * 100)}%)`;
    }
    if (name) return `${slotLabel} - ${name}${suffix}`;
    return slotLabel;
  }

  function buildRepairSlots() {
    const slots = [];
    const equipItems = repairMenuState.equipped ?? lastHudState?.equipped_items ?? {};
    const equip = lastHudState?.equip ?? {};

    const weaponItem = equipItems.weapon || (equip.weapon ? { name: "ARME" } : null);
    if (weaponItem) {
      slots.push({ label: formatRepairLabel("ARME", weaponItem), slot: "weapon", item: weaponItem });
    }

    const bodyItem = equipItems.armor_body || equipItems.armor || (equip.armor_body || equip.armor ? { name: "ARMURE" } : null);
    if (bodyItem) {
      slots.push({ label: formatRepairLabel("ARMURE", bodyItem), slot: "armor_body", item: bodyItem });
    }

    const headItem = equipItems.armor_head || (equip.armor_head ? { name: "CASQUE" } : null);
    if (headItem) {
      slots.push({ label: formatRepairLabel("CASQUE", headItem), slot: "armor_head", item: headItem });
    }

    return slots;
  }

  function syncRepairSelection() {
    const listEl = elRepairList();
    if (!listEl) return;
    const rows = Array.from(listEl.children);
    rows.forEach((row, idx) => {
      row.classList.toggle("selected", idx === repairMenuState.selected);
      const marker = row.querySelector(".fnv_repair_row_marker");
      if (marker) marker.textContent = idx === repairMenuState.selected ? ">" : "";
    });
  }

  function renderRepairMenu() {
    const wrap = elRepairMenu();
    const listEl = elRepairList();
    if (!wrap || !listEl) return;

    if (!repairMenuState.open) {
      wrap.classList.add("fnv_hidden");
      wrap.setAttribute("aria-hidden", "true");
      listEl.innerHTML = "";
      return;
    }

    listEl.innerHTML = "";
    repairMenuState.slots.forEach((slot, idx) => {
      const row = document.createElement("div");
      row.className = "fnv_repair_row";
      if (idx === repairMenuState.selected) row.classList.add("selected");

      const marker = document.createElement("div");
      marker.className = "fnv_repair_row_marker";
      marker.textContent = idx === repairMenuState.selected ? ">" : "";

      const icon = document.createElement("div");
      icon.className = "fnv_repair_icon";
      if (slot?.item?.icon) {
        icon.innerHTML = `<img src="${slot.item.icon}" alt="">`;
      }

      const label = document.createElement("div");
      label.textContent = slot.label;

      row.appendChild(marker);
      row.appendChild(icon);
      row.appendChild(label);

      row.addEventListener("mouseenter", () => {
        if (repairMenuState.selected === idx) return;
        repairMenuState.selected = idx;
        syncRepairSelection();
      });

      const handleSelect = () => {
        repairMenuState.selected = idx;
        confirmRepairSelection();
      };

      row.addEventListener("click", handleSelect);

      listEl.appendChild(row);
    });

    wrap.classList.remove("fnv_hidden");
    wrap.setAttribute("aria-hidden", "false");
    syncRepairSelection();
  }

  function openRepairMenu(item, category) {
    const invEquipped = invState?.data?.equipped_items ?? null;
    repairMenuState.equipped = invEquipped;
    const slots = buildRepairSlots();
    if (!slots.length) return false;

    repairMenuState.open = true;
    repairMenuState.slots = slots;
    repairMenuState.selected = 0;
    repairMenuState.item = item || null;
    repairMenuState.category = category || null;
    renderRepairMenu();
    Events.Call("Inv:ModalOpen", {});
    ensureUiFocus();
    return true;
  }

  function closeRepairMenu() {
    repairMenuState.open = false;
    repairMenuState.slots = [];
    repairMenuState.selected = 0;
    repairMenuState.item = null;
    repairMenuState.category = null;
    repairMenuState.equipped = null;
    renderRepairMenu();
    Events.Call("Inv:ModalClose", {});
  }

  function confirmRepairSelection() {
    const slot = repairMenuState.slots[repairMenuState.selected];
    if (!slot || !repairMenuState.item) return;
    sendInvAction("use", repairMenuState.item, repairMenuState.category, slot.slot);
    closeRepairMenu();
  }

  function handleRepairMenuKey(key) {
    if (!repairMenuState.open) return false;
    if (key === "up") {
      repairMenuState.selected = Math.max(0, repairMenuState.selected - 1);
      syncRepairSelection();
      return true;
    }
    if (key === "down") {
      repairMenuState.selected = Math.min(repairMenuState.slots.length - 1, repairMenuState.selected + 1);
      syncRepairSelection();
      return true;
    }
    if (key === "action" || key === "confirm") {
      confirmRepairSelection();
      return true;
    }
    if (key === "cancel" || key === "back") {
      closeRepairMenu();
      return true;
    }
    return false;
  }

  /* ===================== */
  /* Compass */
  /* ===================== */
  const COMPASS_EASE = 0.22;

  let headingTargetUnwrapped = 0;
  let headingRenderUnwrapped = null;
  let compassRaf = null;

  function renderCompass() {
    setCompassYaw(headingRenderUnwrapped);
  }

  function tickCompass() {
    if (headingRenderUnwrapped == null) {
      headingRenderUnwrapped = headingTargetUnwrapped;
    }
    const delta = shortestDeltaDeg(headingRenderUnwrapped, headingTargetUnwrapped);
    if (Math.abs(delta) < 0.001) {
      headingRenderUnwrapped = headingTargetUnwrapped;
    } else {
      headingRenderUnwrapped = normDeg(headingRenderUnwrapped + (delta * COMPASS_EASE));
    }
    renderCompass();

    if (headingRenderUnwrapped != headingTargetUnwrapped) {
      compassRaf = requestAnimationFrame(tickCompass);
    } else {
      compassRaf = null;
    }
  }

  function setHeadingTarget(deg) {
    const h = normDeg(deg);
    headingTargetUnwrapped = h;
    if (headingRenderUnwrapped == null) headingRenderUnwrapped = h;
    if (!compassRaf) compassRaf = requestAnimationFrame(tickCompass);
  }


  /* ===================== */
  /* Interact Prompt (NPC) */
  /* ===================== */
  const elInteract = () => document.getElementById("fnv_interact");
  const elInteractKey = () => document.querySelector("#fnv_interact .fnv_interact_key");
  const elInteractAction = () => document.querySelector("#fnv_interact .fnv_interact_action");
  const elInteractName = () => document.querySelector("#fnv_interact .fnv_interact_name");

  let interactVisible = false;
  let interactHideTimer = null;
  let interactShowState = false;

  function setInteractPrompt(payload) {
    const wrap = elInteract();
    if (!wrap) return;

    const show = !!payload?.show;
    const key = String(payload?.key ?? "E").toUpperCase();
    const action = String(payload?.action ?? "INTERAGIR").toUpperCase();
    const name = String(payload?.name ?? "");
    const r = elReticle();
    interactShowState = show;

    // Anti-flicker: si on reçoit show=true, on annule un hide en attente
    if (interactHideTimer) {
      clearTimeout(interactHideTimer);
      interactHideTimer = null;
    }



    if (!show) {
      // petit délai pour éviter clignotements si le raycast oscille
      interactHideTimer = setTimeout(() => {
        wrap.classList.add("fnv_hidden");
        interactVisible = false;
        interactHideTimer = null;
        updateReticleState();
      }, 80);

      if (r) r.classList.add("fnv_hidden");

      return;
    }

    if (r) r.classList.remove("fnv_hidden");
    updateReticleState();

    // Update text
    const k = elInteractKey(); if (k) k.textContent = `[${key}]`;
    const a = elInteractAction(); if (a) a.textContent = action;
    const n = elInteractName(); if (n) n.textContent = name ? `${name}` : "";

    if (!interactVisible) {
      wrap.classList.remove("fnv_hidden");
      interactVisible = true;
    }
  }

// Lua -> WebUI
Events.Subscribe("HUD:InteractPrompt", setInteractPrompt);

  /* ===================== */
  /* Container Loot        */
  /* ===================== */
  let containerState = { open: false, items: [], selected: 0, container: null };

  function renderContainer(payload){
    const wrap = elContainer();
    if (!wrap) return;

    const open = !!payload?.open;
    containerState.open = open;
    if (!open) {
      wrap.classList.add("fnv_hidden");
      wrap.setAttribute("aria-hidden", "true");
      return;
    }

    containerState.container = payload?.container || null;
    containerState.items = Array.isArray(payload?.items) ? payload.items : [];
    containerState.selected = Number(payload?.selected?.index ?? payload?.selected ?? containerState.selected ?? 0);

    if (containerState.selected < 0) containerState.selected = 0;
    if (containerState.selected > containerState.items.length - 1) {
      containerState.selected = Math.max(0, containerState.items.length - 1);
    }

    const titleEl = elContainerTitle();
    if (titleEl) {
      titleEl.textContent = String(payload?.container?.name ?? "CONTAINER").toUpperCase();
    }

    const weightEl = elContainerWeight();
    if (weightEl) {
      const total = containerState.items.reduce((sum, item) => {
        const qty = Number(item?.qty ?? 1);
        const wg = Number(item?.wg ?? item?.weight ?? 0);
        return sum + (Number.isFinite(wg) ? wg * (Number.isFinite(qty) ? qty : 1) : 0);
      }, 0);
      weightEl.textContent = `PDS ${total.toFixed(1)}`;
    }

    const listEl = elContainerList();
    if (listEl) {
      listEl.innerHTML = "";
      if (!containerState.items.length) {
        const row = document.createElement("div");
        row.className = "fnv_container_row";
        row.textContent = "...";
        listEl.appendChild(row);
      } else {
        containerState.items.forEach((item, idx) => {
          const row = document.createElement("div");
          row.className = "fnv_container_row";
          if (idx === containerState.selected) row.classList.add("selected");

          const icon = document.createElement("div");
          icon.className = "fnv_container_row_icon";
          if (item?.icon) {
            icon.innerHTML = `<img src="${item.icon}" alt="">`;
          }

          const name = document.createElement("div");
          name.className = "fnv_container_row_name";
          const qty = Number(item?.qty ?? 1);
          const label = String(item?.name ?? item?.item_id ?? "");
          name.textContent = qty > 1 ? `${label} (${qty})` : label;

          const cndWrap = document.createElement("div");
          cndWrap.className = "fnv_container_row_cnd";
          const cndFill = document.createElement("div");
          cndFill.className = "fnv_container_row_cnd_fill";
          const max = Number(item?.max_cnd ?? 100);
          const pct = max > 0 ? Math.max(0, Math.min(1, Number(item?.cnd ?? 0) / max)) : 0;
          cndFill.style.width = `${Math.round(pct * 100)}%`;
          cndWrap.appendChild(cndFill);

          const category = String(item?.category ?? "").toLowerCase();
          const showCnd = category === "weapons" || category === "apparel";
          if (!showCnd) {
            cndWrap.style.visibility = "hidden";
          }

          row.appendChild(icon);
          row.appendChild(name);
          row.appendChild(cndWrap);

          listEl.appendChild(row);
        });
      }
    }

    wrap.classList.remove("fnv_hidden");
    wrap.setAttribute("aria-hidden", "false");
  }

  /* ===================== */
  /* Container Transfer    */
  /* ===================== */
  let transferState = {
    open: false,
    leftItems: [],
    rightItems: [],
    selectedSide: "left",
    selectedIndex: 0,
    container: null,
    player: null,
    scrollLeft: 0,
    scrollRight: 0
  };

  const TRANSFER_ROW_H = 28;

  function normalizeTransferSelection(){
    const items = transferState.selectedSide === "left" ? transferState.leftItems : transferState.rightItems;
    let idx = transferState.selectedIndex;
    if (idx < 0) idx = 0;
    if (idx > items.length - 1) idx = Math.max(0, items.length - 1);
    transferState.selectedIndex = idx;
    return { items, idx };
  }

  function renderTransferList(listEl, items, selectedIdx){
    if (!listEl) return;
    listEl.innerHTML = "";
    if (!items.length) {
      const row = document.createElement("div");
      row.className = "fnv_transfer_row";
      row.textContent = "...";
      listEl.appendChild(row);
      return;
    }
    items.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "fnv_transfer_row";
      if (idx === selectedIdx) row.classList.add("selected");
      row.dataset.index = String(idx);
      const qty = Number(item?.qty ?? 1);
      const name = String(item?.name ?? item?.item_id ?? "");
      row.textContent = qty > 1 ? `${name} (${qty})` : name;
      listEl.appendChild(row);
    });
  }

  function renderTransferStats(item){
    const gridEl = elTransferStatsGrid();
    if (!gridEl) return;
    gridEl.innerHTML = "";
    const data = item || {};

    const makeCell = (label, value, opts = {}) => {
      const cell = document.createElement("div");
      cell.className = "fnv_transfer_stat";
      if (opts.wide) cell.classList.add("wide");

      const lab = document.createElement("div");
      lab.className = "fnv_transfer_stat_label";
      lab.textContent = label;

      const val = document.createElement("div");
      val.className = "fnv_transfer_stat_value";
      val.textContent = value;

      cell.appendChild(lab);
      cell.appendChild(val);
      return cell;
    };

    const makeRow = (cells) => {
      const row = document.createElement("div");
      row.className = "fnv_transfer_stats_row";
      cells.forEach((cell) => row.appendChild(cell));
      gridEl.appendChild(row);
    };

    const dps = data?.dps != null ? String(data.dps) : "----";
    const vw = data?.vw != null ? String(data.vw) : "----";
    const str = data?.str != null ? String(data.str) : "-";
    makeRow([
      makeCell("DPS", dps),
      makeCell("V/W", vw),
      makeCell("STR", str)
    ]);

    const dam = data?.dam != null ? String(data.dam) : "----";
    const wg = data?.wg != null ? String(data.wg) : "--.--";
    const val = data?.value != null ? String(data.value) : "----";
    makeRow([
      makeCell("DEG", dam),
      makeCell("PDS", wg),
      makeCell("VAL", val)
    ]);

    const cndRow = document.createElement("div");
    cndRow.className = "fnv_transfer_stats_row";
    const cndCell = document.createElement("div");
    cndCell.className = "fnv_transfer_stat wide";
    const cndLab = document.createElement("div");
    cndLab.className = "fnv_transfer_stat_label";
    cndLab.textContent = "ETAT";
    const cndBar = document.createElement("div");
    cndBar.className = "fnv_transfer_cnd_bar";
    const cndFill = document.createElement("div");
    cndFill.className = "fnv_transfer_cnd_fill";
    const max = Number(data?.max_cnd ?? 100);
    const pct = max > 0 ? Math.max(0, Math.min(1, Number(data?.cnd ?? 0) / max)) : 0;
    cndFill.style.width = `${Math.round(pct * 100)}%`;
    cndBar.appendChild(cndFill);
    cndCell.appendChild(cndLab);
    cndCell.appendChild(cndBar);

    const ammoText = data?.ammo ?? data?.ammo_line ?? "Munitions (--/----)";
    const ammoCell = makeCell("Munitions", String(ammoText), { wide: true });

    cndRow.appendChild(cndCell);
    cndRow.appendChild(ammoCell);
    gridEl.appendChild(cndRow);

    const mods = Array.isArray(data?.mods) ? data.mods : (data?.mods ? [data.mods] : []);
    const modsRow = document.createElement("div");
    modsRow.className = "fnv_transfer_stats_row";
    const modsCell = document.createElement("div");
    modsCell.className = "fnv_transfer_stat wide";
    const modsLab = document.createElement("div");
    modsLab.className = "fnv_transfer_stat_label";
    modsLab.textContent = "MODS";
    const modsVal = document.createElement("div");
    modsVal.className = "fnv_transfer_stat_value";
    if (mods.length) {
      modsVal.innerHTML = mods.map((m, idx) => `${idx === 0 ? "" : "<br>"}- ${m}`).join("");
    } else {
      modsVal.textContent = "-";
    }
    modsCell.appendChild(modsLab);
    modsCell.appendChild(modsVal);
    modsRow.appendChild(modsCell);
    gridEl.appendChild(modsRow);
  }

  function renderTransferFromState(){
    const wrap = elTransfer();
    if (!wrap) return;
    if (!transferState.open) {
      wrap.classList.add("fnv_hidden");
      wrap.setAttribute("aria-hidden", "true");
      return;
    }

    const leftTitle = elTransferLeftTitle();
    if (leftTitle) leftTitle.textContent = String(transferState.player?.name ?? "OBJETS").toUpperCase();
    const rightTitle = elTransferRightTitle();
    if (rightTitle) rightTitle.textContent = String(transferState.container?.name ?? "CONTAINER").toUpperCase();

    const leftWeight = elTransferLeftWeight();
    if (leftWeight) {
      const cur = transferState.player?.weight?.current;
      const max = transferState.player?.weight?.max;
      if (cur != null && max != null) {
        leftWeight.textContent = `PDS ${Number(cur).toFixed(1)}/${Number(max).toFixed(1)}`;
      } else {
        leftWeight.textContent = "PDS --";
      }
    }
    const rightWeight = elTransferRightWeight();
    if (rightWeight) {
      const wg = transferState.container?.weight;
      rightWeight.textContent = wg != null ? `PDS ${Number(wg).toFixed(1)}` : "PDS --";
    }

    const sel = normalizeTransferSelection();
    const leftListEl = elTransferLeftList();
    const rightListEl = elTransferRightList();

    const leftIdx = transferState.selectedSide === "left" ? sel.idx : -1;
    const rightIdx = transferState.selectedSide === "right" ? sel.idx : -1;

    renderTransferList(leftListEl, transferState.leftItems, leftIdx);
    renderTransferList(rightListEl, transferState.rightItems, rightIdx);

    const item = sel.items[sel.idx];
    const iconEl = elTransferDetailsIcon();
    if (iconEl) {
      iconEl.innerHTML = item?.icon ? `<img src="${item.icon}" alt="">` : "";
    }
    const nameEl = elTransferItemName();
    if (nameEl) {
      nameEl.textContent = item ? String(item?.name ?? item?.item_id ?? "").toUpperCase() : "";
    }
    renderTransferStats(item);

    const leftViewport = leftListEl?.parentElement || null;
    const rightViewport = rightListEl?.parentElement || null;

    const ensureVisible = (viewport, row) => {
      if (!viewport || !row) return;
      row.scrollIntoView({ block: "nearest" });
    };

    const updateScrollArrows = (viewport, upEl, downEl) => {
      if (!viewport) return;
      const canUp = viewport.scrollTop > 0;
      const canDown = viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 1;
      if (upEl) upEl.style.opacity = canUp ? "1" : "0.2";
      if (downEl) downEl.style.opacity = canDown ? "1" : "0.2";
    };

    if (transferState.selectedSide === "left") {
      const row = leftListEl?.querySelector(`.fnv_transfer_row[data-index="${sel.idx}"]`);
      ensureVisible(leftViewport, row);
    } else {
      const row = rightListEl?.querySelector(`.fnv_transfer_row[data-index="${sel.idx}"]`);
      ensureVisible(rightViewport, row);
    }

    window.requestAnimationFrame(() => {
      updateScrollArrows(leftViewport, elTransferLeftUp(), elTransferLeftDown());
      updateScrollArrows(rightViewport, elTransferRightUp(), elTransferRightDown());
    });

    wrap.classList.remove("fnv_hidden");
    wrap.setAttribute("aria-hidden", "false");
  }

  function renderTransfer(payload){
    const wrap = elTransfer();
    if (!wrap) return;
    const open = !!payload?.open;
    transferState.open = open;
    if (!open) {
      wrap.classList.add("fnv_hidden");
      wrap.setAttribute("aria-hidden", "true");
      return;
    }

    transferState.leftItems = Array.isArray(payload?.player_items) ? payload.player_items : [];
    transferState.rightItems = Array.isArray(payload?.container_items) ? payload.container_items : [];
    transferState.container = payload?.container || null;
    transferState.player = payload?.player || null;
    transferState.selectedSide = String(payload?.selected?.side ?? transferState.selectedSide ?? "left");
    transferState.selectedIndex = Number(payload?.selected?.index ?? transferState.selectedIndex ?? 0);
    transferState.scrollLeft = 0;
    transferState.scrollRight = 0;

    renderTransferFromState();
  }


  /* ===================== */
  /* Admin Console (WebUI) */
  /* ===================== */
  let adminOpen = false;
  let adminHistory = [];
  let adminHistIdx = -1;

  function adminEl(id) { return document.getElementById(id); }

  function adminLog(line) {
    const log = adminEl("fnv-admin-log");
    if (!log) return;

    const div = document.createElement("div");
    div.className = "fnv_admin_line";
    div.textContent = line;

    log.prepend(div);
    while (log.children.length > 8) log.removeChild(log.lastChild);
  }

  function setAdminOpen(force) {
    const wrap = adminEl("fnv-admin-console");
    const input = adminEl("fnv-admin-input");
    if (!wrap || !input) return;

    adminOpen = (typeof force === "boolean") ? force : !adminOpen;
    wrap.style.display = adminOpen ? "block" : "none";

    if (adminOpen) {
      input.value = "";
      input.focus();
      adminHistIdx = -1;
      Events.Call("HUD:AdminOpen", true);
    } else {
      input.blur();
      Events.Call("HUD:AdminOpen", false);
    }
  }

  function initAdminConsole() {
    const input = adminEl("fnv-admin-input");
    if (!input) return false;

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const raw = input.value.trim();
        if (raw.length > 0) {
          const cmd = raw.startsWith("/") ? raw : "/" + raw;
          adminHistory.unshift(cmd);
          if (adminHistory.length > 30) adminHistory.pop();
          adminLog("> " + cmd);
          Events.Call("HUD:AdminCommand", cmd);
        }
        input.value = "";
        e.preventDefault();
        return;
      }

      if (e.key === "Escape") {
        setAdminOpen(false);
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowUp") {
        if (adminHistory.length === 0) return;
        adminHistIdx = Math.min(adminHistIdx + 1, adminHistory.length - 1);
        input.value = adminHistory[adminHistIdx];
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowDown") {
        if (adminHistory.length === 0) return;
        adminHistIdx = Math.max(adminHistIdx - 1, -1);
        input.value = adminHistIdx === -1 ? "" : adminHistory[adminHistIdx];
        e.preventDefault();
        return;
      }
    });

    // Global toggle (F2)
    const onAdminToggleKey = (e) => {
      const isF2 = e.key === "F2" || e.code === "F2" || e.keyCode === 113;
      if (!isF2) return;
      setAdminOpen();
      e.preventDefault();
    };
    document.addEventListener("keydown", onAdminToggleKey, true);
    window.addEventListener("keydown", onAdminToggleKey, true);
    document.addEventListener("keyup", onAdminToggleKey, true);
    window.addEventListener("keyup", onAdminToggleKey, true);

    Events.Subscribe("HUD:Admin:SetOpen", (v) => setAdminOpen(!!v));
    Events.Subscribe("HUD:Admin:Log", (line) => adminLog(String(line || "")));
    return true;
  }

  /* ===================== */
  /* Lua -> JS Events      */
  /* ===================== */
Events.Subscribe("HUD:SetState", setState);
Events.Subscribe("HUD:Notify", notify);
Events.Subscribe("HUD:EnemyTarget", setEnemyTarget);
Events.Subscribe("HUD:SetVisible", setHudVisible);
Events.Subscribe("Container:Open", renderContainer);
Events.Subscribe("Container:Close", () => renderContainer({ open: false }));
Events.Subscribe("Container:TransferOpen", renderTransfer);
Events.Subscribe("Container:TransferClose", () => renderTransfer({ open: false }));
Events.Subscribe("Container:Key", (payload) => {
  const key = String(payload?.key ?? "");
  handleContainerKey(key);
});
Events.Subscribe("Container:TransferKey", (payload) => {
  const key = String(payload?.key ?? "");
  if (key === "left") {
    transferState.selectedSide = "left";
    transferState.selectedIndex = 0;
    renderTransferFromState();
  } else if (key === "right") {
    transferState.selectedSide = "right";
    transferState.selectedIndex = 0;
    renderTransferFromState();
  } else if (key === "up") {
    const items = transferState.selectedSide === "left" ? transferState.leftItems : transferState.rightItems;
    transferState.selectedIndex = clamp(transferState.selectedIndex - 1, 0, Math.max(0, items.length - 1));
    renderTransferFromState();
  } else if (key === "down") {
    const items = transferState.selectedSide === "left" ? transferState.leftItems : transferState.rightItems;
    transferState.selectedIndex = clamp(transferState.selectedIndex + 1, 0, Math.max(0, items.length - 1));
    renderTransferFromState();
  } else if (key === "enter" || key === "action" || key === "take") {
    const items = transferState.selectedSide === "left" ? transferState.leftItems : transferState.rightItems;
    const item = items[transferState.selectedIndex];
    if (!item) return;
    const moveTo = transferState.selectedSide === "left" ? "right" : "left";
    Events.Call("Container:TransferMove", {
      side: moveTo,
      container_id: String(transferState?.container?.id ?? ""),
      item_id: String(item?.item_id ?? ""),
      instance_id: item?.instance_id ?? null,
      stack_key: item?.stack_key ?? null
    });
  } else if (key === "take_all") {
    const moveTo = transferState.selectedSide === "left" ? "right" : "left";
    Events.Call("Container:TransferTakeAll", {
      side: moveTo,
      container_id: String(transferState?.container?.id ?? "")
    });
  } else if (key === "close") {
    Events.Call("Container:TransferCloseRequest", {
      container_id: String(transferState?.container?.id ?? "")
    });
  }
});

  Events.Subscribe("HUD:SetHeading", function (deg) {
    setHeadingTarget(deg);
  });

function ensureUiFocus() {
  if (document.body) {
    document.body.tabIndex = -1;
    document.body.focus({ preventScroll: true });
  }
  if (window && window.focus) window.focus();
}

  /* ===================== */
  /* Init                  */
  /* ===================== */
  let uiInited = false;
  let adminInited = false;
  function ensureAdminConsoleReady() {
    if (adminInited) return;
    if (initAdminConsole()) {
      adminInited = true;
      return;
    }
    window.setTimeout(ensureAdminConsoleReady, 100);
  }
  function initHudUi() {
    if (uiInited) return;
    uiInited = true;
    const pruneDuplicateDom = () => {
      const ids = [
        "hudSvg",
        "hud_right_fnv",
        "fnv_dialog",
        "fnv_shop",
        "fnv_notify",
        "fnv_interact",
        "fnv_reticle",
        "fnv-admin-console",
        "fnv_repair_menu",
      ];
      ids.forEach((id) => {
        const els = document.querySelectorAll(`#${id}`);
        if (els.length <= 1) return;
        els.forEach((el, idx) => {
          if (idx === 0) return;
          el.remove();
        });
      });

    };
    pruneDuplicateDom();
    window.setInterval(pruneDuplicateDom, 500);
    ensureAdminConsoleReady();
    ensureUiFocus();
    window.addEventListener("mousedown", ensureUiFocus, true);
    ensureHudSvgReady();
      ensureInventorySvgReady();
      setHeadingTarget(0);
      window.addEventListener(
        "wheel",
        (event) => {
          if (event.ctrlKey) {
            event.preventDefault();
          }
        },
        { passive: false }
      );
      window.addEventListener("keydown", (event) => {
        if (!event.ctrlKey) return;
        const key = event.key;
        const code = event.code;
        const isPlus = key === "+" || key === "=" || code === "Equal" || code === "NumpadAdd";
        const isMinus = key === "-" || code === "Minus" || code === "NumpadSubtract";
        const isZero = key === "0" || code === "Digit0" || code === "Numpad0";
        if (isPlus || isMinus || isZero) {
          event.preventDefault();
        }
      });

      if (process.env.NODE_ENV === "development") {
      const ensureDebugState = () => {
        if (!lastHudState) {
          lastHudState = {
            hp: 100,
            hp_max: 100,
            ap: { now: 100, max: 100 },
            ammo: { now: 15, reserve: 532 },
            money: { caps: 0 },
            equip: { armor: true, weapon: true },
            cnd: { armor_pct: 100, weapon_pct: 100 },
            _debugHeading: 0,
          };
          setState(lastHudState);
        }
        return lastHudState;
      };

      const updateDevOverlay = (state) => {
        const el = document.getElementById("fnv_dev_keys_stats");
        if (!el || !state) return;
        const hp = Math.round(Number(state.hp ?? 0));
        const max = Math.round(Number(state.hp_max ?? 0));
        const yaw = Math.round(Number(state._debugHeading ?? 0));
        el.textContent = `HP: ${hp}/${max} | YAW: ${yaw}`;
      };

      const handleDevKey = (event) => {
        if (event.repeat) return;
        const target = event.target;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        const state = ensureDebugState();
        if (!hudSvgState.root && elHudLeftSvg()) {
          initHudSvg();
        }
        const key = event.key.toLowerCase();
        const code = event.code || "";
        const isH = key === "h" || code === "KeyH";
        const isY = key === "y" || code === "KeyY";
        const isR = key === "r" || code === "KeyR";
        const isT = key === "t" || code === "KeyT";
        if (isH) {
          const max = Number(state.hp_max ?? 100);
          const now = Math.max(0, Number(state.hp ?? 0) - 5);
          const next = { ...state, hp: now, hp_max: max };
          updateDevOverlay(next);
          setState(next);
        } else if (isY) {
          const max = Number(state.hp_max ?? 100);
          const now = Math.min(max, Number(state.hp ?? 0) + 5);
          const next = { ...state, hp: now, hp_max: max };
          updateDevOverlay(next);
          setState(next);
        } else if (isR) {
          const next = (Number(state._debugHeading ?? 0) + 15) % 360;
          state._debugHeading = next;
          updateDevOverlay(state);
          setHeadingTarget(next);
        } else if (isT) {
          const next = (Number(state._debugHeading ?? 0) - 15 + 360) % 360;
          state._debugHeading = next;
          updateDevOverlay(state);
          setHeadingTarget(next);
        }
      };

      document.addEventListener("keydown", handleDevKey, true);
      window.addEventListener("keydown", handleDevKey, true);
      updateDevOverlay(ensureDebugState());
    }

      window.setTimeout(() => {
        if (!stateReceived) {
          setState({
            hp: 100,
            hp_max: 100,
            ap: { now: 100, max: 100 },
            ammo: { now: 15, reserve: 532 },
            money: { caps: 0 },
            equip: { armor: true, weapon: true },
            cnd: { armor_pct: 100, weapon_pct: 100 },
          });
        }
      }, 50);


  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHudUi);
  } else {
    initHudUi();
  }



/* ===================== */
/* Dialogue + Shop Mode  */
/* ===================== */

const elDialog = () => document.getElementById("fnv_dialog");
const elDialogNpcName = () => document.getElementById("fnv_dialog_npcname");
const elDialogNpcLine = () => document.getElementById("fnv_dialog_npcline");
const elDialogOptions = () => document.getElementById("fnv_dialog_options");

const elShop = () => document.getElementById("fnv_shop");

let uiMode = "gameplay"; // "dialog" | "shop" | "gameplay"
let dialogState = null;  // last state from Dialog:Open

function safeArr(v){ return Array.isArray(v) ? v : []; }

let dialogMouseBound = false;
function bindDialogMouse(optsEl){
  if (!optsEl || dialogMouseBound) return;
  dialogMouseBound = true;

  optsEl.addEventListener("mousemove", (event) => {
    const row = event.target.closest(".fnv_dialog_option");
    if (!row || !dialogState || uiMode !== "dialog") return;
    const idx = Number(row.dataset.index);
    if (!Number.isFinite(idx)) return;
    const options = safeArr(dialogState.options);
    if (options[idx]?.disabled) return;
    if (dialogState.selected === idx) return;
    dialogState.selected = idx;
    renderDialog(dialogState);
  });

  optsEl.addEventListener("click", (event) => {
    const row = event.target.closest(".fnv_dialog_option");
    if (!row || !dialogState || uiMode !== "dialog") return;
    const idx = Number(row.dataset.index);
    if (!Number.isFinite(idx)) return;
    const options = safeArr(dialogState.options);
    if (options[idx]?.disabled) return;
    dialogState.selected = idx;
    sendChoose();
  });
}

  function setMode(payload){
  const mode = String(payload?.mode ?? "gameplay");
  uiMode = (mode === "dialog" || mode === "shop" || mode === "inventory") ? mode : "gameplay";

  // Show/hide dialog
  const dlg = elDialog();
  if (dlg) {
    if (uiMode === "dialog") {
      dlg.classList.remove("fnv_hidden");
      dlg.classList.add("fnv_dialog_open");
      dlg.setAttribute("aria-hidden", "false");
    } else {
      dlg.classList.add("fnv_hidden");
      dlg.classList.remove("fnv_dialog_open");
      dlg.setAttribute("aria-hidden", "true");
    }
  }

  // Show/hide shop
  const shop = elShop();
  if (shop) {
    if (uiMode === "shop") {
      shop.classList.remove("fnv_hidden");
      shop.setAttribute("aria-hidden", "false");
    } else {
      shop.classList.add("fnv_hidden");
      shop.setAttribute("aria-hidden", "true");
    }
  }

  // Hide/show gameplay HUD blocks
  const hudLeft = document.getElementById("hud_hp_fallout");
  const hudRight = document.getElementById("hud_right_fnv");
  const notifs = document.getElementById("fnv_notify");
  const prompt = document.getElementById("fnv_interact");
  const ret = document.getElementById("fnv_reticle");
  const inv = document.getElementById("fnv_inventory");

  const gameplayVisible = (uiMode === "gameplay");

  if (hudLeft) hudLeft.style.display = gameplayVisible ? "inline-block" : "none";
  if (hudRight) hudRight.style.display = gameplayVisible ? "block" : "none";
  if (notifs) notifs.style.display = "flex";
  if (inv) inv.classList.toggle("fnv_hidden", uiMode !== "inventory");
  if (uiMode !== "inventory" && repairMenuState.open) {
    closeRepairMenu();
  }

  if (!gameplayVisible) {
    interactShowState = false;
    interactVisible = false;
    if (prompt) prompt.classList.add("fnv_hidden");
    if (ret) ret.classList.add("fnv_hidden");
  } else {
    if (!interactShowState && prompt) prompt.classList.add("fnv_hidden");
    if (ret) ret.classList.add("fnv_hidden");
    updateReticleState();
  }

  if (gameplayVisible) {
    ensureUiFocus();
  }

}

function setHudVisible(payload){
  const visible = payload?.visible !== false;
  const hudLeft = document.getElementById("hud_hp_fallout");
  const hudRight = document.getElementById("hud_right_fnv");
  const notifs = document.getElementById("fnv_notify");
  const prompt = document.getElementById("fnv_interact");
  const ret = document.getElementById("fnv_reticle");
  const container = elContainer();

  if (hudLeft) hudLeft.style.display = visible ? "inline-block" : "none";
  if (hudRight) hudRight.style.display = visible ? "block" : "none";
  if (notifs) notifs.style.display = "flex";
  if (prompt) prompt.classList.toggle("fnv_hidden", !visible);
  if (ret) ret.classList.toggle("fnv_hidden", !visible);
  if (container) container.classList.toggle("fnv_hidden", !visible || !containerState?.open);
}

function updateReticleState(){
  const ret = elReticle();
  if (!ret) return;
  if (uiMode !== "gameplay") {
    ret.classList.add("fnv_hidden");
    return;
  }

  if (interactShowState) {
    ret.textContent = "[><]";
    ret.classList.remove("fnv_hidden");
    return;
  }

  const weaponEquipped = !!lastHudState?.equip?.weapon;
  const ammoNow = lastHudState?.ammo?.now;
  const hasAmmo = ammoNow == null ? true : Number(ammoNow) > 0;

  if (weaponEquipped && hasAmmo) {
    ret.textContent = "> <";
    ret.classList.remove("fnv_hidden");
  } else {
    ret.classList.add("fnv_hidden");
  }
}

  /* ===================== */
  /* Enemy Target HUD      */
  /* ===================== */
  function setEnemyTarget(payload){
    const enemyEl = elEnemy();
    if (!enemyEl) return;

    const visible = !!payload?.visible;
    enemyEl.classList.toggle("fnv_hidden", !visible);
    if (!visible) return;

    const nameEl = elEnemyName();
    const fillEl = elEnemyFill();
    if (nameEl) nameEl.textContent = String(payload?.name ?? "");

    const pct = clamp(Number(payload?.hp_pct ?? payload?.hp_percent ?? 0), 0, 100);
    if (fillEl) {
      fillEl.style.setProperty("--enemy-pct", `${pct}%`);
    }
  }

function normalizeSelected(state){
  const opts = safeArr(state?.options);
  if (opts.length === 0) return 0;

  let sel = Number(state?.selected ?? 0);
  if (!Number.isFinite(sel)) sel = 0;
  sel = Math.max(0, Math.min(opts.length - 1, sel));

  // si selected tombe sur disabled, choisir la plus proche option valide
  if (opts[sel]?.disabled) {
    // cherche vers le bas puis vers le haut
    for (let i = sel; i < opts.length; i++) if (!opts[i]?.disabled) return i;
    for (let i = sel; i >= 0; i--) if (!opts[i]?.disabled) return i;
  }
  return sel;
}

function renderDialog(state){
  dialogState = state || null;

  const dlg = elDialog();
  const nameEl = elDialogNpcName();
  const lineEl = elDialogNpcLine();
  const optsEl = elDialogOptions();
  if (!dlg || !nameEl || !lineEl || !optsEl) return;
  bindDialogMouse(optsEl);

  const open = !!state?.open;
  if (!open) {
    dlg.classList.add("fnv_hidden");
    dlg.setAttribute("aria-hidden", "true");
    dialogState = null;
    return;
  }

  if (uiMode !== "dialog") setMode({ mode: "dialog" });

  const npcName = String(state?.npc?.name ?? "");
  nameEl.textContent = npcName;

  const npcLine = state?.node?.text;
  if (npcLine == null || String(npcLine).trim() === "") {
    lineEl.textContent = "";
    lineEl.classList.add("fnv_hidden");
  } else {
    lineEl.textContent = String(npcLine);
    lineEl.classList.remove("fnv_hidden");
  }

  const options = safeArr(state?.options);
  const selected = normalizeSelected(state);
  dialogState.selected = selected;

  optsEl.innerHTML = "";

  if (options.length === 0) {
    const row = document.createElement("div");
    row.className = "fnv_dialog_option disabled";
    row.innerHTML = `<div class="fnv_dialog_marker"> </div><div>...</div>`;
    optsEl.appendChild(row);
    return;
  }

  options.forEach((opt, idx) => {
    const row = document.createElement("div");
    row.className = "fnv_dialog_option";
    row.dataset.index = String(idx);

    const used = !!opt?.used;
    const disabled = !!opt?.disabled;
    const close = !!opt?.close;
    const isShop = (
      opt?.action === "open_shop" ||
      !!opt?.open_shop ||
      opt?.open_shop === "true" ||
      opt?.open_shop === 1 ||
      opt?.open_shop === "1"
    );

    if (used) row.classList.add("used");
    if (disabled) row.classList.add("disabled");
    if (idx === selected) row.classList.add("selected");

    // marker chevron uniquement sur sélection
    const marker = document.createElement("div");
    marker.className = "fnv_dialog_marker";
    marker.textContent = (idx === selected) ? "▶" : "";

    const text = document.createElement("div");
    text.textContent = String(opt?.text ?? "");

    row.appendChild(marker);
    row.appendChild(text);
    if (close || isShop) {
      const action = document.createElement("div");
      action.className = "fnv_dialog_action";

      if (isShop) {
        const shopIcon = document.createElement("div");
        shopIcon.className = "fnv_dialog_shop";
        shopIcon.innerHTML = (
          "<svg class=\"fnv_dialog_action_icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\">" +
          "<circle cx=\"8\" cy=\"21\" r=\"1\"></circle>" +
          "<circle cx=\"19\" cy=\"21\" r=\"1\"></circle>" +
          "<path d=\"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12\"></path>" +
          "</svg>"
        );
        action.appendChild(shopIcon);
      }

      if (close) {
        const exit = document.createElement("div");
        exit.className = "fnv_dialog_exit";
        exit.innerHTML = (
          "<svg class=\"fnv_dialog_action_icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\">" +
          "<path d=\"m16 17 5-5-5-5\"></path>" +
          "<path d=\"M21 12H9\"></path>" +
          "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"></path>" +
          "</svg>"
        );
        action.appendChild(exit);
      }

      row.appendChild(action);
    }

    optsEl.appendChild(row);
  });
}

function moveSelection(dir){
  if (!dialogState) return;
  const options = safeArr(dialogState.options);
  if (options.length === 0) return;

  let i = Number(dialogState.selected ?? 0);
  if (!Number.isFinite(i)) i = 0;

  for (let step = 0; step < options.length; step++) {
    i = (i + dir + options.length) % options.length;
    if (!options[i]?.disabled) {
      dialogState.selected = i;
      renderDialog(dialogState);
      return;
    }
  }
}

function sendChoose(){
  if (!dialogState) return;
  const options = safeArr(dialogState.options);
  if (options.length === 0) return;

  const idx = Number(dialogState.selected ?? 0);
  const opt = options[idx];
  if (!opt || opt.disabled) return;

  Events.Call("Dialog:Choose", {
    npc_id: String(dialogState?.npc?.id ?? ""),
    node_id: String(dialogState?.node?.id ?? ""),
    option_id: String(opt?.id ?? "")
  });
}

function sendCloseRequest(){
  if (!dialogState) return;
  if (dialogState?.can_close === false) return;

  Events.Call("Dialog:CloseRequest", {
    npc_id: String(dialogState?.npc?.id ?? "")
  });
}

/* ===================== */
/* Shop Panel (FNV)      */
/* ===================== */

const elShopListPlayer = () => document.getElementById("fnv_shop_list_player");
const elShopListVendor = () => document.getElementById("fnv_shop_list_vendor");
const elShopVendorName = () => document.getElementById("fnv_shop_vendor_name");
const elShopCapsPlayer = () => document.getElementById("fnv_shop_caps_player");
const elShopCapsVendor = () => document.getElementById("fnv_shop_caps_vendor");
const elShopCurrencyLeft = () => document.getElementById("fnv_shop_currency_left");
const elShopCurrencyRight = () => document.getElementById("fnv_shop_currency_right");
const elShopItemName = () => document.getElementById("fnv_shop_item_name");
const elShopItemDesc = () => document.getElementById("fnv_shop_item_desc");
const elShopItemWg = () => document.getElementById("fnv_shop_item_wg");
const elShopItemVal = () => document.getElementById("fnv_shop_item_val");
const elShopItemCnd = () => document.getElementById("fnv_shop_item_cnd");
const elShopTotalBuy = () => document.getElementById("fnv_shop_total_buy");
const elShopTotalSell = () => document.getElementById("fnv_shop_total_sell");
const elShopTotalBuyLabel = () => document.getElementById("fnv_shop_total_buy_label");
const elShopTotalSellLabel = () => document.getElementById("fnv_shop_total_sell_label");
const elShopConfirm = () => document.getElementById("fnv_shop_confirm");
const elShopConfirmText = () => document.getElementById("fnv_shop_confirm_text");
const elShopQtyModal = () => document.getElementById("fnv_shop_qty");
const elShopQtyRange = () => document.getElementById("fnv_shop_qty_range");
const elShopQtyValue = () => document.getElementById("fnv_shop_qty_value");

function updateInventoryCondBar(item) {
  const barGroup = invSvgState.condBarGroup;
  const barEmpty = invSvgState.condBarEmpty;
  const barFull = invSvgState.condBarFull;
  const chevrons = invSvgState.condBarChevrons;
  if (!barGroup && !barEmpty && !barFull && !chevrons) return;

  const cnd = Number(item?.cnd ?? item?.condition);
  const max = Number(item?.max_cnd ?? item?.max_condition);
  const hasCnd = Number.isFinite(cnd) && Number.isFinite(max) && max > 0;

  setCondVisible(hasCnd, barGroup, barEmpty, barFull, chevrons);
  if (!hasCnd) {
    setCondCritical(barFull, false);
    return;
  }

  const pct = (cnd / max) * 100;
  setRectFillWidth(barFull, pct);
  setCondCritical(barFull, pct < 10);
}

let shopState = null;
let shopQtyState = null;
let shopQtyBound = false;
let shopConfirmTimer = null;
let shopLastTxKey = null;

function getShopCurrencyLabel(state){
  const cur = state?.currency ?? state?.money ?? "Caps";
  if (typeof cur === "string") return cur;
  return String(cur?.label ?? cur?.name ?? "Caps");
}

function getShopList(state, side){
  if (!state) return [];
  if (side === "player") {
    if (Array.isArray(state.player_inventory)) return state.player_inventory;
    if (Array.isArray(state.player_items)) return state.player_items;
    if (Array.isArray(state?.player?.items)) return state.player.items;
  }
  if (side === "vendor") {
    if (Array.isArray(state.vendor_inventory)) return state.vendor_inventory;
    if (Array.isArray(state.vendor_items)) return state.vendor_items;
    if (Array.isArray(state?.vendor?.items)) return state.vendor.items;
  }
  return [];
}

function getShopCaps(state, side){
  if (!state) return 0;
  const direct = side === "player" ? state.player_caps : state.vendor_caps;
  const nested = side === "player" ? state?.player?.caps : state?.vendor?.caps;
  return Math.floor(Number(direct ?? nested ?? 0));
}

function getItemQty(item){
  const q = item?.qty ?? item?.count ?? item?.stack ?? item?.amount;
  if (q == null) return null;
  const n = Math.floor(Number(q));
  return Number.isFinite(n) ? n : null;
}

function filterShopList(list){
  if (!Array.isArray(list)) return [];
  return list.filter((item) => {
    const qty = getItemQty(item);
    return qty == null || qty > 0;
  });
}

function getItemValue(item){
  const v = item?.unit_price ?? item?.price ?? item?.base_value ?? item?.value ?? item?.val;
  if (v == null) return null;
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? n : null;
}

function getSelectedQty(item){
  const q = item?.selected_qty ?? item?.selectedQty ?? item?.selected;
  if (q == null) return 0;
  const n = Math.max(0, Math.floor(Number(q)));
  return Number.isFinite(n) ? n : 0;
}

function getItemWeight(item){
  const w = item?.weight ?? item?.wg;
  if (w == null) return null;
  const n = Number(w);
  return Number.isFinite(n) ? n : null;
}

function getItemCnd(item){
  const c = item?.cnd ?? item?.condition;
  if (c == null) return null;
  const n = Number(c);
  return Number.isFinite(n) ? n : null;
}

function getPlayerInventoryQty(state, itemId){
  const list = getShopList(state, "player");
  const id = String(itemId ?? "");
  if (!id) return 0;
  const entry = list.find((it) => String(it?.item_id ?? it?.id ?? "") === id);
  const qty = entry ? getItemQty(entry) : 0;
  return qty == null ? 0 : qty;
}

function getShopTotals(state){
  const totals = state?.totals ?? {};
  const buy = totals?.buy ?? totals?.purchase ?? totals?.left;
  const sell = totals?.sell ?? totals?.right ?? totals?.gain;

  const cartBuy = Array.isArray(state?.cart_buy) ? state.cart_buy : [];
  const cartSell = Array.isArray(state?.cart_sell) ? state.cart_sell : [];

  const sumCart = (list) => list.reduce((acc, row) => {
    const qty = Number(row?.qty ?? row?.amount ?? row?.count ?? 0);
    const price = Number(row?.unit_price ?? row?.price ?? row?.value ?? 0);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return acc;
    return acc + Math.max(0, qty) * Math.max(0, price);
  }, 0);

  const buyTotal = Number.isFinite(Number(buy)) ? Math.floor(Number(buy)) : sumCart(cartBuy);
  const sellTotal = Number.isFinite(Number(sell)) ? Math.floor(Number(sell)) : sumCart(cartSell);
  return { buyTotal, sellTotal };
}

function formatItemName(item){
  const name = String(item?.name ?? "");
  const qty = getItemQty(item);
  if (qty != null) return `${name} (${qty})`;
  return name;
}

function normalizeShopSelected(state, lists){
  const preferredSide = state?.selected?.side === "vendor" ? "vendor" : "player";
  let side = preferredSide;
  let list = lists ? (side === "player" ? lists.player : lists.vendor) : getShopList(state, side);
  let idx = Number(state?.selected?.index ?? 0);
  if (!Number.isFinite(idx)) idx = 0;

  if (list.length === 0) {
    side = (side === "player") ? "vendor" : "player";
    list = lists ? (side === "player" ? lists.player : lists.vendor) : getShopList(state, side);
    idx = 0;
  }

  idx = Math.max(0, Math.min(list.length - 1, idx));
  return { side, index: idx };
}

function getCartListForSide(state, side){
  if (!state) return [];
  if (side === "vendor") return Array.isArray(state.cart_buy) ? state.cart_buy : [];
  if (side === "player") return Array.isArray(state.cart_sell) ? state.cart_sell : [];
  return [];
}

function getCartQty(state, side, item){
  const list = getCartListForSide(state, side);
  if (!list || list.length === 0) return 0;
  const id = String(item?.item_id ?? item?.id ?? "");
  if (!id) return 0;
  const entry = list.find((row) => String(row?.item_id ?? row?.id ?? "") === id);
  const qty = entry?.qty ?? entry?.amount ?? entry?.count;
  if (qty == null) return 0;
  const n = Math.max(0, Math.floor(Number(qty)));
  return Number.isFinite(n) ? n : 0;
}

function renderShopList(side, listEl, items, selected){
  if (!listEl) return;
  listEl.innerHTML = "";

  if (!items || items.length === 0) {
    const row = document.createElement("div");
    row.className = "fnv_shop_row disabled";
    row.textContent = "...";
    listEl.appendChild(row);
    return;
  }

  items.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "fnv_shop_row";
    row.dataset.side = side;
    row.dataset.index = String(idx);

    const selectedQty = getCartQty(shopState, side, item) || getSelectedQty(item);

    if (item?.used) row.classList.add("used");
    if (item?.disabled) row.classList.add("disabled");
    if (selected?.side === side && selected?.index === idx) row.classList.add("selected");
    if (selectedQty > 0) row.classList.add("picked");

    const marker = document.createElement("div");
    marker.className = "fnv_shop_row_mark";
    marker.textContent = (selected?.side === side && selected?.index === idx) ? "▶" : "";

    const name = document.createElement("div");
    name.className = "fnv_shop_row_name";
    name.textContent = formatItemName(item);

    const sel = document.createElement("div");
    sel.className = "fnv_shop_row_selqty";
    sel.textContent = selectedQty > 0 ? `x${selectedQty}` : "";

    const val = document.createElement("div");
    val.className = "fnv_shop_row_val";
    const v = getItemValue(item);
    val.textContent = v == null ? "" : String(v);

    row.appendChild(marker);
    row.appendChild(name);
    row.appendChild(sel);
    row.appendChild(val);

    row.addEventListener("mouseenter", () => {
      if (!shopState || uiMode !== "shop") return;
      if (item?.disabled) return;
      shopState.selected = { side, index: idx };
      renderShop(shopState);
    });

    const sendSelect = (action, amount) => {
      Events.Call("Shop:Select", {
        side,
        item_id: String(item?.id ?? item?.item_id ?? ""),
        action,
        amount,
        index: idx
      });
    };

    row.addEventListener("mousedown", (e) => {
      if (!shopState || uiMode !== "shop") return;
      if (item?.disabled) return;

      shopState.selected = { side, index: idx };
      renderShop(shopState);

      if (e.button === 0 && !e.shiftKey && !e.altKey) {
        const maxQty = getItemQty(item) ?? 0;
        const canStack = !!item?.stackable || maxQty > 1;
        if (canStack && maxQty > 1) {
          openShopQtyModal(side, item);
          e.preventDefault();
          return;
        }
      }

      if (e.button === 2) {
        sendSelect("remove", 1);
        e.preventDefault();
        return;
      }

      if (e.shiftKey) {
        sendSelect("add", 1);
        e.preventDefault();
        return;
      }

      if (e.altKey) {
        sendSelect("remove", 1);
        e.preventDefault();
        return;
      }

      sendSelect("toggle");
    });

    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    row.addEventListener("wheel", (e) => {
      if (!shopState || uiMode !== "shop") return;
      if (item?.disabled) return;
      const dir = e.deltaY < 0 ? "add" : "remove";
      const amount = e.shiftKey ? 5 : 1;
      sendSelect(dir, amount);
      e.preventDefault();
    }, { passive: false });

    listEl.appendChild(row);
  });
}

function bindShopQtyModal(){
  if (shopQtyBound) return;
  const modal = elShopQtyModal();
  const range = elShopQtyRange();
  if (!modal || !range) return;
  shopQtyBound = true;

  range.addEventListener("input", () => {
    if (!shopQtyState) return;
    const v = Math.max(0, Math.floor(Number(range.value)));
    shopQtyState.target = v;
    updateShopQtyValue();
  });

  modal.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn || !shopQtyState) return;
    const action = btn.getAttribute("data-action");
    if (action === "min") {
      shopQtyState.target = 0;
    } else if (action === "down") {
      shopQtyState.target = Math.max(0, shopQtyState.target - 1);
    } else if (action === "up") {
      shopQtyState.target = Math.min(shopQtyState.max, shopQtyState.target + 1);
    } else if (action === "max") {
      shopQtyState.target = shopQtyState.max;
    } else if (action === "cancel") {
      closeShopQtyModal();
      return;
    } else if (action === "confirm") {
      applyShopQtyModal();
      return;
    }
    updateShopQtyValue();
  });
}

function updateShopQtyValue(){
  const range = elShopQtyRange();
  const value = elShopQtyValue();
  if (!shopQtyState || !range || !value) return;
  const t = Math.max(0, Math.min(shopQtyState.max, shopQtyState.target));
  range.value = String(t);
  value.textContent = `${t}/${shopQtyState.max}`;
}

function openShopQtyModal(side, item){
  const modal = elShopQtyModal();
  const range = elShopQtyRange();
  if (!modal || !range || !shopState) return;

  bindShopQtyModal();

  const maxQty = getItemQty(item) ?? 0;
  const current = getCartQty(shopState, side, item) || 0;
  const target = Math.min(maxQty, Math.max(0, current > 0 ? current : 1));

  shopQtyState = {
    open: true,
    side,
    item_id: String(item?.item_id ?? item?.id ?? ""),
    max: maxQty,
    current,
    target
  };

  range.min = "0";
  range.max = String(maxQty);
  updateShopQtyValue();
  modal.classList.remove("fnv_hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeShopQtyModal(){
  const modal = elShopQtyModal();
  if (modal) {
    modal.classList.add("fnv_hidden");
    modal.setAttribute("aria-hidden", "true");
  }
  shopQtyState = null;
}

function applyShopQtyModal(){
  if (!shopQtyState) return;
  const delta = shopQtyState.target - shopQtyState.current;
  if (delta > 0) {
    Events.Call("Shop:Select", {
      side: shopQtyState.side,
      item_id: shopQtyState.item_id,
      action: "add",
      amount: delta
    });
  } else if (delta < 0) {
    Events.Call("Shop:Select", {
      side: shopQtyState.side,
      item_id: shopQtyState.item_id,
      action: "remove",
      amount: Math.abs(delta)
    });
  }
  closeShopQtyModal();
}

function renderShop(state){
  shopState = state || null;
  const shop = elShop();
  if (!shop) return;

  const open = !!state?.open;
  if (!open) {
    shop.classList.add("fnv_hidden");
    shop.setAttribute("aria-hidden", "true");
    shopState = null;
    closeShopQtyModal();
    shopLastTxKey = null;
    return;
  }

  if (uiMode !== "shop") setMode({ mode: "shop" });

  const currency = getShopCurrencyLabel(state).toUpperCase();
  const vendorName = String(state?.vendor?.name ?? state?.vendor_name ?? "VENDOR");

  const currencyLeft = elShopCurrencyLeft();
  const currencyRight = elShopCurrencyRight();
  const capsPlayer = elShopCapsPlayer();
  const capsVendor = elShopCapsVendor();
  const vendorNameEl = elShopVendorName();

  if (currencyLeft) currencyLeft.textContent = currency;
  if (currencyRight) currencyRight.textContent = currency;
  if (capsPlayer) capsPlayer.textContent = String(getShopCaps(state, "player"));
  if (capsVendor) capsVendor.textContent = String(getShopCaps(state, "vendor"));
  if (vendorNameEl) vendorNameEl.textContent = vendorName.toUpperCase();
  const totalBuyEl = elShopTotalBuy();
  const totalSellEl = elShopTotalSell();
  const totalBuyLabel = elShopTotalBuyLabel();
  const totalSellLabel = elShopTotalSellLabel();
  const totals = getShopTotals(state);

  if (totalBuyEl) totalBuyEl.textContent = String(totals.buyTotal);
  if (totalSellEl) totalSellEl.textContent = String(totals.sellTotal);
  if (totalBuyLabel) totalBuyLabel.textContent = currency;
  if (totalSellLabel) totalSellLabel.textContent = currency;

  const playerItems = filterShopList(getShopList(state, "player"));
  const vendorItems = filterShopList(getShopList(state, "vendor"));
  const selected = normalizeShopSelected(state, { player: playerItems, vendor: vendorItems });
  shopState.selected = selected;

  renderShopList("player", elShopListPlayer(), playerItems, selected);
  renderShopList("vendor", elShopListVendor(), vendorItems, selected);

  showShopConfirmFromTx(state);

  if (shopQtyState?.open) {
    const list = shopQtyState.side === "player" ? playerItems : vendorItems;
    const item = list.find((it) => String(it?.item_id ?? it?.id ?? "") === shopQtyState.item_id);
    if (!item) {
      closeShopQtyModal();
    } else {
      shopQtyState.max = getItemQty(item) ?? 0;
      shopQtyState.current = getCartQty(shopState, shopQtyState.side, item) || 0;
      if (shopQtyState.target > shopQtyState.max) {
        shopQtyState.target = shopQtyState.max;
      }
      updateShopQtyValue();
    }
  }

  const item = (selected.side === "player" ? playerItems : vendorItems)[selected.index];
  if (item) {
    const nameEl = elShopItemName();
    const descEl = elShopItemDesc();
    const wgEl = elShopItemWg();
    const valEl = elShopItemVal();
    const cndEl = elShopItemCnd();
    const iconEl = document.querySelector(".fnv_shop_item_icon");

    if (nameEl) nameEl.textContent = formatItemName(item) || "-";
    if (descEl) descEl.textContent = String(item?.desc ?? item?.description ?? "");

    const wg = getItemWeight(item);
    const val = getItemValue(item);
    const cnd = getItemCnd(item);

    if (wgEl) wgEl.textContent = wg == null ? "--" : wg.toFixed(2);
    if (valEl) valEl.textContent = val == null ? "--" : String(val);
    if (cndEl) cndEl.textContent = cnd == null ? "--" : String(Math.round(cnd));

    if (iconEl) {
      const icon = String(item?.icon ?? "");
      if (icon) {
        iconEl.innerHTML = `<img src="${icon}" alt="">`;
      } else {
        iconEl.innerHTML = "";
      }
    }
  } else {
    const nameEl = elShopItemName();
    const descEl = elShopItemDesc();
    const wgEl = elShopItemWg();
    const valEl = elShopItemVal();
    const cndEl = elShopItemCnd();
    const iconEl = document.querySelector(".fnv_shop_item_icon");

    if (nameEl) nameEl.textContent = "-";
    if (descEl) descEl.textContent = "";
    if (wgEl) wgEl.textContent = "--";
    if (valEl) valEl.textContent = "--";
    if (cndEl) cndEl.textContent = "--";
    if (iconEl) iconEl.innerHTML = "";
  }
}

/* ===================== */
/* Inventory SVG         */
/* ===================== */
function getWeaponCategory(categories){
  const preferred = ["weapons", "weapon", "armes", "armement"];
  if (!Array.isArray(categories)) return null;
  return preferred.find((key) => categories.includes(key)) || categories[0] || null;
}

function toWeapon(item, state, index){
  const idRaw = item?.id ?? item?.item_id ?? item?.instance_id ?? index;
  const id = String(idRaw ?? index);
  const name = String(item?.name ?? item?.item_id ?? "—");
  const ammoText = String(item?.ammoText ?? item?.ammo_text ?? item?.ammo ?? "—");
  const equippedId = state?.equipped?.weapon_instance_id;
  const equipped = !!item?.equipped || (item?.instance_id != null && item.instance_id === equippedId);
    const iconUrl = item?.iconUrl ?? item?.item_icon ?? item?.icon_url ?? item?.icon ?? "";
    const effectsRaw = item?.effects ?? item?.effects_text ?? item?.effect;
    const effects = Array.isArray(effectsRaw)
      ? effectsRaw.map((e) => String(e))
      : String(effectsRaw ?? "").split("\n").filter(Boolean);
    const uniqueId = `${id || "item"}:${item?.instance_id ?? item?.stack_key ?? index ?? 0}`;
    return {
      id: uniqueId,
      name,
      ammoText,
      equipped,
      iconUrl,
      dps: item?.dps ?? item?.damage_per_second,
      vw: item?.vw ?? item?.value_over_weight,
      cnd: item?.cnd ?? item?.condition,
      max_cnd: item?.max_cnd ?? item?.max_condition,
      dt: item?.dt ?? item?.damage_threshold,
      dr: item?.dr ?? item?.damage_resistance,
      deg: item?.deg ?? item?.damage,
      str: item?.str ?? item?.strength,
      other: item?.other ?? item?.ammo_type ?? item?.ammoType,
      ammoMag: item?.ammo_mag ?? item?.mag_size,
      ammoReserve: item?.ammo_reserve ?? item?.ammo_stock,
      weight: item?.weight ?? item?.wg,
      value: item?.value ?? item?.val,
      description: item?.desc ?? item?.description,
      effects
    };
  }

  function updateInventoryRowPositions(){
    if (!invSvgState.rowHeight) return;
    let y = -invSvgState.scrollOffset;
    invSvgState.rows.forEach((row) => {
      const translate = `translate(0 ${y.toFixed(SVG_ATTR_PRECISION)})`;
      const base = invSvgState.rowBaseTransform;
      row.root.setAttribute("transform", base ? `${base} ${translate}` : translate);
      y += row.rowHeight ?? invSvgState.rowHeight;
    });
  }

  function updateInventoryScrollBounds(){
    const frameHeight = parseFloat(invSvgState.itemFrame?.getAttribute("height") || "0");
    if (!frameHeight || !invSvgState.rows.length) {
      invSvgState.scrollMax = 0;
      invSvgState.scrollOffset = 0;
      return;
    }
    const totalHeight = invSvgState.rows.reduce(
      (sum, row) => sum + (row.rowHeight ?? invSvgState.rowHeight ?? 0),
      0
    );
    invSvgState.scrollMax = Math.max(0, totalHeight - frameHeight);
    invSvgState.scrollOffset = clamp(invSvgState.scrollOffset, 0, invSvgState.scrollMax);
  }

function updateInventoryRowStates(){
  invSvgState.rows.forEach((row) => {
    const hovered = row.weaponId && row.weaponId === invSvgState.hoverId;
    if (row.hoveredEl) row.hoveredEl.style.opacity = hovered ? "1" : "0";
  });
}

  function setInventoryRowName(row, text){
    if (!row?.nameEl || !row?.hoveredEl) return;
    const nameEl = row.nameEl;
    const box = row.hoveredEl.getBBox?.();
  if (!box || !Number.isFinite(box.width)) {
    nameEl.textContent = text ?? "";
    return;
  }

  const measureWidth = () => {
    const bb = nameEl.getBBox?.();
    if (bb && Number.isFinite(bb.width)) return bb.width;
    return 0;
  };

  const raw = String(text ?? "");
  const tspans = Array.from(nameEl.children).filter((el) => el.tagName === "tspan");
  if (!tspans.length) {
    nameEl.textContent = raw;
    return;
  }

  if (!raw) return;

    const clipWidth = invSvgState.itemNameClipWidth;
    const scaleX = invSvgState.itemNameScaleX || 1;
    const maxWidth = Math.max(0, clipWidth ? (clipWidth / scaleX) : box.width);

    tspans.forEach((tspan) => { tspan.textContent = ""; });
    tspans[0].textContent = raw;
    if (tspans[1]) tspans[1].textContent = "";
    const fullLen = measureWidth();
    let isTwoLines = false;
    if (fullLen > maxWidth && tspans[1]) {
      const words = raw.split(/\s+/).filter(Boolean);
      let line1 = "";
      let line2 = "";
      for (let i = 0; i < words.length; i += 1) {
        const candidate = line1 ? `${line1} ${words[i]}` : words[i];
        tspans[0].textContent = candidate;
        tspans[1].textContent = "";
        if (measureWidth() <= maxWidth) {
          line1 = candidate;
          continue;
        }
        line2 = words.slice(i).join(" ");
        break;
      }
      if (!line1) {
        line1 = raw;
        line2 = "";
      }
      tspans[0].textContent = line1;
      tspans[1].textContent = line2;
      isTwoLines = !!line2;
    }

    if (invSvgState.rowHoverBaseHeight && invSvgState.rowHoverSingleHeight && row.hoveredEl) {
      const nextHeight = isTwoLines ? invSvgState.rowHoverBaseHeight : invSvgState.rowHoverSingleHeight;
      row.hoveredEl.setAttribute("height", String(nextHeight));
    }
    if (invSvgState.rowGap != null) {
      const baseHeight = isTwoLines ? invSvgState.rowHoverBaseHeight : invSvgState.rowHoverSingleHeight;
      row.rowHeight = baseHeight + invSvgState.rowGap;
      updateInventoryRowPositions();
      updateInventoryScrollBounds();
    }
  }

  function updateInventoryDetail(weapon){
    if (!weapon) {
      setSvgText(invSvgState.ammoText, "");
      setSvgText(invSvgState.dpsText, "");
      setSvgText(invSvgState.vwText, "");
      setSvgText(invSvgState.weightText, "");
      setSvgText(invSvgState.valText, "");
      setSvgText(invSvgState.strText, "");
      setSvgText(invSvgState.degText, "");
      setSvgText(invSvgState.otherText, "");
      setSvgFlowText(invSvgState.effectsText, "");
      setSvgImageHref(invSvgState.iconImage, "");
      updateInventoryCondBar(null);
      return;
    }

  setSvgText(invSvgState.ammoText, weapon.ammoText ?? "—");
  setSvgText(invSvgState.dpsText, weapon.dps ?? "—");
  setSvgText(invSvgState.vwText, weapon.vw ?? "—");
  setSvgText(invSvgState.weightText, weapon.weight ?? "—");
  setSvgText(invSvgState.valText, weapon.value ?? "—");
  setSvgText(invSvgState.strText, weapon.str ?? "—");
  const showArmor = invUiState.subPage === "ARMURE";
  const degValue = showArmor ? (weapon.dt ?? "—") : (weapon.deg ?? "—");
  setSvgText(invSvgState.degText, degValue);
  const mag = Number(weapon.ammoMag);
  const reserve = Number(weapon.ammoReserve);
  const hasAmmoCounts = Number.isFinite(mag) && Number.isFinite(reserve);
  const ammoLine = weapon.ammoText ?? "";
  const ammoSuffix = hasAmmoCounts
    ? ` (${Math.floor(mag)}/${Math.floor(reserve)})`
    : (ammoLine && ammoLine !== "—" ? ` (${ammoLine})` : "");
  const otherText = weapon.other ? `${weapon.other}${ammoSuffix}` : "";
  setSvgText(invSvgState.otherText, otherText);

    if (Array.isArray(weapon.effects) && weapon.effects.length > 0) {
      setSvgFlowText(invSvgState.effectsText, weapon.effects);
    } else {
      setSvgFlowText(invSvgState.effectsText, "");
    }

    setSvgImageHref(invSvgState.iconImage, weapon.iconUrl || "");
    updateInventoryCondBar(weapon);
  }

function updateInventoryTopStats(state){
  const pdsState = state?.player_stats?.pds;
  const cur = pdsState?.current ?? state?.carry_weight?.current ?? state?.pds?.current ?? state?.pds;
  const max = pdsState?.max ?? state?.carry_weight?.max ?? state?.pds?.max;
  const fmtInt = (val) => Math.round(Number(val));
  const pds = (cur != null && max != null)
    ? `${fmtInt(cur)}/${fmtInt(max)}`
    : (cur != null ? fmtInt(cur) : "--");
  setSvgText(invSvgState.pdsText, pds);

  const hpState = state?.player_stats?.hp ?? state?.hp;
  const hpCur = hpState?.current ?? state?.hp ?? state?.hp_current;
  const hpMax = hpState?.max ?? state?.hp_max;
  const hpText = (hpCur != null && hpMax != null)
    ? `${Math.round(Number(hpCur))}/${Math.round(Number(hpMax))}`
    : (hpCur != null ? Math.round(Number(hpCur)) : "--");
  setSvgText(invSvgState.hpText, hpText);

  const dt = state?.player_stats?.dt ?? state?.dt ?? state?.stats?.dt ?? state?.resistance?.dt;
  setSvgText(invSvgState.dtText, dt ?? "--");

  const caps = state?.money?.caps ?? state?.caps ?? 0;
  setSvgText(invSvgState.capsText, Math.floor(Number(caps)));
}

function renderInventorySvg(state){
  if (!invSvgState.rowTemplate || !invSvgState.itemScroll) {
    updateInventoryTopStats(state);
    return;
  }

  const categories = getInvCategories(state);
  const preferredCat = getWeaponCategory(categories);
  if (!invState.category || !categories.includes(invState.category)) {
    invState.category = preferredCat;
  }

  const selection = normalizeInvSelection(state);
  invState.category = selection.category;
  invState.index = selection.index;

  invUiState.open = true;
  invUiState.category = "OBJETS";
  invUiState.subPage = selection.category
    ? (invSubPageByCategory[String(selection.category).toLowerCase()] || "ARMES")
    : "ARMES";
  if (invSvgState.root) {
    invSvgState.root.dataset.category = invUiState.category;
    invSvgState.root.dataset.subpage = invUiState.subPage;
  }
  applyInventorySubPageVisibility();

  const weapons = selection.items.map((item, idx) => toWeapon(item, state, idx));
  invSvgState.weapons = weapons;

  const listKey = weapons.map((w) => w.id).join("|");
  const needsRebuild = listKey !== invSvgState.listKey || invSvgState.rows.length !== weapons.length;

  if (needsRebuild) {
    invSvgState.rows.forEach((row) => row.root.remove());
    invSvgState.rows = [];
    invSvgState.scrollOffset = 0;
    invSvgState.hoverId = null;

    weapons.forEach((weapon, idx) => {
      const clone = invSvgState.rowTemplate.cloneNode(true);
      const prefix = invSvgState.prefix ? `${invSvgState.prefix}__` : "";
      const nameEl = clone.querySelector(`#${prefix}item_name`);
      const hoveredEl = clone.querySelector(`#${prefix}hovered_box`);
      const notEqEl = clone.querySelector(`#${prefix}rect35`);
      const eqEl = clone.querySelector(`#${prefix}equipped`);

      if (nameEl) {
        nameEl.classList.add("inv_item_name");
        if (invSvgState.itemNameClipId) {
          nameEl.setAttribute("clip-path", `url(#${invSvgState.itemNameClipId})`);
        }
      }
      if (hoveredEl) hoveredEl.style.opacity = "0";
      if (eqEl) eqEl.style.opacity = weapon.equipped ? "1" : "0";
      if (notEqEl) notEqEl.style.opacity = weapon.equipped ? "0" : "1";

      stripSvgIds(clone);
      clone.style.display = "";
      clone.removeAttribute("display");
      clone.style.pointerEvents = "auto";

      clone.addEventListener("mouseenter", () => {
        invSvgState.hoverId = weapon.id;
        updateInventoryRowStates();
      });
      clone.addEventListener("mouseleave", () => {
        if (invSvgState.hoverId === weapon.id) invSvgState.hoverId = null;
        updateInventoryRowStates();
      });
      clone.addEventListener("click", () => {
        invState.index = idx;
        invSvgState.selectedId = weapon.id;
        updateInventoryDetail(invSvgState.weapons[idx]);
        updateInventoryRowStates();
      });

      invSvgState.itemScroll.appendChild(clone);
      setInventoryRowName({ nameEl, hoveredEl }, weapon.name);
        invSvgState.rows.push({
          root: clone,
          nameEl,
          hoveredEl,
          notEqEl,
          eqEl,
          weaponId: weapon.id,
          rowHeight: invSvgState.rowHeight
        });
      });
    } else {
      weapons.forEach((weapon, idx) => {
        const row = invSvgState.rows[idx];
      if (!row) return;
      setInventoryRowName(row, weapon.name);
      if (row.eqEl) row.eqEl.style.opacity = weapon.equipped ? "1" : "0";
      if (row.notEqEl) row.notEqEl.style.opacity = weapon.equipped ? "0" : "1";
    });
  }

  invSvgState.listKey = listKey;
  if (invState.index < 0) invState.index = 0;
  if (invState.index > weapons.length - 1) invState.index = Math.max(0, weapons.length - 1);

    updateInventoryScrollBounds();

  updateInventoryRowPositions();
  updateInventoryRowStates();

  const selected = weapons[invState.index];
  invSvgState.selectedId = selected?.id ?? null;
  updateInventoryDetail(selected);
  updateInventoryTopStats(state);
}

function bindInventorySvgInteractions(){
  if (invSvgState.bound) return;
  invSvgState.bound = true;
  const target = invSvgState.itemScroll || invSvgState.svg;
  if (!target) return;
  const tabPairs = [
    ["armes_statut_box", "armes_hovered", "armes_selected_box", "weapons"],
    ["armure_statut_box", "armure_hovered", "armure_selected_box", "apparel"],
    ["soins_statut_box", "soins_hovered", "soins_selected_box", "aid"],
    ["divers_statut_box", "divers_hovered", "divers_selected_box", "misc"],
    ["munitions_statut_box", "munitions_hovered", "munitions_selected_box", "ammo"]
  ];
  const isVisible = (el) => {
    if (!el) return false;
    if (el.style?.display === "none") return false;
    if (el.getAttribute?.("display") === "none") return false;
    const opacityAttr = el.getAttribute?.("opacity");
    if (opacityAttr != null && Number(opacityAttr) <= 0) return false;
    if (el.style?.opacity && Number(el.style.opacity) <= 0) return false;
    return true;
  };
  tabPairs.forEach(([boxId, hoveredId, selectedId, category]) => {
    const box = queryInvId(boxId);
    const hovered = queryInvId(hoveredId);
    const selected = queryInvId(selectedId);
    if (!box || !hovered) return;
    hovered.style.opacity = "0";
    box.style.pointerEvents = "auto";
    box.addEventListener("mouseenter", () => {
      hovered.style.opacity = isVisible(selected) ? "0" : "1";
    });
    box.addEventListener("mouseleave", () => {
      hovered.style.opacity = "0";
    });
    box.addEventListener("click", () => {
      if (!invState?.data) return;
      invState.category = category;
      invState.index = 0;
      renderInventory(invState.data);
    });
  });
  target.addEventListener("wheel", (e) => {
    if (!invSvgState.rowHeight || invSvgState.scrollMax <= 0) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    invSvgState.scrollOffset = clamp(
      invSvgState.scrollOffset + (dir * invSvgState.rowHeight),
      0,
      invSvgState.scrollMax
    );
    updateInventoryRowPositions();
    e.preventDefault();
  }, { passive: false });
}

function showShopConfirmFromTx(state){
  const confirmEl = elShopConfirm();
  const textEl = elShopConfirmText();
  if (!confirmEl || !textEl) return;

  const tx = state?.last_tx;
  if (!tx || tx.ok !== true) return;
  const txKey = JSON.stringify({ buy: tx.cart_buy || [], sell: tx.cart_sell || [] });
  if (shopLastTxKey === txKey) return;
  shopLastTxKey = txKey;

  let message = "";
  const buyList = Array.isArray(tx.cart_buy) ? tx.cart_buy : [];
  const sellList = Array.isArray(tx.cart_sell) ? tx.cart_sell : [];

  const sumList = (list) => list.reduce((acc, row) => {
    const qty = Math.max(0, Math.floor(Number(row?.qty ?? 0)));
    const price = Math.max(0, Number(row?.unit_price ?? 0));
    return { qty: acc.qty + qty, total: acc.total + (qty * price) };
  }, { qty: 0, total: 0 });

  if (buyList.length > 0) {
    const totals = sumList(buyList);
    const name = buyList.length == 1 ? String(buyList[0]?.name ?? buyList[0]?.item_id ?? "").toUpperCase() : "OBJETS";
    message = `(${totals.qty}) ${name} ACHET? POUR ${totals.total} CAPS`;
  } else if (sellList.length > 0) {
    const totals = sumList(sellList);
    const name = sellList.length == 1 ? String(sellList[0]?.name ?? sellList[0]?.item_id ?? "").toUpperCase() : "OBJETS";
    message = `(${totals.qty}) ${name} VENDU POUR ${totals.total} CAPS`;
  } else {
    return;
  }

  textEl.textContent = message;
  confirmEl.classList.remove("fnv_hidden");

  if (shopConfirmTimer) window.clearTimeout(shopConfirmTimer);
  shopConfirmTimer = window.setTimeout(() => {
    confirmEl.classList.add("fnv_hidden");
  }, 9000);
}

function moveShopSelection(dir){
  if (!shopState) return;
  const lists = {
    player: filterShopList(getShopList(shopState, "player")),
    vendor: filterShopList(getShopList(shopState, "vendor"))
  };
  const selected = normalizeShopSelected(shopState, lists);
  const items = selected.side === "player" ? lists.player : lists.vendor;
  if (items.length === 0) return;

  let idx = selected.index;
  for (let step = 0; step < items.length; step++) {
    idx = (idx + dir + items.length) % items.length;
    if (!items[idx]?.disabled) {
      shopState.selected = { side: selected.side, index: idx };
      renderShop(shopState);
      return;
    }
  }
}

function switchShopSide(dir){
  if (!shopState) return;
  const lists = {
    player: filterShopList(getShopList(shopState, "player")),
    vendor: filterShopList(getShopList(shopState, "vendor"))
  };
  const selected = normalizeShopSelected(shopState, lists);
  const nextSide = dir > 0 ? "vendor" : "player";
  const items = nextSide === "player" ? lists.player : lists.vendor;
  if (items.length === 0) return;

  shopState.selected = { side: nextSide, index: 0 };
  renderShop(shopState);
}

function sendShopAccept(){
  if (!shopState) return;

  const cartBuy = Array.isArray(shopState?.cart_buy) ? shopState.cart_buy : [];
  const cartSell = Array.isArray(shopState?.cart_sell) ? shopState.cart_sell : [];

  const mapCart = (list) => list.map((row) => {
    const qty = Number(row?.qty ?? row?.amount ?? row?.count ?? 0);
    const payload = {
      item_id: String(row?.item_id ?? row?.id ?? ""),
      qty: Math.max(0, Math.floor(Number.isFinite(qty) ? qty : 0))
    };
    const cnd = row?.cnd ?? row?.condition;
    if (cnd != null && Number.isFinite(Number(cnd))) {
      payload.cnd = Math.round(Number(cnd));
    }
    return payload;
  }).filter((row) => row.item_id && row.qty > 0);

  Events.Call("Shop:Accept", {
    cart_buy: mapCart(cartBuy),
    cart_sell: mapCart(cartSell)
  });
}

function sendShopCloseRequest(){
  if (!shopState) return;
  if (shopState?.can_close === false) return;

  Events.Call("Shop:CloseRequest", {});
}

// Keybinds (capturés uniquement en mode dialog)
document.addEventListener("keydown", (e) => {
  if (uiMode !== "dialog") return;

  // évite de bouffer l'input admin console si elle est ouverte
  const active = document.activeElement;
  const typing = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
  if (typing) return;

  if (e.key === "ArrowUp") {
    moveSelection(-1);
    e.preventDefault();
  } else if (e.key === "ArrowDown") {
    moveSelection(+1);
    e.preventDefault();
  } else if (e.key === "Enter") {
    sendChoose();
    e.preventDefault();
  } else if (e.key === "Escape") {
    sendCloseRequest();
    e.preventDefault();
  }
}, true);

// Keybinds shop
document.addEventListener("keydown", (e) => {
  if (uiMode !== "shop") return;

  const active = document.activeElement;
  const typing = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
  if (typing) return;

  if (e.key === "ArrowUp") {
    moveShopSelection(-1);
    e.preventDefault();
  } else if (e.key === "ArrowDown") {
    moveShopSelection(+1);
    e.preventDefault();
  } else if (e.key === "ArrowLeft") {
    switchShopSide(-1);
    e.preventDefault();
  } else if (e.key === "ArrowRight") {
    switchShopSide(+1);
    e.preventDefault();
  } else if (e.key === "Enter") {
    if (!shopState) return;
    const lists = {
      player: filterShopList(getShopList(shopState, "player")),
      vendor: filterShopList(getShopList(shopState, "vendor"))
    };
    const selected = normalizeShopSelected(shopState, lists);
    const items = selected.side === "player" ? lists.player : lists.vendor;
    const item = items[selected.index];
    if (!item || item?.disabled) return;
    Events.Call("Shop:Select", {
      side: selected.side,
      item_id: String(item?.id ?? item?.item_id ?? ""),
      action: "toggle",
      index: selected.index
    });
    e.preventDefault();
  } else if (e.key === "+" || e.key === "=" || e.key === "PageUp") {
    if (!shopState) return;
    const lists = {
      player: filterShopList(getShopList(shopState, "player")),
      vendor: filterShopList(getShopList(shopState, "vendor"))
    };
    const selected = normalizeShopSelected(shopState, lists);
    const items = selected.side === "player" ? lists.player : lists.vendor;
    const item = items[selected.index];
    if (!item || item?.disabled) return;
    const amount = e.shiftKey || e.key === "PageUp" ? 5 : 1;
    Events.Call("Shop:Select", {
      side: selected.side,
      item_id: String(item?.id ?? item?.item_id ?? ""),
      action: "add",
      amount,
      index: selected.index
    });
    e.preventDefault();
  } else if (e.key === "-" || e.key === "_" || e.key === "PageDown") {
    if (!shopState) return;
    const lists = {
      player: filterShopList(getShopList(shopState, "player")),
      vendor: filterShopList(getShopList(shopState, "vendor"))
    };
    const selected = normalizeShopSelected(shopState, lists);
    const items = selected.side === "player" ? lists.player : lists.vendor;
    const item = items[selected.index];
    if (!item || item?.disabled) return;
    const amount = e.shiftKey || e.key === "PageDown" ? 5 : 1;
    Events.Call("Shop:Select", {
      side: selected.side,
      item_id: String(item?.id ?? item?.item_id ?? ""),
      action: "remove",
      amount,
      index: selected.index
    });
    e.preventDefault();
  } else if (e.code === "KeyE" || e.key === "e" || e.key === "E") {
    sendShopAccept();
    e.preventDefault();
  } else if (e.key === "Backspace") {
    sendShopCloseRequest();
    e.preventDefault();
  }
}, true);

// WebUI events
Events.Subscribe("UI:SetMode", setMode);
Events.Subscribe("Dialog:Open", renderDialog);
Events.Subscribe("Dialog:Close", () => renderDialog({ open: false }));
Events.Subscribe("Shop:Open", renderShop);
Events.Subscribe("Shop:Close", () => renderShop({ open: false }));

/* ===================== */
/* Inventory (Pip-Boy)   */
/* ===================== */
const elInv = () => document.getElementById("fnv_inventory");
const elInvCategories = () => document.getElementById("fnv_inv_categories");
const elInvList = () => document.getElementById("fnv_inv_list");
const elInvCenterIcon = () => document.getElementById("fnv_inv_center_icon");
const elInvStats = () => document.getElementById("fnv_inv_stats");
const elInvWeight = () => document.getElementById("fnv_inv_weight");
const elInvSort = () => document.getElementById("fnv_inv_sort");
const elInvHints = () => document.getElementById("fnv_inv_hints");
const elInvDescName = () => document.getElementById("fnv_inv_desc_name");
const elInvDescBody = () => document.getElementById("fnv_inv_desc_body");
const elInvDescIcon = () => document.getElementById("fnv_inv_desc_icon");
const elInvTitle = () => document.getElementById("fnv_inv_title");
const elInvPageItems = () => document.getElementById("fnv_inv_page_items");
const elInvPageStats = () => document.getElementById("fnv_inv_page_stats");
const elInvTabStatus = () => document.getElementById("fnv_inv_tab_status");
const elInvTabItems = () => document.getElementById("fnv_inv_tab_items");
const elInvTabData = () => document.getElementById("fnv_inv_tab_data");
const elSpecialList = () => document.getElementById("fnv_special_list");
const elSpecialIcon = () => document.getElementById("fnv_special_icon");
const elSpecialTitle = () => document.getElementById("fnv_special_title");
const elSpecialText = () => document.getElementById("fnv_special_text");

let invState = { open: false, category: null, index: 0, data: null, sort: null, page: "items", specialIndex: 0 };

const SPECIAL_ORDER = ["str", "per", "endu", "cha", "intel", "agi", "lck"];
const SPECIAL_META = {
  str: {
    label: "FORCE",
    icon: "icons/special/special_strength.png",
    desc:
      "La Force influence l'efficacité des armes de mêlée, les dégâts infligés au corps à corps, la capacité de charge et les armes que vous êtes capable d'utiliser correctement. Ne pas remplir les prérequis de Force d'une arme réduit la précision et entraîne des attaques plus lentes et moins puissantes."
  },
  per: {
    label: "PERCEPTION",
    icon: "icons/special/special_perception.png",
    desc:
      "La Perception affecte la distance de détection des ennemis, la précision en V.A.T.S. et les compétences liées à l'observation. Une faible Perception rend les menaces plus difficiles à repérer, parfois trop tard."
  },
  endu: {
    label: "ENDURANCE",
    icon: "icons/special/special_endurance.png",
    desc:
      "L'Endurance détermine la résistance physique, les points de vie totaux et la tolérance aux effets négatifs. Plus elle est élevée, plus vous êtes difficile à mettre à terre."
  },
  cha: {
    label: "CHARISME",
    icon: "icons/special/special_charisma.png",
    desc:
      "Le Charisme influence les interactions sociales, les prix chez les marchands et l'efficacité des compagnons. Un sourire peut parfois être plus efficace qu'une arme chargée."
  },
  intel: {
    label: "INTELLIGENCE",
    icon: "icons/special/special_intelligence.png",
    desc:
      "L'Intelligence affecte les compétences scientifiques, médicales et techniques. Une Intelligence élevée permet d'obtenir davantage de points de compétence à chaque montée de niveau."
  },
  agi: {
    label: "AGILITÉ",
    icon: "icons/special/special_agility.png",
    desc:
      "L'Agilité détermine les points d'action, la discrétion et l'efficacité avec les armes légères. Être rapide peut faire la différence entre survivre ou recommencer."
  },
  lck: {
    label: "CHANCE",
    icon: "icons/special/special_luck.png",
    desc:
      "La Chance influence les coups critiques, les événements imprévus et certains résultats inattendus. Dans le Wasteland, la chance sourit rarement deux fois."
  }
};

function getInvCategories(state){
  if (!state) return [];
  if (Array.isArray(state.categories)) return state.categories;
  return Object.keys(state.items || {});
}

function getInvItems(state, category){
  const list = state?.items?.[category] || [];
  return list.filter((item) => {
    const qty = item?.qty;
    return qty == null || Number(qty) > 0;
  });
}

function getInvSort(state){
  return invState.sort || state?.sort || { key: "name", dir: "asc" };
}

function sortInvItems(items, sort){
  const key = sort?.key || "name";
  const dir = sort?.dir === "desc" ? -1 : 1;
  const byName = (item) => String(item?.name ?? item?.item_id ?? "").toUpperCase();
  const byQty = (item) => Math.floor(Number(item?.qty ?? 0));

  const sorted = [...items].sort((a, b) => {
    if (key === "qty") {
      const qa = byQty(a);
      const qb = byQty(b);
      if (qa !== qb) return (qa - qb) * dir;
    }
    const na = byName(a);
    const nb = byName(b);
    if (na < nb) return -1;
    if (na > nb) return 1;
    return 0;
  });

  return sorted;
}

function normalizeInvSelection(state){
  const categories = getInvCategories(state);
  let category = invState.category && categories.includes(invState.category) ? invState.category : categories[0];
  if (!category) return { category: null, index: 0, items: [] };
  const items = sortInvItems(getInvItems(state, category), getInvSort(state));
  let index = invState.index || 0;
  if (index < 0) index = 0;
  if (index > items.length - 1) index = Math.max(0, items.length - 1);
  return { category, index, items, categories };
}

function renderInvCategories(state, selection){
  const el = elInvCategories();
  if (!el) return;
  el.innerHTML = "";
  const labels = {
    weapons: "ARMES",
    apparel: "TENUE",
    aid: "AIDE",
    misc: "DIVERS",
    ammo: "MUNITIONS",
    notes: "NOTES"
  };
  (selection.categories || []).forEach((cat) => {
    const tab = document.createElement("div");
    tab.className = "fnv_inv_category";
    if (cat === selection.category) tab.classList.add("active");
    tab.textContent = labels[cat] || String(cat).toUpperCase();
    tab.addEventListener("click", () => {
      if (!invState?.data) return;
      invState.category = cat;
      invState.index = 0;
      renderInventory(invState.data);
    });
    el.appendChild(tab);
  });
}

function renderInvList(state, selection){
  const listEl = elInvList();
  if (!listEl) return;
  listEl.innerHTML = "";

  if (!selection.items || selection.items.length === 0) {
    const row = document.createElement("div");
    row.className = "fnv_inv_row";
    row.textContent = "...";
    listEl.appendChild(row);
    return;
}

  selection.items.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "fnv_inv_row";
    if (idx === selection.index) row.classList.add("selected");

    const marker = document.createElement("div");
    marker.className = "fnv_inv_row_marker";
    marker.textContent = idx === selection.index ? ">" : "";

    const name = document.createElement("div");
    name.className = "fnv_inv_row_name";
    name.textContent = String(item?.name ?? item?.item_id ?? "").toUpperCase();

    const qty = document.createElement("div");
    qty.className = "fnv_inv_row_qty";
    qty.textContent = item?.stackable && item?.qty ? `x${item.qty}` : "";

    const eq = document.createElement("div");
    eq.className = "fnv_inv_row_eq";
    const equipped = !!item?.equipped || (item?.instance_id && (item.instance_id === state?.equipped?.weapon_instance_id || item.instance_id === state?.equipped?.armor_body_instance_id || item.instance_id === state?.equipped?.armor_head_instance_id));
    eq.textContent = equipped ? "E" : "";

    row.appendChild(marker);
    row.appendChild(name);
    row.appendChild(qty);
    row.appendChild(eq);

    row.addEventListener("mouseenter", () => {
      invState.index = idx;
      renderInventory(state);
    });

    row.addEventListener("click", () => {
      invState.index = idx;
      renderInventory(state);
    });

    listEl.appendChild(row);
  });
}

function applyInventorySubPageVisibility(){
  const subPage = invUiState.subPage || "ARMES";
  const showDps = subPage === "ARMES";
  const showStr = subPage === "ARMES";
  const dpsGroup = queryInvId("DPS");
  const strGroup = queryInvId("STR");
  setCondVisible(showDps, dpsGroup);
  setCondVisible(showStr, strGroup);
  const hideForSoins = subPage === "SOINS";
  const cndGroup = queryInvId("CND");
  const otherGroup = queryInvId("AMMO") || queryInvId("OTHER");
  const degGroup = queryInvId("DEG");
  setCondVisible(!hideForSoins, degGroup);
  setCondVisible(!hideForSoins, cndGroup);
  setCondVisible(!hideForSoins, otherGroup);
  if (invSvgState.effectsRow && invSvgState.effectsRowBaseTransform) {
    if (subPage === "SOINS" && invSvgState.effectsRowGap != null) {
      const nextY = invSvgState.effectsRowBaseY - invSvgState.effectsRowGap;
      invSvgState.effectsRow.setAttribute(
        "transform",
        `translate(${invSvgState.effectsRowBaseX.toFixed(SVG_ATTR_PRECISION)} ${nextY.toFixed(SVG_ATTR_PRECISION)})`
      );
    } else {
      invSvgState.effectsRow.setAttribute("transform", invSvgState.effectsRowBaseTransform);
    }
  }
  if (degGroup) {
    const forceVisible = (el, visible) => {
      if (!el) return;
      el.style.display = visible ? "inline" : "none";
      el.setAttribute("display", visible ? "inline" : "none");
      el.style.opacity = visible ? "1" : "0";
      el.setAttribute("opacity", visible ? "1" : "0");
      el.style.visibility = visible ? "visible" : "hidden";
      el.setAttribute("visibility", visible ? "visible" : "hidden");
    };
    const degLabel = degGroup.querySelector(
      '[inkscape\\:label="DEG_DONT_MODIFY"],[id$="DEG_DONT_MODIFY"]'
    );
    const dtLabel = degGroup.querySelector(
      '[inkscape\\:label="DT_DONT_MODIFY"],[id$="DT_DONT_MODIFY"]'
    );
    if (subPage === "ARMURE") {
      forceVisible(degLabel, false);
      forceVisible(dtLabel, true);
    } else {
      forceVisible(degLabel, true);
      forceVisible(dtLabel, false);
    }
  }

  const selectedMap = {
    ARMES: "armes_selected_box",
    ARMURE: "armure_selected_box",
    SOINS: "soins_selected_box",
    DIVERS: "divers_selected_box",
    MUNITIONS: "munitions_selected_box"
  };
  const hoveredMap = {
    ARMES: "armes_hovered",
    ARMURE: "armure_hovered",
    SOINS: "soins_hovered",
    DIVERS: "divers_hovered",
    MUNITIONS: "munitions_hovered"
  };
  Object.entries(selectedMap).forEach(([key, id]) => {
    const el = queryInvId(id);
    if (!el) return;
    const visible = key === subPage;
    setCondVisible(visible, el);
    if (visible) {
      el.setAttribute("opacity", "1");
      el.style.opacity = "1";
    }
    const hovered = queryInvId(hoveredMap[key]);
    if (hovered) {
      hovered.style.opacity = visible ? "0" : hovered.style.opacity;
    }
  });
}

function renderInvStats(item){
  const statsEl = elInvStats();
  if (!statsEl) return;
  statsEl.innerHTML = "";
  if (!item) return;

  const pushStat = (label, value) => {
    const row = document.createElement("div");
    row.className = "fnv_inv_stat";
    const lab = document.createElement("div");
    lab.className = "fnv_inv_stat_label";
    lab.textContent = label;
    const val = document.createElement("div");
    val.className = "fnv_inv_stat_value";
    val.textContent = value;
    row.appendChild(lab);
    row.appendChild(val);
    statsEl.appendChild(row);
  };

  if (item.cnd != null) {
    const cndRow = document.createElement("div");
    cndRow.className = "fnv_inv_stat";
    const lab = document.createElement("div");
    lab.className = "fnv_inv_stat_label";
    lab.textContent = "ETAT";
    const bar = document.createElement("div");
    bar.className = "fnv_inv_cnd_bar";
    const fill = document.createElement("div");
    fill.className = "fnv_inv_cnd_fill";
    const max = Number(item.max_cnd ?? 100);
    const pct = Math.max(0, Math.min(1, Number(item.cnd) / (max > 0 ? max : 1)));
    fill.style.width = `${Math.round(pct * 100)}%`;
    bar.appendChild(fill);
    cndRow.appendChild(lab);
    cndRow.appendChild(bar);
    statsEl.appendChild(cndRow);
  }

  if (item.weight != null) pushStat("PDS", String(item.weight));
  if (item.value != null) pushStat("VAL", String(item.value));
  if (item.qty != null && item.stackable) pushStat("QTE", String(item.qty));

  if (item.info) {
    const infoWrap = document.createElement("div");
    infoWrap.className = "fnv_inv_info";
    const infoLabel = document.createElement("div");
    infoLabel.className = "fnv_inv_info_label";
    infoLabel.textContent = "INFOS";
    const infoText = document.createElement("div");
    infoText.textContent = String(item.info);
    infoWrap.appendChild(infoLabel);
    infoWrap.appendChild(infoText);
    statsEl.appendChild(infoWrap);
  }
}

function renderInvFooter(state, item){
  const weightEl = elInvWeight();
  const sortEl = elInvSort();
  const hintsEl = elInvHints();

  const cur = state?.carry_weight?.current;
  const max = state?.carry_weight?.max;
  if (weightEl) {
    const curTxt = cur != null ? Number(cur).toFixed(1) : "--";
    const maxTxt = max != null ? Number(max).toFixed(1) : "--";
    weightEl.textContent = `PDS ${curTxt}/${maxTxt}`;
  }

  if (sortEl) {
    const sort = getInvSort(state);
    const keyRaw = String(sort?.key ?? "name");
    const keyMap = {
      name: "NOM",
      value: "VALEUR",
      weight: "POIDS",
      condition: "ETAT",
      qty: "QTE"
    };
    const key = (keyMap[keyRaw] || keyRaw).toUpperCase();
    const dir = String(sort?.dir ?? "asc").toUpperCase();
    sortEl.textContent = `TRI: ${key} ${dir === "DESC" ? "▼" : "▲"}`;
  }

  if (hintsEl) {
    const actions = Array.isArray(item?.actions) ? item.actions : [];
    const map = {
      use: "E UTILISER",
      equip: "E ÉQUIPER",
      drop: "R JETER",
      inspect: "I EXAMINER",
      repair: "X RÉPARER",
      mod: "M MODIF"
    };
    const hints = actions.map((a) => map[a]).filter(Boolean);
    hints.push("S TRI");
    hintsEl.textContent = hints.join("   ");
  }
}

function renderInvDesc(item){
  const nameEl = elInvDescName();
  const bodyEl = elInvDescBody();
  const iconEl = elInvDescIcon();

  if (!item) {
    if (nameEl) nameEl.textContent = "";
    if (bodyEl) bodyEl.textContent = "";
    if (iconEl) iconEl.innerHTML = "";
    return;
  }

  if (nameEl) nameEl.textContent = String(item?.name ?? item?.item_id ?? "").toUpperCase();
  if (bodyEl) bodyEl.textContent = String(item?.desc ?? "");
  if (iconEl) {
    const icon = String(item?.icon ?? "");
    iconEl.innerHTML = icon ? `<img src="${icon}" alt="">` : "";
  }
}

function setInvPage(page){
  const itemsPage = elInvPageItems();
  const statsPage = elInvPageStats();
  const tabStatus = elInvTabStatus();
  const tabItems = elInvTabItems();
  const tabData = elInvTabData();
  const title = elInvTitle();

  invState.page = page;

  if (itemsPage) itemsPage.classList.toggle("fnv_hidden", page !== "items");
  if (statsPage) statsPage.classList.toggle("fnv_hidden", page !== "stats");

  if (tabStatus) tabStatus.classList.toggle("fnv_inv_tab_active", page === "stats");
  if (tabItems) tabItems.classList.toggle("fnv_inv_tab_active", page === "items");
  if (tabData) tabData.classList.toggle("fnv_inv_tab_active", false);

  if (title) title.textContent = page === "stats" ? "STATUT" : "OBJETS";
}

function renderSpecial(state){
  const listEl = elSpecialList();
  if (!listEl) return;

  listEl.innerHTML = "";
  const special = state?.special || {};
  let index = invState.specialIndex || 0;
  if (index < 0) index = 0;
  if (index > SPECIAL_ORDER.length - 1) index = SPECIAL_ORDER.length - 1;
  invState.specialIndex = index;

  SPECIAL_ORDER.forEach((key, idx) => {
    const meta = SPECIAL_META[key];
    const row = document.createElement("div");
    row.className = "fnv_special_row";
    if (idx === index) row.classList.add("selected");

    const marker = document.createElement("div");
    marker.className = "fnv_special_row_marker";
    marker.textContent = idx === index ? ">" : "";

    const name = document.createElement("div");
    name.textContent = meta?.label || String(key).toUpperCase();

    const value = document.createElement("div");
    value.className = "fnv_special_row_value";
    value.textContent = String(special?.[key] ?? 0);

    row.appendChild(marker);
    row.appendChild(name);
    row.appendChild(value);

    row.addEventListener("mouseenter", () => {
      invState.specialIndex = idx;
      renderSpecial(state);
    });
    row.addEventListener("click", () => {
      invState.specialIndex = idx;
      renderSpecial(state);
    });

    listEl.appendChild(row);
  });

  const currentKey = SPECIAL_ORDER[invState.specialIndex] || SPECIAL_ORDER[0];
  const meta = SPECIAL_META[currentKey];

  const iconEl = elSpecialIcon();
  if (iconEl) {
    iconEl.innerHTML = meta?.icon ? `<img src="${meta.icon}" alt="">` : "";
  }

  const titleEl = elSpecialTitle();
  if (titleEl) titleEl.textContent = meta?.label || "";

  const textEl = elSpecialText();
  if (textEl) textEl.textContent = meta?.desc || "";
}

function getPrimaryInvAction(item){
  const actions = Array.isArray(item?.actions) ? item.actions : [];
  const order = ["use", "equip", "inspect", "drop"];
  return order.find((a) => actions.includes(a)) || actions[0] || null;
}

function sendInvAction(action, item, category, targetSlot){
  if (!action || !item) return;

  if (action === "use" && !targetSlot && isRepairKit(item)) {
    openRepairMenu(item, category);
    return;
  }

  const payload = {
    action,
    item_id: String(item?.item_id ?? ""),
    instance_id: item?.instance_id ?? null,
    stack_key: item?.stack_key ?? null,
    category
  };
  if (targetSlot) payload.target_slot = targetSlot;
  Events.Call("Inv:Action", payload);
}

function renderInventory(state){
  invState.data = state || null;
  const invEl = elInv();
  if (!invEl) return;

  if (!state?.open) {
    invEl.classList.add("fnv_hidden");
    invState.open = false;
    invUiState.open = false;
    return;
  }

  if (uiMode !== "inventory") setMode({ mode: "inventory" });
  invState.open = true;
  ensureUiFocus();

  if (invSvgState.root) {
    renderInventorySvg(state);
    return;
  }

  if (invState.page !== "items" && invState.page !== "stats") invState.page = "items";
  setInvPage(invState.page);

  if (invState.page === "stats") {
    renderSpecial(state);
    return;
  }

  const selection = normalizeInvSelection(state);
  invState.category = selection.category;
  invState.index = selection.index;

  renderInvCategories(state, selection);
  renderInvList(state, selection);

  const item = selection.items[selection.index];
  renderInvStats(item);
  renderInvFooter(state, item);
  renderInvDesc(item);

  const centerEl = elInvCenterIcon();
  if (centerEl) {
    const icon = String(item?.icon ?? "");
    centerEl.innerHTML = icon ? `<img src="${icon}" alt="">` : "";
  }
}

function toggleInvSort(){
  if (!invState?.data) return;
  const current = getInvSort(invState.data);
  let next = { key: "name", dir: "asc" };
  if (current.key === "name" && current.dir === "asc") {
    next = { key: "qty", dir: "asc" };
  } else if (current.key === "qty" && current.dir === "asc") {
    next = { key: "qty", dir: "desc" };
  } else {
    next = { key: "name", dir: "asc" };
  }
  invState.sort = next;
  invState.index = 0;
  renderInventory(invState.data);
}

function moveInvSelection(dir){
  if (!invState?.data) return;
  if (invState.page === "stats") {
    let idx = invState.specialIndex + dir;
    if (idx < 0) idx = SPECIAL_ORDER.length - 1;
    if (idx > SPECIAL_ORDER.length - 1) idx = 0;
    invState.specialIndex = idx;
    renderSpecial(invState.data);
    return;
  }
  const selection = normalizeInvSelection(invState.data);
  if (!selection.items.length) return;
  let idx = selection.index + dir;
  if (idx < 0) idx = selection.items.length - 1;
  if (idx > selection.items.length - 1) idx = 0;
  invState.index = idx;
  renderInventory(invState.data);
}

function switchInvCategory(dir){
  if (!invState?.data) return;
  if (invState.page !== "items") return;
  const cats = getInvCategories(invState.data);
  if (!cats.length) return;
  let idx = Math.max(0, cats.indexOf(invState.category));
  idx = (idx + dir + cats.length) % cats.length;
  invState.category = cats[idx];
  invState.index = 0;
  renderInventory(invState.data);
}

// Keybinds repair menu
document.addEventListener("keydown", (e) => {
  if (!repairMenuState.open) return;

  if (e.key === "ArrowUp") {
    repairMenuState.selected = Math.max(0, repairMenuState.selected - 1);
    syncRepairSelection();
    e.preventDefault();
    e.stopImmediatePropagation();
  } else if (e.key === "ArrowDown") {
    repairMenuState.selected = Math.min(repairMenuState.slots.length - 1, repairMenuState.selected + 1);
    syncRepairSelection();
    e.preventDefault();
    e.stopImmediatePropagation();
  } else if (e.code === "KeyE" || e.key === "e" || e.key === "E" || e.code === "Enter" || e.code === "NumpadEnter" || e.key === "Enter") {
    confirmRepairSelection();
    e.preventDefault();
    e.stopImmediatePropagation();
  } else if (e.key === "Backspace") {
    closeRepairMenu();
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, true);

// Keybinds inventory
document.addEventListener("keydown", (e) => {
  if (e.code === "Tab" || e.key === "Tab") {
    const active = document.activeElement;
    const typing = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
    if (typing) return;
    if (uiMode === "dialog" || uiMode === "shop") return;
    if (invState?.open) {
      Events.Call("Inv:CloseRequest", {});
    } else if (invState?.data) {
      renderInventory({ ...invState.data, open: true });
    }
    e.preventDefault();
    return;
  }

  if (!invState?.open) return;
  if (repairMenuState.open) return;
  const active = document.activeElement;
  const typing = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
  if (typing) return;

  if (e.key === "ArrowUp") {
    moveInvSelection(-1);
    e.preventDefault();
  } else if (e.key === "ArrowDown") {
    moveInvSelection(1);
    e.preventDefault();
  } else if (e.key === "ArrowLeft") {
    switchInvCategory(-1);
    e.preventDefault();
  } else if (e.key === "ArrowRight") {
    switchInvCategory(1);
    e.preventDefault();
  } else if (invState.page === "items" && (e.code === "KeyE" || e.key === "Enter")) {
    const selection = normalizeInvSelection(invState.data);
    const item = selection.items[selection.index];
    const action = getPrimaryInvAction(item);
    sendInvAction(action, item, selection.category);
    e.preventDefault();
  } else if (invState.page === "items" && (e.code === "KeyR" || e.key === "r" || e.key === "R")) {
    const selection = normalizeInvSelection(invState.data);
    const item = selection.items[selection.index];
    if (item?.actions && item.actions.includes("drop")) {
      sendInvAction("drop", item, selection.category);
    }
    e.preventDefault();
  } else if (invState.page === "items" && (e.code === "KeyI" || e.key === "i" || e.key === "I")) {
    const selection = normalizeInvSelection(invState.data);
    const item = selection.items[selection.index];
    if (item?.actions && item.actions.includes("inspect")) {
      sendInvAction("inspect", item, selection.category);
    }
    e.preventDefault();
  } else if (invState.page === "items" && (e.code === "KeyS" || e.key === "s" || e.key === "S")) {
    toggleInvSort();
    e.preventDefault();
  } else if (e.key === "Backspace") {
    Events.Call("Inv:CloseRequest", {});
    e.preventDefault();
  }
}, true);

document.addEventListener("keydown", (e) => {
  if (!containerState?.open) return;
  if (uiMode !== "gameplay") return;

  if (e.key === "ArrowUp") {
    if (!containerState.items.length) return;
    let idx = containerState.selected - 1;
    if (idx < 0) idx = containerState.items.length - 1;
    containerState.selected = idx;
    renderContainer(containerState);
  } else if (e.key === "ArrowDown") {
    if (!containerState.items.length) return;
    let idx = containerState.selected + 1;
    if (idx > containerState.items.length - 1) idx = 0;
    containerState.selected = idx;
    renderContainer(containerState);
  } else if (e.code === "KeyE" || e.key === "e" || e.key === "E") {
    const item = containerState.items[containerState.selected];
    if (!item) return;
    Events.Call("Container:Take", {
      container_id: String(containerState?.container?.id ?? ""),
      item_id: String(item?.item_id ?? ""),
      instance_id: item?.instance_id ?? null
    });
  } else if (e.code === "KeyR" || e.key === "r" || e.key === "R") {
    Events.Call("Container:OpenRequest", {
      container_id: String(containerState?.container?.id ?? "")
    });
  }
}, true);

document.addEventListener("keydown", (e) => {
  if (!transferState?.open) return;
  if (uiMode !== "gameplay") return;

  if (e.key === "ArrowLeft") {
    transferState.selectedSide = "left";
    transferState.selectedIndex = 0;
    renderTransferFromState();
  } else if (e.key === "ArrowRight") {
    transferState.selectedSide = "right";
    transferState.selectedIndex = 0;
    renderTransferFromState();
  } else if (e.key === "ArrowUp") {
    const items = transferState.selectedSide === "left" ? transferState.leftItems : transferState.rightItems;
    transferState.selectedIndex = clamp(transferState.selectedIndex - 1, 0, Math.max(0, items.length - 1));
    renderTransferFromState();
  } else if (e.key === "ArrowDown") {
    const items = transferState.selectedSide === "left" ? transferState.leftItems : transferState.rightItems;
    transferState.selectedIndex = clamp(transferState.selectedIndex + 1, 0, Math.max(0, items.length - 1));
    renderTransferFromState();
  } else if (e.code === "Enter" || e.code === "NumpadEnter" || e.key === "Enter") {
    const items = transferState.selectedSide === "left" ? transferState.leftItems : transferState.rightItems;
    const item = items[transferState.selectedIndex];
    if (!item) return;
    const moveTo = transferState.selectedSide === "left" ? "right" : "left";
    Events.Call("Container:TransferMove", {
      side: moveTo,
      container_id: String(transferState?.container?.id ?? ""),
      item_id: String(item?.item_id ?? ""),
      instance_id: item?.instance_id ?? null,
      stack_key: item?.stack_key ?? null
    });
  } else if (e.code === "KeyR" || e.key === "r" || e.key === "R") {
    const moveTo = transferState.selectedSide === "left" ? "right" : "left";
    Events.Call("Container:TransferTakeAll", {
      side: moveTo,
      container_id: String(transferState?.container?.id ?? "")
    });
  } else if (e.code === "KeyE" || e.key === "e" || e.key === "E") {
    Events.Call("Container:TransferCloseRequest", {
      container_id: String(transferState?.container?.id ?? "")
    });
  }
}, true);

function handleContainerKey(key){
  if (!containerState?.open) return;
  if (uiMode !== "gameplay") return;

  if (key === "up") {
    if (!containerState.items.length) return;
    let idx = containerState.selected - 1;
    if (idx < 0) idx = containerState.items.length - 1;
    containerState.selected = idx;
    renderContainer(containerState);
  } else if (key === "down") {
    if (!containerState.items.length) return;
    let idx = containerState.selected + 1;
    if (idx > containerState.items.length - 1) idx = 0;
    containerState.selected = idx;
    renderContainer(containerState);
  } else if (key === "take" || key === "action" || key === "use" || key === "e") {
    const item = containerState.items[containerState.selected];
    if (!item) return;
    Events.Call("Container:Take", {
      container_id: String(containerState?.container?.id ?? ""),
      item_id: String(item?.item_id ?? ""),
      instance_id: item?.instance_id ?? null
    });
  }
}

document.addEventListener("click", (e) => {
  if (uiMode !== "inventory") return;
  const target = e.target;
  if (!target) return;
  const sortEl = target.closest && target.closest("#fnv_inv_sort");
  if (sortEl) {
    toggleInvSort();
  }
  const tabStatus = target.closest && target.closest("#fnv_inv_tab_status");
  if (tabStatus) {
    invState.page = "stats";
    renderInventory(invState.data);
  }
  const tabItems = target.closest && target.closest("#fnv_inv_tab_items");
  if (tabItems) {
    invState.page = "items";
    renderInventory(invState.data);
  }
}, true);

Events.Subscribe("Inv:Open", renderInventory);
Events.Subscribe("Inv:Close", () => renderInventory({ open: false }));
Events.Subscribe("Inv:Key", (payload) => {
  if (!invState?.open) return;
  const key = String(payload?.key ?? "");
  if (repairMenuState.open) {
    const mapped =
      key === "up" ? "up" :
      key === "down" ? "down" :
      key === "left" ? "up" :
      key === "right" ? "down" :
      key === "action" || key === "use" || key === "e" ? "action" :
      key === "back" || key === "cancel" ? "cancel" :
      "";
    if (mapped) {
      handleRepairMenuKey(mapped);
    }
    return;
  }
  if (key === "up") {
    moveInvSelection(-1);
  } else if (key === "down") {
    moveInvSelection(1);
  } else if (key === "left") {
    switchInvCategory(-1);
  } else if (key === "right") {
    switchInvCategory(1);
  } else if (key === "action" && invState.page === "items") {
    const selection = normalizeInvSelection(invState.data);
    const item = selection.items[selection.index];
    const action = getPrimaryInvAction(item);
    sendInvAction(action, item, selection.category);
  } else if (key === "drop" && invState.page === "items") {
    const selection = normalizeInvSelection(invState.data);
    const item = selection.items[selection.index];
    if (item?.actions && item.actions.includes("drop")) {
      sendInvAction("drop", item, selection.category);
    }
  } else if (key === "inspect" && invState.page === "items") {
    const selection = normalizeInvSelection(invState.data);
    const item = selection.items[selection.index];
    if (item?.actions && item.actions.includes("inspect")) {
      sendInvAction("inspect", item, selection.category);
    }
  } else if (key === "sort" && invState.page === "items") {
    toggleInvSort();
  } else if (key === "tab_stats") {
    invState.page = "stats";
    renderInventory(invState.data);
  } else if (key === "tab_items") {
    invState.page = "items";
    renderInventory(invState.data);
  } else if (key === "close") {
    Events.Call("Inv:CloseRequest", {});
  }
});

})();
