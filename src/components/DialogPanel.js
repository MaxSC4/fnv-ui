export default function DialogPanel() {
  return (
    <div id="fnv_dialog" className="fnv_dialog fnv_hidden" aria-hidden="true">
      <div className="fnv_dialog_panel">
        <div className="fnv_dialog_npcname" id="fnv_dialog_npcname"></div>
        <div className="fnv_dialog_npcline fnv_hidden" id="fnv_dialog_npcline"></div>
        <div className="fnv_dialog_options" id="fnv_dialog_options"></div>
      </div>
    </div>
  );
}
