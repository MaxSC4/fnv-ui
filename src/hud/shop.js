import Events from "../Events";
import { runtimeState } from "./state";

let shopState = null;
let shopQtyState = null;
let shopQtyBound = false;
let shopConfirmTimer = null;
let shopLastTxKey = null;
let handlersBound = false;
let setModeHandler = null;

const elShop = () => document.getElementById("fnv_shop");
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

function getShopCurrencyLabel(state) {
  const cur = state?.currency ?? state?.money ?? "Caps";
  if (typeof cur === "string") return cur;
  return String(cur?.label ?? cur?.name ?? "Caps");
}

function getShopList(state, side) {
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

function getShopCaps(state, side) {
  if (!state) return 0;
  const direct = side === "player" ? state.player_caps : state.vendor_caps;
  const nested = side === "player" ? state?.player?.caps : state?.vendor?.caps;
  return Math.floor(Number(direct ?? nested ?? 0));
}

function getItemQty(item) {
  const q = item?.qty ?? item?.count ?? item?.stack ?? item?.amount;
  if (q == null) return null;
  const n = Math.floor(Number(q));
  return Number.isFinite(n) ? n : null;
}

function filterShopList(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((item) => {
    const qty = getItemQty(item);
    return qty == null || qty > 0;
  });
}

function getItemValue(item) {
  const v = item?.unit_price ?? item?.price ?? item?.base_value ?? item?.value ?? item?.val;
  if (v == null) return null;
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? n : null;
}

function getSelectedQty(item) {
  const q = item?.selected_qty ?? item?.selectedQty ?? item?.selected;
  if (q == null) return 0;
  const n = Math.max(0, Math.floor(Number(q)));
  return Number.isFinite(n) ? n : 0;
}

function getItemWeight(item) {
  const w = item?.weight ?? item?.wg;
  if (w == null) return null;
  const n = Number(w);
  return Number.isFinite(n) ? n : null;
}

function getItemCnd(item) {
  const c = item?.cnd ?? item?.condition;
  if (c == null) return null;
  const n = Number(c);
  return Number.isFinite(n) ? n : null;
}

function getPlayerInventoryQty(state, itemId) {
  const list = getShopList(state, "player");
  const id = String(itemId ?? "");
  if (!id) return 0;
  const entry = list.find((it) => String(it?.item_id ?? it?.id ?? "") === id);
  const qty = entry ? getItemQty(entry) : 0;
  return qty == null ? 0 : qty;
}

function getShopTotals(state) {
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

function formatItemName(item) {
  const name = String(item?.name ?? "");
  const qty = getItemQty(item);
  if (qty != null) return `${name} (${qty})`;
  return name;
}

function normalizeShopSelected(state, lists) {
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

function getCartListForSide(state, side) {
  if (!state) return [];
  if (side === "vendor") return Array.isArray(state.cart_buy) ? state.cart_buy : [];
  if (side === "player") return Array.isArray(state.cart_sell) ? state.cart_sell : [];
  return [];
}

function getCartQty(state, side, item) {
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

function renderShopList(side, listEl, items, selected) {
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
    marker.textContent = (selected?.side === side && selected?.index === idx) ? "ƒ-" : "";

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
      if (!shopState || runtimeState.uiMode !== "shop") return;
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
      if (!shopState || runtimeState.uiMode !== "shop") return;
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
      if (!shopState || runtimeState.uiMode !== "shop") return;
      if (item?.disabled) return;
      const dir = e.deltaY < 0 ? "add" : "remove";
      const amount = e.shiftKey ? 5 : 1;
      sendSelect(dir, amount);
      e.preventDefault();
    }, { passive: false });

    listEl.appendChild(row);
  });
}

function bindShopQtyModal() {
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

function updateShopQtyValue() {
  const range = elShopQtyRange();
  const value = elShopQtyValue();
  if (!shopQtyState || !range || !value) return;
  const t = Math.max(0, Math.min(shopQtyState.max, shopQtyState.target));
  range.value = String(t);
  value.textContent = `${t}/${shopQtyState.max}`;
}

function openShopQtyModal(side, item) {
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

function closeShopQtyModal() {
  const modal = elShopQtyModal();
  if (modal) {
    modal.classList.add("fnv_hidden");
    modal.setAttribute("aria-hidden", "true");
  }
  shopQtyState = null;
}

function applyShopQtyModal() {
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

function renderShop(state) {
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

  if (runtimeState.uiMode !== "shop") {
    if (setModeHandler) setModeHandler({ mode: "shop" });
  }

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

function showShopConfirmFromTx(state) {
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

function moveShopSelection(dir) {
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

function switchShopSide(dir) {
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

function sendShopAccept() {
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

function sendShopCloseRequest() {
  if (!shopState) return;
  if (shopState?.can_close === false) return;

  Events.Call("Shop:CloseRequest", {});
}

export function initShopHandlers(setModeFn) {
  if (typeof setModeFn === "function") setModeHandler = setModeFn;
  if (handlersBound) return;
  handlersBound = true;

  document.addEventListener("keydown", (e) => {
    if (runtimeState.uiMode !== "shop") return;

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

  Events.Subscribe("Shop:Open", renderShop);
  Events.Subscribe("Shop:Close", () => renderShop({ open: false }));
}
