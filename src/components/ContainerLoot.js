export default function ContainerLoot() {
  return (
    <div id="fnv_container" className="fnv_container fnv_hidden" aria-hidden="true">
      <div className="fnv_container_frame">
        <div className="fnv_container_header">
          <div className="fnv_container_title" id="fnv_container_title">CONTAINER</div>
          <div className="fnv_container_weight" id="fnv_container_weight">PDS --</div>
        </div>
        <div className="fnv_container_list" id="fnv_container_list"></div>
        <div className="fnv_container_footer">
          <div className="fnv_container_hint">E) PRENDRE</div>
          <div className="fnv_container_hint">R) OUVRIR</div>
        </div>
      </div>
    </div>
  );
}
