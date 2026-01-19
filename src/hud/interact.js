import { elInteract, elInteractKey, elInteractAction, elInteractName, elReticle } from "./dom";
import { runtimeState } from "./state";

export function setInteractPrompt(payload) {
  const wrap = elInteract();
  if (!wrap) return;

  const show = !!payload?.show;
  const key = String(payload?.key ?? "E").toUpperCase();
  const action = String(payload?.action ?? "INTERAGIR").toUpperCase();
  const name = String(payload?.name ?? "");
  const r = elReticle();
  runtimeState.interactShowState = show;

  // Anti-flicker: si on reAçoit show=true, on annule un hide en attente
  if (runtimeState.interactHideTimer) {
    clearTimeout(runtimeState.interactHideTimer);
    runtimeState.interactHideTimer = null;
  }

  if (!show) {
    // petit délai pour éviter clignotements si le raycast oscille
    runtimeState.interactHideTimer = setTimeout(() => {
      wrap.classList.add("fnv_hidden");
      runtimeState.interactVisible = false;
      runtimeState.interactHideTimer = null;
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

  if (!runtimeState.interactVisible) {
    wrap.classList.remove("fnv_hidden");
    runtimeState.interactVisible = true;
  }
}

export function updateReticleState() {
  const ret = elReticle();
  if (!ret) return;
  if (runtimeState.uiMode !== "gameplay") {
    ret.classList.add("fnv_hidden");
    return;
  }

  if (runtimeState.interactShowState) {
    ret.textContent = "[><]";
    ret.classList.remove("fnv_hidden");
    return;
  }

  const weaponEquipped = !!runtimeState.lastHudState?.equip?.weapon;
  const ammoNow = runtimeState.lastHudState?.ammo?.now;
  const hasAmmo = ammoNow == null ? true : Number(ammoNow) > 0;

  if (weaponEquipped && hasAmmo) {
    ret.textContent = "> <";
    ret.classList.remove("fnv_hidden");
  } else {
    ret.classList.add("fnv_hidden");
  }
}
