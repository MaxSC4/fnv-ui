import Events from "../Events";
import {
  elContainer,
  elContainerTitle,
  elContainerWeight,
  elContainerList,
  elTransfer,
  elTransferLeftTitle,
  elTransferLeftWeight,
  elTransferLeftList,
  elTransferLeftUp,
  elTransferLeftDown,
  elTransferRightTitle,
  elTransferRightWeight,
  elTransferRightList,
  elTransferRightUp,
  elTransferRightDown,
  elTransferDetailsIcon,
  elTransferStatsGrid,
  elTransferItemName
} from "./dom";
import { clamp } from "./utils";
import { containerState, transferState, runtimeState } from "./state";

function renderContainer(payload) {
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

function normalizeTransferSelection() {
  const items = transferState.selectedSide === "left" ? transferState.leftItems : transferState.rightItems;
  let idx = transferState.selectedIndex;
  if (idx < 0) idx = 0;
  if (idx > items.length - 1) idx = Math.max(0, items.length - 1);
  transferState.selectedIndex = idx;
  return { items, idx };
}

function renderTransferList(listEl, items, selectedIdx) {
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

function renderTransferStats(item) {
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

function renderTransferFromState() {
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

function renderTransfer(payload) {
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

function handleTransferMove() {
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
}

function handleTransferKey(key) {
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
    handleTransferMove();
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
}

function handleContainerKey(key) {
  if (!containerState?.open) return;
  if (runtimeState.uiMode !== "gameplay") return;

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

let handlersBound = false;
export function initContainerTransferHandlers() {
  if (handlersBound) return;
  handlersBound = true;

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
    handleTransferKey(key);
  });

  document.addEventListener("keydown", (e) => {
    if (!transferState?.open) return;
    if (runtimeState.uiMode !== "gameplay") return;

    if (e.key === "ArrowLeft") {
      handleTransferKey("left");
    } else if (e.key === "ArrowRight") {
      handleTransferKey("right");
    } else if (e.key === "ArrowUp") {
      handleTransferKey("up");
    } else if (e.key === "ArrowDown") {
      handleTransferKey("down");
    } else if (e.code === "Enter" || e.code === "NumpadEnter" || e.key === "Enter") {
      handleTransferKey("enter");
    } else if (e.code === "KeyR" || e.key === "r" || e.key === "R") {
      handleTransferKey("take_all");
    } else if (e.code === "KeyE" || e.key === "e" || e.key === "E") {
      handleTransferKey("close");
    }
  }, true);

  document.addEventListener("keydown", (e) => {
    if (!containerState?.open) return;
    if (runtimeState.uiMode !== "gameplay") return;

    if (e.key === "ArrowUp") {
      handleContainerKey("up");
    } else if (e.key === "ArrowDown") {
      handleContainerKey("down");
    } else if (e.code === "KeyE" || e.key === "e" || e.key === "E") {
      handleContainerKey("e");
    } else if (e.code === "KeyR" || e.key === "r" || e.key === "R") {
      Events.Call("Container:OpenRequest", {
        container_id: String(containerState?.container?.id ?? "")
      });
    }
  }, true);
}
