export default function AdminConsole() {
  return (
    <div id="fnv-admin-console" className="fnv_admin" style={{ display: "none" }}>
      <div className="fnv_admin_header">
        <span>ADMIN CONSOLE</span>
        <span className="fnv_admin_hint">ENTER=SEND AA§ ESC=QUIT</span>
      </div>

      <div id="fnv-admin-log" className="fnv_admin_log"></div>

      <input
        id="fnv-admin-input"
        className="fnv_admin_input"
        type="text"
        placeholder="/money caps 100"
        autoComplete="off"
      />
    </div>
  );
}
