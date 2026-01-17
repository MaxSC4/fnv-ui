import { useEffect, useMemo, useRef } from "react";
import enemyHpBarSvg from "../assets/hud/enemy_hp_bar_svg";

export default function EnemyHud() {
  const rootRef = useRef(null);
  const uid = useMemo(() => {
    const raw = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    return `enemy_${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  }, []);
  const svgMarkup = useMemo(() => prefixSvgIds(enemyHpBarSvg || "", uid), [uid]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    window.dispatchEvent(new CustomEvent("FNV:EnemyHudReady", { detail: { root } }));
  }, []);

  return (
    <div
      id="fnv_enemy"
      className="fnv_enemy fnv_hidden"
      data-prefix={uid}
      aria-hidden="true"
      ref={rootRef}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}

function prefixSvgIds(svgText, prefix) {
  if (!svgText || !prefix) return svgText;
  const idPrefix = `${prefix}__`;
  const withIds = svgText.replace(/id="([^"]+)"/g, (match, id) => {
    if (id.startsWith(idPrefix)) return match;
    return `id="${idPrefix}${id}"`;
  });
  const withUrls = withIds.replace(/url\(#([^)]+)\)/g, (match, id) => {
    if (id.startsWith(idPrefix)) return match;
    return `url(#${idPrefix}${id})`;
  });
  const withHref = withUrls.replace(/href="#([^"]+)"/g, (match, id) => {
    if (id.startsWith(idPrefix)) return match;
    return `href="#${idPrefix}${id}"`;
  });
  return withHref.replace(/xlink:href="#([^"]+)"/g, (match, id) => {
    if (id.startsWith(idPrefix)) return match;
    return `xlink:href="#${idPrefix}${id}"`;
  });
}
