import Events from "../Events";
import { runtimeState } from "./state";

let handlersBound = false;

export function initInventoryInputHandlers(deps) {
  if (handlersBound) return;
  handlersBound = true;

  const {
    invState,
    repairMenuState,
    renderInventory,
    handleRepairMenuKey,
    moveInvSelection,
    switchInvCategory,
    toggleInvSort,
    normalizeInvSelection,
    getInvActivateAction,
    getPrimaryInvAction,
    sendInvAction
  } = deps;

  // Keybinds repair menu
  document.addEventListener("keydown", (e) => {
    if (!repairMenuState.open) return;

    if (e.key === "ArrowUp") {
      repairMenuState.selected = Math.max(0, repairMenuState.selected - 1);
      deps.syncRepairSelection();
      e.preventDefault();
      e.stopImmediatePropagation();
    } else if (e.key === "ArrowDown") {
      repairMenuState.selected = Math.min(repairMenuState.slots.length - 1, repairMenuState.selected + 1);
      deps.syncRepairSelection();
      e.preventDefault();
      e.stopImmediatePropagation();
    } else if (
      e.code === "KeyE" || e.key === "e" || e.key === "E" ||
      e.code === "Enter" || e.code === "NumpadEnter" || e.key === "Enter"
    ) {
      deps.confirmRepairSelection();
      e.preventDefault();
      e.stopImmediatePropagation();
    } else if (e.key === "Backspace") {
      deps.closeRepairMenu();
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
      if (runtimeState.uiMode === "dialog" || runtimeState.uiMode === "shop") return;
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
      const action = getInvActivateAction(item);
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

  document.addEventListener("click", (e) => {
    if (runtimeState.uiMode !== "inventory") return;
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
}
