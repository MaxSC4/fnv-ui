export default function InventoryPanel() {
  return (
    <div id="fnv_inventory" className="fnv_inventory fnv_hidden" aria-hidden="true">
      <div className="fnv_inv_frame">
        <div className="fnv_inv_header">
          <div className="fnv_inv_title" id="fnv_inv_title">OBJETS</div>
          <div className="fnv_inv_tabs">
            <span className="fnv_inv_tab" id="fnv_inv_tab_status">STATUT</span>
            <span className="fnv_inv_tab fnv_inv_tab_active" id="fnv_inv_tab_items">OBJETS</span>
            <span className="fnv_inv_tab" id="fnv_inv_tab_data">DONNEES</span>
          </div>
        </div>

        <div className="fnv_inv_page" id="fnv_inv_page_items">
          <div className="fnv_inv_categories" id="fnv_inv_categories"></div>

          <div className="fnv_inv_body">
            <div className="fnv_inv_list" id="fnv_inv_list"></div>
            <div className="fnv_inv_center">
              <div className="fnv_inv_center_icon" id="fnv_inv_center_icon"></div>
            </div>
            <div className="fnv_inv_stats" id="fnv_inv_stats"></div>
          </div>

          <div className="fnv_inv_footer">
            <div className="fnv_inv_weight" id="fnv_inv_weight"></div>
            <div className="fnv_inv_sort" id="fnv_inv_sort"></div>
            <div className="fnv_inv_hints" id="fnv_inv_hints"></div>
          </div>

          <div className="fnv_inv_desc">
            <div className="fnv_inv_desc_icon" id="fnv_inv_desc_icon"></div>
            <div className="fnv_inv_desc_text">
              <div className="fnv_inv_desc_name" id="fnv_inv_desc_name"></div>
              <div className="fnv_inv_desc_body" id="fnv_inv_desc_body"></div>
            </div>
          </div>
        </div>

        <div className="fnv_inv_page fnv_inv_page_stats fnv_hidden" id="fnv_inv_page_stats">
          <div className="fnv_special_layout">
            <div className="fnv_special_list" id="fnv_special_list"></div>
            <div className="fnv_special_detail">
              <div className="fnv_special_icon" id="fnv_special_icon"></div>
              <div className="fnv_special_desc">
                <div className="fnv_special_title" id="fnv_special_title"></div>
                <div className="fnv_special_text" id="fnv_special_text"></div>
              </div>
            </div>
          </div>

          <div className="fnv_special_tabs">
            <span className="fnv_special_tab">STATUT</span>
            <span className="fnv_special_tab fnv_special_tab_active">S.P.E.C.I.A.L</span>
            <span className="fnv_special_tab">COMPETENCES</span>
            <span className="fnv_special_tab">ATOUTS</span>
            <span className="fnv_special_tab">GENERAL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
