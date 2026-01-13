export default function LeftHud({ hudSvgUrl }) {
  return (
    <object
      id="hudSvg"
      type="image/svg+xml"
      data={hudSvgUrl}
      className="hudLeft"
      aria-hidden="true"
    />
  );
}
