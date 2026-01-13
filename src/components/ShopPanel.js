export default function ShopPanel() {
  return (
    <div id="fnv_shop" className="fnv_shop fnv_hidden" aria-hidden="true">
      <div className="fnv_shop_frame">
        <div className="fnv_shop_panel fnv_shop_panel_left" data-side="player">
          <span className="fnv_shop_corner tl" aria-hidden="true"></span>
          <span className="fnv_shop_corner tr" aria-hidden="true"></span>
          <span className="fnv_shop_corner bl" aria-hidden="true"></span>
          <span className="fnv_shop_corner br" aria-hidden="true"></span>

          <div className="fnv_shop_header">
            <div className="fnv_shop_title">VOUS</div>
            <div className="fnv_shop_caps">
              <img className="fnv_shop_caps_icon" src="icons/items/items_nuka_cola_cap.png" alt="" />
              <span className="fnv_shop_caps_label" id="fnv_shop_currency_left">
                CAPS
              </span>
              <span className="fnv_shop_caps_value" id="fnv_shop_caps_player">
                0
              </span>
            </div>
          </div>
          <div className="fnv_shop_list" id="fnv_shop_list_player"></div>
        </div>

        <div className="fnv_shop_center">
          <div className="fnv_shop_arrow_block">
            <div className="fnv_shop_arrow_amount" id="fnv_shop_total_buy">0</div>
            <div className="fnv_shop_arrow_label" id="fnv_shop_total_buy_label">
              CAPS
            </div>
            <div className="fnv_shop_arrow_graphic fnv_shop_arrow_right" aria-hidden="true"></div>
          </div>
          <div className="fnv_shop_arrow_block">
            <div className="fnv_shop_arrow_amount" id="fnv_shop_total_sell">0</div>
            <div className="fnv_shop_arrow_label" id="fnv_shop_total_sell_label">
              CAPS
            </div>
            <div className="fnv_shop_arrow_graphic fnv_shop_arrow_left" aria-hidden="true"></div>
          </div>
          <div className="fnv_shop_confirm fnv_hidden" id="fnv_shop_confirm" aria-live="polite">
            <img className="fnv_shop_confirm_icon" src="icons/skills/skills_barter.png" alt="" />
            <div className="fnv_shop_confirm_text" id="fnv_shop_confirm_text"></div>
          </div>
        </div>

        <div className="fnv_shop_panel fnv_shop_panel_right" data-side="vendor">
          <span className="fnv_shop_corner tl" aria-hidden="true"></span>
          <span className="fnv_shop_corner tr" aria-hidden="true"></span>
          <span className="fnv_shop_corner bl" aria-hidden="true"></span>
          <span className="fnv_shop_corner br" aria-hidden="true"></span>

          <div className="fnv_shop_header">
            <div className="fnv_shop_title" id="fnv_shop_vendor_name">
              VENDOR
            </div>
            <div className="fnv_shop_caps">
              <img className="fnv_shop_caps_icon" src="icons/items/items_nuka_cola_cap.png" alt="" />
              <span className="fnv_shop_caps_label" id="fnv_shop_currency_right">
                CAPS
              </span>
              <span className="fnv_shop_caps_value" id="fnv_shop_caps_vendor">
                0
              </span>
            </div>
          </div>
          <div className="fnv_shop_list" id="fnv_shop_list_vendor"></div>
        </div>

        <div className="fnv_shop_itemcard">
          <span className="fnv_shop_corner tl" aria-hidden="true"></span>
          <span className="fnv_shop_corner tr" aria-hidden="true"></span>
          <span className="fnv_shop_corner bl" aria-hidden="true"></span>
          <span className="fnv_shop_corner br" aria-hidden="true"></span>

          <div className="fnv_shop_item_icon" aria-hidden="true"></div>
          <div className="fnv_shop_item_info">
            <div className="fnv_shop_item_name" id="fnv_shop_item_name">
              -
            </div>
            <div className="fnv_shop_item_stats">
              <div className="fnv_shop_stat">
                <span className="fnv_shop_stat_label">CND</span>
                <span className="fnv_shop_stat_value" id="fnv_shop_item_cnd">
                  --
                </span>
              </div>
              <div className="fnv_shop_stat">
                <span className="fnv_shop_stat_label">WG</span>
                <span className="fnv_shop_stat_value" id="fnv_shop_item_wg">
                  --
                </span>
              </div>
              <div className="fnv_shop_stat">
                <span className="fnv_shop_stat_label">VAL</span>
                <span className="fnv_shop_stat_value" id="fnv_shop_item_val">
                  --
                </span>
              </div>
            </div>
          </div>
          <div className="fnv_shop_item_desc" id="fnv_shop_item_desc"></div>
        </div>

        <div className="fnv_shop_actions">
          <div className="fnv_shop_action">ACCEPTER (E)</div>
          <div className="fnv_shop_action">QUITTER (BACKSPACE)</div>
        </div>

        <div id="fnv_shop_qty" className="fnv_shop_qty fnv_hidden" aria-hidden="true">
          <div className="fnv_shop_qty_panel">
            <div className="fnv_shop_qty_title">QUANTITE</div>
            <div className="fnv_shop_qty_value" id="fnv_shop_qty_value">0</div>
            <input
              id="fnv_shop_qty_range"
              className="fnv_shop_qty_range"
              type="range"
              min="0"
              max="1"
              defaultValue="0"
            />
            <div className="fnv_shop_qty_buttons">
              <button type="button" className="fnv_shop_qty_btn" data-action="min">0</button>
              <button type="button" className="fnv_shop_qty_btn" data-action="down">-1</button>
              <button type="button" className="fnv_shop_qty_btn" data-action="up">+1</button>
              <button type="button" className="fnv_shop_qty_btn" data-action="max">MAX</button>
            </div>
            <div className="fnv_shop_qty_actions">
              <button type="button" className="fnv_shop_qty_btn" data-action="cancel">ANNULER</button>
              <button type="button" className="fnv_shop_qty_btn fnv_shop_qty_btn_primary" data-action="confirm">VALIDER</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
