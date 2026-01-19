import { elEnemy } from "./dom";
import { enemySvgState, runtimeState } from "./state";
import { clamp, parseMatrix, setSvgText } from "./utils";
import { SVG_ATTR_PRECISION, DOM_EPSILON } from "./constants";

function getEnemyPrefix() {
  return enemySvgState.root?.dataset?.prefix || "";
}

function queryEnemyId(id) {
  const svg = enemySvgState.svg;
  if (!svg) return null;
  const prefix = getEnemyPrefix();
  const targetId = prefix ? `${prefix}__${id}` : id;
  return svg.querySelector(`#${targetId}`);
}

function alignEnemyName() {
  const textEl = enemySvgState.nameText;
  const clipRect = enemySvgState.nameClip;
  if (!textEl || !clipRect) return;
  const clipX = Number(clipRect.getAttribute("x"));
  const clipY = Number(clipRect.getAttribute("y"));
  const clipW = Number(clipRect.getAttribute("width"));
  const clipH = Number(clipRect.getAttribute("height"));
  if (![clipX, clipY, clipW, clipH].every(Number.isFinite)) return;

  const matrix = parseMatrix(textEl.getAttribute("transform") || "");
  const scaleX = matrix?.a ?? 1;
  const scaleY = matrix?.d ?? 1;
  const translateX = matrix?.e ?? 0;
  const translateY = matrix?.f ?? 0;
  if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX === 0 || scaleY === 0) return;

  const centerX = clipX + clipW / 2;
  const centerY = clipY + clipH / 2;
  const targetX = (centerX - translateX) / scaleX;
  const targetY = (centerY - translateY) / scaleY;

  const tspan = textEl.querySelector("tspan");
  const baseX = Number(tspan?.getAttribute("x") || textEl.getAttribute("x") || 0);
  const baseY = Number(tspan?.getAttribute("y") || textEl.getAttribute("y") || 0);
  if (!Number.isFinite(baseX) || !Number.isFinite(baseY)) return;

  const dx = targetX - baseX;
  const dy = targetY - baseY;
  textEl.setAttribute("text-anchor", "middle");
  textEl.setAttribute("dominant-baseline", "middle");
  if (tspan) {
    tspan.setAttribute("dx", dx.toFixed(SVG_ATTR_PRECISION));
    tspan.setAttribute("dy", dy.toFixed(SVG_ATTR_PRECISION));
  }
  enemySvgState.nameAligned = true;
}

function getEnemyHpRatio(payload) {
  const pct = Number(payload?.hp_pct ?? payload?.hp_percent);
  if (Number.isFinite(pct)) return pct > 1 ? pct / 100 : pct;
  const hp = Number(payload?.hp ?? payload?.hp_current);
  const hpMax = Number(payload?.hp_max ?? payload?.hp_maximum ?? payload?.hp_total);
  if (Number.isFinite(hp) && Number.isFinite(hpMax) && hpMax > 0) return hp / hpMax;
  return 0;
}

function setEnemyHpTicks(pct01) {
  const rect = enemySvgState.clipRect;
  if (!rect) return;
  const safe = clamp(pct01, 0, 1);
  const baseWidth = enemySvgState.clipBaseWidth ?? Number(rect.getAttribute("width"));
  const baseX = enemySvgState.clipBaseX ?? Number(rect.getAttribute("x"));
  if (!Number.isFinite(baseWidth) || !Number.isFinite(baseX)) return;
  const centerX = enemySvgState.clipCenterX ?? (baseX + baseWidth / 2);

  let width = baseWidth * safe;
  if (enemySvgState.tickCount && enemySvgState.tickStep) {
    const ticks = clamp(Math.round(enemySvgState.tickCount * safe), 0, enemySvgState.tickCount);
    width = enemySvgState.tickStep * ticks;
  }

  width = Number(width.toFixed(SVG_ATTR_PRECISION));
  const nextX = Number((centerX - width / 2).toFixed(SVG_ATTR_PRECISION));

  if (enemySvgState.clipLastWidth == null || Math.abs(width - enemySvgState.clipLastWidth) > DOM_EPSILON) {
    rect.setAttribute("width", String(width));
    enemySvgState.clipLastWidth = width;
  }
  if (enemySvgState.clipLastX == null || Math.abs(nextX - enemySvgState.clipLastX) > DOM_EPSILON) {
    rect.setAttribute("x", String(nextX));
    enemySvgState.clipLastX = nextX;
  }
}

export function initEnemySvg(event) {
  const root = event?.detail?.root || elEnemy();
  if (!root) return;
  const svg = root.querySelector("svg");
  if (!svg) return;
  enemySvgState.root = root;
  enemySvgState.svg = svg;

  enemySvgState.ticksGroup = queryEnemyId("enemy_hp_ticks_fill");
  enemySvgState.clipRect = queryEnemyId("rect120");
  const clipRect = enemySvgState.clipRect;
  const baseWidth = Number(clipRect?.getAttribute("width"));
  const baseX = Number(clipRect?.getAttribute("x"));
  if (Number.isFinite(baseWidth)) enemySvgState.clipBaseWidth = baseWidth;
  if (Number.isFinite(baseX)) enemySvgState.clipBaseX = baseX;
  if (Number.isFinite(baseWidth) && Number.isFinite(baseX)) {
    enemySvgState.clipCenterX = baseX + baseWidth / 2;
  }

  if (enemySvgState.ticksGroup) {
    const rects = Array.from(enemySvgState.ticksGroup.querySelectorAll("rect"));
    const tickCount = rects.length;
    if (tickCount > 0) enemySvgState.tickCount = tickCount;
    let tickStep = null;
    const xs = rects.map((rect) => Number(rect.getAttribute("x"))).filter(Number.isFinite).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i += 1) {
      const delta = xs[i] - xs[i - 1];
      if (delta > 0 && (tickStep == null || delta < tickStep)) tickStep = delta;
    }
    if (tickStep == null && Number.isFinite(baseWidth) && tickCount > 0) {
      tickStep = baseWidth / tickCount;
    }
    enemySvgState.tickStep = tickStep;
  }

  enemySvgState.nameText = queryEnemyId("name_text_to_modify");
  enemySvgState.nameClip = queryEnemyId("name_clip");
  alignEnemyName();

  if (runtimeState.lastEnemyTarget) setEnemyTarget(runtimeState.lastEnemyTarget);
}

export function ensureEnemySvgReady() {
  window.addEventListener("FNV:EnemyHudReady", initEnemySvg);
  if (elEnemy()?.querySelector("svg")) initEnemySvg();
}

export function setEnemyTarget(payload) {
  runtimeState.lastEnemyTarget = payload || null;
  const enemyEl = elEnemy();
  if (!enemyEl) return;

  const visible = payload?.visible ?? payload?.show ?? payload?.open;
  const fallbackVisible = !!(payload?.name || payload?.hp || payload?.hp_current || payload?.hp_pct || payload?.hp_percent);
  const showEnemy = visible == null ? fallbackVisible : !!visible;
  enemyEl.classList.toggle("fnv_hidden", !showEnemy);
  if (!showEnemy) return;
  if (!enemySvgState.svg) {
    const svg = enemyEl.querySelector("svg");
    if (svg) initEnemySvg({ detail: { root: enemyEl } });
  }

  if (enemySvgState.svg) {
    setSvgText(enemySvgState.nameText, String(payload?.name ?? ""));
    if (!enemySvgState.nameAligned) alignEnemyName();
    setEnemyHpTicks(getEnemyHpRatio(payload));
  }
}
