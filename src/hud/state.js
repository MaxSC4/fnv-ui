export const apTickState = {
  current: null,
  target: null,
  timer: null,
  tickCount: null,
  baseWidth: null
};

export const hudSvgState = {
  root: null,
  hpTicksGroup: null,
  hpClipRect: null,
  hpClipBaseWidth: null,
  hpClipBaseX: null,
  hpLastWidth: null,
  hpLastX: null,
  hpLowTimer: null,
  compassStripContent: null,
  compassBaseOffset: null,
  compassLastOffset: null
};

export const enemySvgState = {
  root: null,
  svg: null,
  ticksGroup: null,
  clipRect: null,
  clipBaseWidth: null,
  clipBaseX: null,
  clipCenterX: null,
  clipLastWidth: null,
  clipLastX: null,
  tickCount: null,
  tickStep: null,
  nameText: null,
  nameClip: null,
  nameAligned: false,
  textScaleX: 1,
  textScaleY: 1,
  textTranslateX: 0,
  textTranslateY: 0
};

export const invSvgState = {
  root: null,
  svg: null,
  prefix: "",
  itemScroll: null,
  itemFrame: null,
  rowTemplate: null,
  itemNameClipId: "",
  itemNameClipWidth: null,
  rowBaseTransform: "",
  rowHeight: null,
  rowHoverBaseHeight: null,
  rowHoverSingleHeight: null,
  condBarGroup: null,
  condBarEmpty: null,
  condBarFull: null,
  condBarChevrons: null,
  rowGap: null,
  itemNameScaleX: null,
  rows: [],
  weapons: [],
  listKey: "",
  scrollOffset: 0,
  scrollMax: 0,
  selectedId: null,
  hoverId: null,
  bound: false,
  ammoText: null,
  dpsText: null,
  vwText: null,
  weightText: null,
  valText: null,
  strText: null,
  degText: null,
  otherText: null,
  effectsText: null,
  iconImage: null,
  pdsText: null,
  dtText: null,
  hpText: null,
  capsText: null,
  effectsRow: null,
  effectsRowBaseTransform: "",
  effectsRowBaseX: 0,
  effectsRowBaseY: 0,
  effectsRowGap: null
};

export const invUiState = {
  open: false,
  category: "OBJETS",
  subPage: "ARMES"
};

export const invState = {
  open: false,
  category: null,
  index: 0,
  data: null,
  sort: null,
  page: "items",
  specialIndex: 0
};

export const repairMenuState = {
  open: false,
  slots: [],
  selected: 0,
  item: null,
  category: null,
  equipped: null
};

export const containerState = {
  open: false,
  items: [],
  selected: 0,
  container: null
};

export const transferState = {
  open: false,
  container: null,
  player: null,
  leftItems: [],
  rightItems: [],
  selectedSide: "left",
  selectedIndex: 0
};

export const dialogStateRef = {
  value: null
};

export const shopStateRef = {
  value: null
};

export const shopQtyStateRef = {
  value: null
};

export const runtimeState = {
  stateReceived: false,
  lastHudState: null,
  lastEnemyTarget: null,
  uiMode: "gameplay",
  interactVisible: false,
  interactHideTimer: null,
  interactShowState: false
};
