export default function DevKeys({ visible }) {
  if (!visible) return null;
  return (
    <div className="fnv_dev_keys" aria-hidden="true">
      H/-HP | Y/+HP | R/+Yaw | T/-Yaw
      <span className="fnv_dev_keys_stats" id="fnv_dev_keys_stats">
        HP: 100 | YAW: 0
      </span>
    </div>
  );
}
