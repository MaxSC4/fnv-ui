import Events from "../Events";

let adminOpen = false;
let adminHistory = [];
let adminHistIdx = -1;
let adminInited = false;

function adminEl(id) {
  return document.getElementById(id);
}

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

export function ensureAdminConsoleReady() {
  if (adminInited) return;
  if (initAdminConsole()) {
    adminInited = true;
    return;
  }
  window.setTimeout(ensureAdminConsoleReady, 100);
}
