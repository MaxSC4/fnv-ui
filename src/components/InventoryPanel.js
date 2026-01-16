import { useEffect, useMemo, useRef } from "react";
import inventorySvg from "../assets/inventory/objects/objets_armes_svg";

export default function InventoryPanel() {
  const rootRef = useRef(null);
  const uid = useMemo(() => {
    const raw = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    return `inv_${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  }, []);
  const svgMarkup = useMemo(() => prefixSvgIds(inventorySvg || "", uid), [uid]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    window.dispatchEvent(new CustomEvent("FNV:InventoryReady", { detail: { root } }));
  }, []);

  return (
    <div
      id="fnv_inventory"
      className="fnv_inventory fnv_hidden"
      data-prefix={uid}
      aria-hidden="true"
      ref={rootRef}
    >
      <div
        className="fnv_inventory_content"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    </div>
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
