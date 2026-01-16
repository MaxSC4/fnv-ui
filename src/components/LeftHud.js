import { useEffect, useRef } from "react";
import leftHudSvg from "../assets/hud/hp_compass_bar_svg";

export default function LeftHud() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    window.dispatchEvent(new CustomEvent("FNV:LeftHudReady", { detail: { root } }));
  }, []);

  return (
    <div
      id="hud_hp_fallout"
      className="hudLeft"
      style={{ "--pip": "#E3B54A" }}
      aria-hidden="true"
      ref={rootRef}
      dangerouslySetInnerHTML={{ __html: leftHudSvg }}
    />
  );
}
