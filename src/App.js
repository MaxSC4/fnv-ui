import { useEffect } from "react";
import "./App.css";
import Events from "./Events";
import "./hud";
import AdminConsole from "./components/AdminConsole";
import ContainerLoot from "./components/ContainerLoot";
import DevKeys from "./components/DevKeys";
import DialogPanel from "./components/DialogPanel";
import EnemyHud from "./components/EnemyHud";
import InteractPrompt from "./components/InteractPrompt";
import InventoryPanel from "./components/InventoryPanel";
import LeftHud from "./components/LeftHud";
import Notifications from "./components/Notifications";
import RepairMenu from "./components/RepairMenu";
import Reticle from "./components/Reticle";
import RightHud from "./components/RightHud";
import ShopPanel from "./components/ShopPanel";
import TransferPanel from "./components/TransferPanel";

function App() {
  useEffect(() => {
    Events.Call("Ready");
  }, []);

  const rootClassName =
    process.env.NODE_ENV === "development" ? "fnv_root fnv_dev_bg" : "fnv_root";
  const hudSvgUrl = `${process.env.PUBLIC_URL || ""}/assets/hud/hp_compass_bar.svg`;

  const showDevKeys = process.env.NODE_ENV === "development";

  return (
    <div className={rootClassName}>
      <DevKeys visible={showDevKeys} />
      <DialogPanel />
      <ShopPanel />
      <EnemyHud />
      <InventoryPanel />
      <RepairMenu />
      <LeftHud hudSvgUrl={hudSvgUrl} />
      <RightHud />
      <Notifications />
      <InteractPrompt />
      <Reticle />
      <ContainerLoot />
      <TransferPanel />
      <AdminConsole />
    </div>
  );
}

export default App;
