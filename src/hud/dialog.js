import Events from "../Events";
import { runtimeState } from "./state";

let dialogState = null; // last state from Dialog:Open
let dialogMouseBound = false;
let handlersBound = false;
let setModeHandler = null;

const elDialog = () => document.getElementById("fnv_dialog");
const elDialogNpcName = () => document.getElementById("fnv_dialog_npcname");
const elDialogNpcLine = () => document.getElementById("fnv_dialog_npcline");
const elDialogOptions = () => document.getElementById("fnv_dialog_options");

function safeArr(v) { return Array.isArray(v) ? v : []; }

function bindDialogMouse(optsEl) {
  if (!optsEl || dialogMouseBound) return;
  dialogMouseBound = true;

  optsEl.addEventListener("mousemove", (event) => {
    const row = event.target.closest(".fnv_dialog_option");
    if (!row || !dialogState || runtimeState.uiMode !== "dialog") return;
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
    if (!row || !dialogState || runtimeState.uiMode !== "dialog") return;
    const idx = Number(row.dataset.index);
    if (!Number.isFinite(idx)) return;
    const options = safeArr(dialogState.options);
    if (options[idx]?.disabled) return;
    dialogState.selected = idx;
    sendChoose();
  });
}

function normalizeSelected(state) {
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

function renderDialog(state) {
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

  if (runtimeState.uiMode !== "dialog") {
    if (setModeHandler) setModeHandler({ mode: "dialog" });
  }

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

    // marker chevron uniquement sur sAclection
    const marker = document.createElement("div");
    marker.className = "fnv_dialog_marker";
    marker.textContent = (idx === selected) ? "ƒ-" : "";

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

function moveSelection(dir) {
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

function sendChoose() {
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

function sendCloseRequest() {
  if (!dialogState) return;
  if (dialogState?.can_close === false) return;

  Events.Call("Dialog:CloseRequest", {
    npc_id: String(dialogState?.npc?.id ?? "")
  });
}

export function initDialogHandlers(setModeFn) {
  if (typeof setModeFn === "function") setModeHandler = setModeFn;
  if (handlersBound) return;
  handlersBound = true;

  document.addEventListener("keydown", (e) => {
    if (runtimeState.uiMode !== "dialog") return;

    // Acvite de bouffer l'input admin console si elle est ouverte
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

  Events.Subscribe("Dialog:Open", renderDialog);
  Events.Subscribe("Dialog:Close", () => renderDialog({ open: false }));
}
