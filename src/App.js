import { useEffect } from "react";
import { Mic } from "lucide-react";
import "./App.css";
import Events from "./Events";
import "./hud";

function App() {
  useEffect(() => {
    Events.Call("Ready");
  }, []);

  return (
    <div className="fnv_root">
      <div id="fnv_dialog" className="fnv_dialog fnv_hidden" aria-hidden="true">
        <div className="fnv_dialog_panel">
          <div className="fnv_dialog_npcname" id="fnv_dialog_npcname"></div>
          <div className="fnv_dialog_npcline fnv_hidden" id="fnv_dialog_npcline"></div>
          <div className="fnv_dialog_options" id="fnv_dialog_options"></div>
        </div>
      </div>

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

      <div id="fnv_enemy" className="fnv_enemy fnv_hidden" aria-hidden="true">
        <div className="fnv_enemy_name" id="fnv_enemy_name"></div>
        <div className="fnv_enemy_bar">
          <div className="fnv_enemy_fill" id="fnv_enemy_fill"></div>
        </div>
      </div>

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


      <div id="hud_hp_fallout">
        <div className="hud_topline">
          <div className="hud_tag">HP</div>
          <div className="hud_status" id="hud_status"></div>
        </div>

        <div className="fnv_bar" id="hp_bar">
          <div className="fnv_track" id="hp_track">
            <div className="fnv_track_fill" id="hp_fill"></div>
          </div>
        </div>

        <div className="fnv_compass">
          <div className="fnv_compass_viewport">
            <div className="fnv_compass_center" aria-hidden="true"></div>
            <div className="fnv_compass_band" id="compass_band">
              <div className="fnv_compass_line" aria-hidden="true"></div>
              <div className="fnv_compass_ticks" id="compass_ticks"></div>
              <div className="fnv_compass_labels" id="compass_labels"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="hud_right_fnv">
        <div className="hud_topline right">
          <div className="hud_status" id="ap_tag">
            AP
          </div>
        </div>

        <div className="fnv_bar fnv_bar_right" id="ap_bar">
          <div className="fnv_track" id="ap_track">
            <div className="fnv_track_fill" id="ap_fill"></div>
          </div>
        </div>

        <div className="fnv_right_row">
          <div className="fnv_cnd_box">
            <div className="fnv_cnd_label">CND</div>

            <div className="fnv_cnd_bars">
              <div className="fnv_cnd_barwrap" id="cnd_armor_wrap">
                <div className="fnv_cnd_bar fnv_cnd_empty"></div>
                <div className="fnv_cnd_bar fnv_cnd_fill" id="cnd_armor_fill"></div>
              </div>

              <div className="fnv_cnd_barwrap" id="cnd_weapon_wrap">
                <div className="fnv_cnd_bar fnv_cnd_empty"></div>
                <div className="fnv_cnd_bar fnv_cnd_fill" id="cnd_weapon_fill"></div>
              </div>
            </div>
          </div>

          <div className="fnv_v_separator" aria-hidden="true"></div>

          <div className="fnv_ammo_box">
            <div className="fnv_ammo" id="ammo_text">
              12/532
            </div>
          </div>

          <div className="fnv_mic_box" aria-label="Voice chat status">
            <Mic className="fnv_mic_icon" />
          </div>
        </div>
      </div>

      <div id="fnv_notify"></div>

      <div id="fnv_interact" className="fnv_interact fnv_hidden" aria-live="polite">
        <div className="fnv_interact_line1">
          <span className="fnv_interact_key">[E]</span>
          <span className="fnv_interact_action">INTERAGIR</span>
        </div>
        <div className="fnv_interact_name">{'"NOM_DU_PNJ"'}</div>
      </div>

      <div id="fnv_reticle" className="fnv_reticle fnv_hidden" aria-hidden="true">
        {"[><]"}
      </div>

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
                <div className="fnv_transfer_scroll_up" id="fnv_transfer_left_up">▲</div>
                <div className="fnv_transfer_scroll_rail"></div>
                <div className="fnv_transfer_scroll_down" id="fnv_transfer_left_down">▼</div>
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
                <div className="fnv_transfer_scroll_up" id="fnv_transfer_right_up">▲</div>
                <div className="fnv_transfer_scroll_rail"></div>
                <div className="fnv_transfer_scroll_down" id="fnv_transfer_right_down">▼</div>
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

      <div id="fnv-admin-console" className="fnv_admin" style={{ display: "none" }}>
        <div className="fnv_admin_header">
          <span>ADMIN CONSOLE</span>
          <span className="fnv_admin_hint">ENTER=SEND Aú ESC=QUIT</span>
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
    </div>
  );
}

export default App;
