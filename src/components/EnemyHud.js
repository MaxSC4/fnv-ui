export default function EnemyHud() {
  return (
    <div id="fnv_enemy" className="fnv_enemy fnv_hidden" aria-hidden="true">
      <div className="fnv_enemy_name" id="fnv_enemy_name"></div>
      <div className="fnv_enemy_bar">
        <div className="fnv_enemy_fill" id="fnv_enemy_fill"></div>
      </div>
    </div>
  );
}
