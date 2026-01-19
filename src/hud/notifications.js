import notificationSvg from "../assets/notification/notification_svg";
import { elNotifs } from "./dom";
import {
  clamp,
  normalizeIconHref,
  prefixSvgIds,
  setSvgImageHref,
  getShapeInsideRectId,
  wrapSvgText,
  applyIconClipLayoutRect
} from "./utils";

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

function setNotificationText(el, lines) {
  if (!el) return;
  const textLines = Array.isArray(lines) ? lines.filter(Boolean) : [String(lines || "")].filter(Boolean);
  const tspans = el.querySelectorAll ? el.querySelectorAll("tspan") : null;
  if (!tspans || tspans.length === 0) {
    el.textContent = textLines.join(" ");
    return;
  }
  const maxLines = tspans.length;
  const normalized = textLines.length > maxLines
    ? [...textLines.slice(0, maxLines - 1), textLines.slice(maxLines - 1).join(" ")]
    : textLines;
  tspans.forEach((tspan, idx) => {
    tspan.textContent = normalized[idx] || "";
  });
}

export function notify(payload) {
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

  const uid = `notify_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const svgMarkup = prefixSvgIds(notificationSvg || "", uid);
  frame.innerHTML = svgMarkup;
  const svg = frame.querySelector("svg");
  if (svg) {
    const textEl = svg.querySelector(`#${uid}__NOTIFICATION_TEXT_TO_MODIFY`);
    const clipRect = svg.querySelector(`#${uid}__NOTIFICATION_ICON_CLIP`);
    const textLines = lines
      ? [lines.title, lines.subtitle].filter(Boolean)
      : [text, subtitle].filter(Boolean);
    const fullText = textLines.join(" ").trim();
    const rectId = getShapeInsideRectId(textEl);
    const rectEl = rectId ? svg.querySelector(`#${uid}__${rectId}`) : null;
    const rectW = Number(rectEl?.getAttribute("width"));
    if (fullText && Number.isFinite(rectW) && rectW > 0) {
      wrapSvgText(textEl, fullText, rectW, 3);
    } else {
      setNotificationText(textEl, textLines);
    }

    if (clipRect) {
      const iconId = `${uid}__notification_icon`;
      let iconEl = svg.querySelector(`#${iconId}`);
      if (!iconEl) {
        iconEl = document.createElementNS("http://www.w3.org/2000/svg", "image");
        iconEl.setAttribute("id", iconId);
        iconEl.setAttribute("class", "fnv_notify_icon_img");
        clipRect.parentElement?.insertBefore(iconEl, clipRect.nextSibling);
      }
      applyIconClipLayoutRect(iconEl, clipRect, 0.85);
      setSvgImageHref(iconEl, iconRaw);
    }
  }

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
