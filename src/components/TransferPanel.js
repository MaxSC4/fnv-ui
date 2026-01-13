export default function TransferPanel() {
  return (
    <div id="fnv_transfer" className="fnv_transfer fnv_hidden" aria-hidden="true">
      <div className="fnv_transfer_frame">
        <div className="fnv_transfer_panels">
          <div className="fnv_transfer_panel fnv_transfer_panel_left">
            <div className="fnv_transfer_header">
              <div className="fnv_transfer_title" id="fnv_transfer_left_title">OBJETS</div>
              <div className="fnv_transfer_weight" id="fnv_transfer_left_weight">PDS --</div>
            </div>
            <div className="fnv_transfer_rule"></div>
            <div className="fnv_transfer_list_viewport">
              <div className="fnv_transfer_list" id="fnv_transfer_left_list"></div>
            </div>
            <div className="fnv_transfer_scroll">
              <div className="fnv_transfer_scroll_up" id="fnv_transfer_left_up">ƒ-ı</div>
              <div className="fnv_transfer_scroll_rail"></div>
              <div className="fnv_transfer_scroll_down" id="fnv_transfer_left_down">ƒ-¬</div>
            </div>
          </div>

          <div className="fnv_transfer_chevron" aria-hidden="true">
            <div className="fnv_transfer_chevron_line a"></div>
            <div className="fnv_transfer_chevron_line b"></div>
          </div>

          <div className="fnv_transfer_panel fnv_transfer_panel_right">
            <div className="fnv_transfer_header">
              <div className="fnv_transfer_title" id="fnv_transfer_right_title">CONTAINER</div>
              <div className="fnv_transfer_weight" id="fnv_transfer_right_weight">PDS --</div>
            </div>
            <div className="fnv_transfer_rule"></div>
            <div className="fnv_transfer_list_viewport">
              <div className="fnv_transfer_list" id="fnv_transfer_right_list"></div>
            </div>
            <div className="fnv_transfer_scroll">
              <div className="fnv_transfer_scroll_up" id="fnv_transfer_right_up">ƒ-ı</div>
              <div className="fnv_transfer_scroll_rail"></div>
              <div className="fnv_transfer_scroll_down" id="fnv_transfer_right_down">ƒ-¬</div>
            </div>
          </div>
        </div>

        <div className="fnv_transfer_details">
          <div className="fnv_transfer_details_icon" id="fnv_transfer_details_icon"></div>
          <div className="fnv_transfer_details_stats">
            <div className="fnv_transfer_item_name" id="fnv_transfer_item_name"></div>
            <div className="fnv_transfer_stats_grid" id="fnv_transfer_stats_grid"></div>
          </div>
          <div className="fnv_transfer_details_controls">
            <div className="fnv_transfer_control">PRENDRE TOUT (R)</div>
            <div className="fnv_transfer_control">QUITTER (E)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
