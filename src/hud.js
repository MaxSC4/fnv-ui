import Events from "./Events";

(function () {
  if (window.__FNV_HUD_INIT__) return;
  window.__FNV_HUD_INIT__ = true;
  /* ===================== */
  /* DOM Helpers           */
  /* ===================== */
  const elHpNow  = () => document.getElementById("hp_now");
  const elHpMax  = () => document.getElementById("hp_max");
  const elHpFill = () => document.getElementById("hp_fill"); // legacy (no longer used)
  const elHudStatus = () => document.getElementById("hud_status");
  const elHpTicksClip = () => document.getElementById("hpClipRect");

  const elCaps   = () => document.getElementById("caps_value");
  const elNotifs = () => document.getElementById("fnv_notify");

  // Compass
  const elCompassBand   = () => document.getElementById("compass_band");
  const elCompassTicks  = () => document.getElementById("compass_ticks");
  const elCompassLabels = () => document.getElementById("compass_labels");

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
  const elCndWeaponFill  = () => queryRightSubId("rect37");
  const elCndWeaponEmpty = () => queryRightSubId("rect36");
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

  function setTicksClip(rect, pct) {
    if (!rect) return;
    const safe = clamp(pct, 0, 100) / 100;
    rect.setAttribute("width", `${(safe * 100).toFixed(2)}%`);
  }

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

  const apTickState = {
    current: null,
    target: null,
    timer: null,
    tickCount: null,
    baseWidth: null
  };

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

    const hpNowEl = elHpNow();
    const hpMaxEl = elHpMax();
    const hpFillEl = elHpFill();
    const hudStatusEl = elHudStatus();

    if (hpNowEl) hpNowEl.textContent = hp;
    if (hpMaxEl) hpMaxEl.textContent = hpMax;
    if (hudStatusEl) {
      hudStatusEl.textContent = hpMax > 0 ? `${hp}/${hpMax}` : `${hp}`;
    }

    const hpPct = hpMax > 0 ? (hp / hpMax) * 100 : 0;
    setTicksClip(elHpTicksClip(), hpPct);
    const hpBar = document.getElementById("hp_bar");
    if (hpBar) hpBar.classList.toggle("hp_low", hpMax > 0 && hpPct < 20);

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
      elCndArmorEmpty()
    );
    setCondVisible(
      weaponVisible,
      elCndWeaponFill(),
      elCndWeaponEmpty()
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
      ammoEl.setAttribute("text-anchor", "end");
      ammoEl.setAttribute("dominant-baseline", "middle");
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
  /* Compass               */
  /* ===================== */
  const PX_PER_DEG = 2.2;
  const COMPASS_LABEL_GAP_BASE_PX = 18;
  const COMPASS_LABEL_GAP_PER_CHAR_PX = 8;
  const COMPASS_EASE = 0.22;

  let headingTargetNorm = 0;
  let headingTargetUnwrapped = 0;
  let headingRenderNorm = 0;
  let headingRenderUnwrapped = 0;
  let lastHeadingNorm = null;
  let compassRaf = null;

  function buildCompassBand() {
    const band = elCompassBand();
    const ticks = elCompassTicks();
    const labelsEl = elCompassLabels();
    if (!band || !ticks || !labelsEl) return false;

    ticks.innerHTML = "";
    labelsEl.innerHTML = "";
    band.querySelectorAll(".fnv_compass_line_segment").forEach((el) => el.remove());
    const line = band.querySelector(".fnv_compass_line");
    if (line) line.style.display = "none";

    const labels = [
      { d: 0,   t: "N"  },
      { d: 45,  t: "NE" },
      { d: 90,  t: "E"  },
      { d: 135, t: "SE" },
      { d: 180, t: "S"  },
      { d: 225, t: "SW" },
      { d: 270, t: "W"  },
      { d: 315, t: "NW" }
    ];

    const base = 360 * PX_PER_DEG;
    band.dataset.base = String(base);
    band.style.width = `${base * 3}px`;

    const nGap =
      COMPASS_LABEL_GAP_BASE_PX +
      Math.max(0, "N".length - 1) * COMPASS_LABEL_GAP_PER_CHAR_PX;
    const nGapLeft = nGap / 2;
    const nGapRight = nGap / 2;

    for (let k = -1; k <= 1; k++) {
      const loopStart = base * (k + 1);
      const loopEnd = base * (k + 2);
      const labelSlots = labels
        .map((it) => {
          const gap =
            COMPASS_LABEL_GAP_BASE_PX +
            Math.max(0, it.t.length - 1) * COMPASS_LABEL_GAP_PER_CHAR_PX;
          const gapLeft = gap / 2;
          const gapRight = gap / 2;
          return { pos: base + (it.d + 360 * k) * PX_PER_DEG, gapLeft, gapRight };
        })
        .sort((a, b) => a.pos - b.pos);

      for (const it of labels) {
        const x = base + (it.d + 360 * k) * PX_PER_DEG;
        const el = document.createElement("div");
        el.className = "fnv_compass_label";
        el.style.left = `${x}px`;
        el.textContent = it.t;
        labelsEl.appendChild(el);
      }

      // Add a virtual N at the loop end to prevent wrap overlap (ticks/line).
      labelSlots.push({ pos: loopEnd, gapLeft: nGapLeft, gapRight: nGapRight });
      labelSlots.sort((a, b) => a.pos - b.pos);

      let segStart = loopStart;
      labelSlots.forEach(({ pos, gapLeft, gapRight }) => {
        const segEnd = pos - gapLeft - 1;
        if (segEnd > segStart) {
          const seg = document.createElement("div");
          seg.className = "fnv_compass_line_segment";
          seg.style.left = `${segStart}px`;
          seg.style.width = `${segEnd - segStart}px`;
          band.appendChild(seg);
        }
        segStart = pos + gapRight + 1;
      });
      if (loopEnd > segStart) {
        const seg = document.createElement("div");
        seg.className = "fnv_compass_line_segment";
        seg.style.left = `${segStart}px`;
        seg.style.width = `${loopEnd - segStart}px`;
        band.appendChild(seg);
      }

      for (let i = 0; i < 32; i++) {
        const deg = i * 11.25;
        const x = base + (deg + 360 * k) * PX_PER_DEG;
        if (labelSlots.some(({ pos, gapLeft, gapRight }) => x >= pos - gapLeft && x <= pos + gapRight)) {
          continue;
        }
        const tick = document.createElement("div");
        tick.className = i % 2 === 0 ? "fnv_compass_tick big" : "fnv_compass_tick small";
        tick.style.left = `${x}px`;
        ticks.appendChild(tick);
      }
    }

    return true;
  }

  let compassBuilt = false;

  function cleanupCompassDom() {
    document.querySelectorAll(".fnv_compass_strip").forEach((el) => el.remove());

    const bands = Array.from(document.querySelectorAll(".fnv_compass_band"));
    bands.forEach((el, idx) => {
      if (idx > 0) el.remove();
    });

    const viewport = document.querySelector(".fnv_compass_viewport");
    if (!viewport) return;

    Array.from(viewport.children).forEach((child) => {
      if (child.classList.contains("fnv_compass_center")) return;
      if (child.classList.contains("fnv_compass_band")) return;
      child.remove();
    });

    const band = bands[0] || viewport.querySelector(".fnv_compass_band");
    if (!band) return;

    document.querySelectorAll(".fnv_compass_label").forEach((el) => {
      if (!band.contains(el)) el.remove();
    });
    document.querySelectorAll(".fnv_compass_tick").forEach((el) => {
      if (!band.contains(el)) el.remove();
    });
  }

  function ensureCompassBuilt() {
    cleanupCompassDom();
    const band = elCompassBand();
    const labelsCount = band ? band.querySelectorAll(".fnv_compass_label").length : 0;
    const ticksCount = band ? band.querySelectorAll(".fnv_compass_tick").length : 0;
    if (compassBuilt && labelsCount === 24 && ticksCount === 96) return true;
    const ok = buildCompassBand();
    compassBuilt = ok;
    return ok;
  }

  function renderCompass() {
    cleanupCompassDom();
    const band = elCompassBand();
    if (!band) return;

    const labels = band.querySelectorAll(".fnv_compass_label");
    const ticks = band.querySelectorAll(".fnv_compass_tick");
    if (labels.length !== 24 || ticks.length !== 96) {
      ensureCompassBuilt();
    }

    const base = Number(band.dataset.base || 0);
    const shift = -(base + headingRenderNorm * PX_PER_DEG);
    band.style.transform = `translate3d(${shift}px, 0, 0)`;
  }

  function tickCompass() {
    const delta = headingTargetUnwrapped - headingRenderUnwrapped;
    if (Math.abs(delta) < 0.001) {
      headingRenderUnwrapped = headingTargetUnwrapped;
    } else {
      headingRenderUnwrapped += delta * COMPASS_EASE;
    }
    headingRenderNorm = normDeg(headingRenderUnwrapped);
    renderCompass();

    if (headingRenderUnwrapped !== headingTargetUnwrapped) {
      compassRaf = requestAnimationFrame(tickCompass);
    } else {
      compassRaf = null;
    }
  }

  function setHeadingTarget(deg) {
    const h = normDeg(deg);
    if (lastHeadingNorm === null) {
      lastHeadingNorm = h;
      headingTargetUnwrapped = h;
    } else {
      const delta = shortestDeltaDeg(lastHeadingNorm, h);
      headingTargetUnwrapped += delta;
      lastHeadingNorm = h;
    }
    headingTargetNorm = h;
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

function snapTrackBackground(trackId) {
  const el = document.getElementById(trackId);
  if (!el) return;

  const cs = getComputedStyle(el);
  const tickW = parseFloat(cs.getPropertyValue("--tick-w")) || 8;
  const gap = parseFloat(cs.getPropertyValue("--gap")) || 1;
  const period = tickW + gap;

  const w = el.clientWidth;
  if (!w || w <= 0) return;

  const full = Math.max(period, Math.floor(w / period) * period);
  const remainder = w - full;

  el.style.width = `${full}px`;
  el.style.right = "auto";
  el.style.marginRight = `${remainder}px`;
  el.style.backgroundPositionX = "0px";
}

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
        "hud_hp_fallout",
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

      const compasses = document.querySelectorAll(".fnv_compass");
      if (compasses.length > 1) {
        compasses.forEach((el, idx) => {
          if (idx === 0) return;
          el.remove();
        });
      }

      const bands = document.querySelectorAll(".fnv_compass_band");
      if (bands.length > 1) {
        bands.forEach((el, idx) => {
          if (idx === 0) return;
          el.remove();
        });
      }

      const viewports = document.querySelectorAll(".fnv_compass_viewport");
      if (viewports.length > 1) {
        viewports.forEach((el, idx) => {
          if (idx === 0) return;
          el.remove();
        });
      }
    };
    pruneDuplicateDom();
    window.setInterval(pruneDuplicateDom, 500);
    ensureAdminConsoleReady();
    ensureUiFocus();
    window.addEventListener("mousedown", ensureUiFocus, true);
    snapTrackBackground("hp_track");
    snapTrackBackground("ap_track");
    const ensureCompassReady = () => {
      if (!elCompassBand() || !elCompassTicks() || !elCompassLabels()) {
        window.setTimeout(ensureCompassReady, 100);
        return;
      }
      ensureCompassBuilt();
      renderCompass();
      setHeadingTarget(0);
    };
    ensureCompassReady();

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

  window.addEventListener("resize", () => {
    snapTrackBackground("hp_track");
    snapTrackBackground("ap_track");
});

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
    return;
  }

  if (uiMode !== "inventory") setMode({ mode: "inventory" });
  invState.open = true;
  ensureUiFocus();

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
