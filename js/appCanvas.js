import TileLand from "./tileLandCanvas.js";
import { debounce } from "./helpers.js";
import {
  HOVER_RADIUS,
  SCALE_EXP_DECAY,
  PUSH_OFF_EXP_DECAY,
  PUSH_OFF_EXP_INITIAL,
  HOVER_ENGAGED,
} from "./constants.js";

// Controls
const engageHoverEle = document.getElementById("engageHover");
const hoverRadiusEle = document.getElementById("hoverRadius");
const dislocateStartEle = document.getElementById("dislocateStart");
const dislocateDecayEle = document.getElementById("dislocateDecay");
const tileSizeDecayEle = document.getElementById("tileSizeDecay");

const options = {
  hoverEngaged: engageHoverEle.checked,
};

const boardWrapper = document.getElementById("boardWrapper");
const initTileLand = new TileLand(boardWrapper, options);

function onRangeChange(ele, obj, property) {
  ele.addEventListener("input", (e) => {
    const indicator = e.target.nextElementSibling;
    const val = Number(e.target.value);
    obj[property] = val;
    indicator.innerText = val;

    if (obj instanceof TileLand) {
      obj.tileDislocate({ x: obj.columns / 2, y: obj.rows / 2 });
    }
  });
}

// Hover Events
onRangeChange(hoverRadiusEle, initTileLand, "hoverRadius");
onRangeChange(dislocateStartEle, initTileLand, "pushoffExpInitial");
onRangeChange(dislocateDecayEle, initTileLand, "pushoffExpDecay");
onRangeChange(tileSizeDecayEle, initTileLand, "scaleExpDecay");

engageHoverEle.addEventListener("change", (e) => {
  const checked = e.target.checked;
  initTileLand.hoverEngaged = checked;

  if (!checked) {
    initTileLand.resetBoard();
  }
});

// reset settings
const reset = document.getElementById("reset");
reset.addEventListener("click", () => {
  // reset inputs
  engageHoverEle.checked = HOVER_ENGAGED;
  hoverRadiusEle.value = HOVER_RADIUS;
  dislocateStartEle.value = PUSH_OFF_EXP_INITIAL;
  dislocateDecayEle.value = PUSH_OFF_EXP_DECAY;
  tileSizeDecayEle.value = SCALE_EXP_DECAY;

  // reset tile board
  initTileLand.resetBoard();
});

// Window resize
if (initTileLand) {
  const debouncedResetTileLand = debounce.call(
    initTileLand,
    initTileLand.resetBoard,
    250
  );

  window.addEventListener("resize", () => {
    debouncedResetTileLand();
  });
}
