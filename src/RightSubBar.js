import React, { useEffect, useMemo } from "react";
import rightSubBarSvg from "./assets/hud/right_sub_bar_svg";

export default function RightSubBar() {
  const uid = useMemo(() => {
    const raw = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    return `rsb_${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  }, []);
  const svgMarkup = useMemo(() => prefixSvgIds(rightSubBarSvg || "", uid), [uid]);

  useEffect(() => {
    window.dispatchEvent(new Event("FNV:RightSubBarReady"));
  }, []);

  return (
    <div
      id="fnv_right_sub_bar"
      className="fnv_right_sub_bar"
      data-prefix={uid}
      aria-hidden="true"
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
