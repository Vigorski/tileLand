import TileLandSVG from "./tileLandSVG.js";
import TileLandCanvas from "./tileLandCanvas.js";
import {
  HOVER_ENGAGED,
  HOVER_RADIUS,
  SCALE_EXP_DECAY,
  PUSH_OFF_EXP_DECAY,
  PUSH_OFF_EXP_INITIAL,
  BOARD_TYPE_CANVAS,
  BOARD_TYPE_SVG
} from "./constants.js";
import { debounce } from "./helpers.js";

let controlsInitialized = false;
const boardCache = {
  [BOARD_TYPE_CANVAS]: null,
  [BOARD_TYPE_SVG]: null,
};

function toggleHoverInputHandler(input) {
  input.addEventListener("change", (e) => {
    if (!window.currentTileLand) return;
    const checked = e.target.checked;
    window.currentTileLand.hoverEngaged = checked;
    if (!checked) window.currentTileLand.returnTilesToDefault();
  });
}

function rangeInputHandler(input, property, hoverInputEle) {
  input.addEventListener("input", (e) => {
    if (!window.currentTileLand) return;
    updateInputAndIndicator(e.target, property);
    toggleHover(true, hoverInputEle);
  });
}

function resetButtonHandler(button) {
  button.addEventListener("click", () => {
    if (!window.currentTileLand) return;
    setControlsToDefault(
      window.tileLandControls.controls,
      window.tileLandControls.engageHoverEle
    );
    window.currentTileLand.resetBoard();
  });
}

function resizeHandler() {
	const debouncedCaller = debounce((tileLand) => {
    tileLand.resetBoard();
  }, 250);

  window.addEventListener('resize', () => {
    if (!window.currentTileLand) return;
    debouncedCaller(window.currentTileLand);
  });
}

function controlsToggleHandlers() {
  const controlsEle = document.querySelector(".controls");
  const controlsOpenEle = document.getElementById("controlsOpen");
  const controlsCloseEle = document.getElementById("controlsClose");

  controlsOpenEle.addEventListener("click", () => {
    controlsEle.classList.remove("controls--hidden");
  });

  controlsCloseEle.addEventListener("click", () => {
    controlsEle.classList.add("controls--hidden");
  });
}

function updateInputAndIndicator(input, property, defaultValue) {
  const indicator = input.nextElementSibling;
  const val = (typeof defaultValue !== 'undefined') ? defaultValue : Number(input.value);
  window.currentTileLand[property] = val;
  indicator.innerText = val;

  if (typeof defaultValue !== 'undefined') {
    input.value = val;
  }
}

function toggleHover(state, hoverInputEle) {
  hoverInputEle.checked = state;
  window.currentTileLand.hoverEngaged = state;
  window.currentTileLand.activateHoverInCenter();
}

function setControlsToDefault(controls, hoverInputEle) {
  controls.forEach((control) => {
    updateInputAndIndicator(
      control.ele,
      control.property,
      control.defaultValue
    );
  });
  hoverInputEle.checked = HOVER_ENGAGED;
}

export function initControls() {
  if (controlsInitialized) return;

  // Controls
  const engageHoverEle = document.getElementById("engageHover");
  const hoverRadiusEle = document.getElementById("hoverRadius");
  const dislocateStartEle = document.getElementById("dislocateStart");
  const dislocateDecayEle = document.getElementById("dislocateDecay");
  const tileSizeDecayEle = document.getElementById("tileSizeDecay");

  const controls = [
    {
      ele: hoverRadiusEle,
      property: "hoverRadius",
      defaultValue: HOVER_RADIUS,
    },
    {
      ele: dislocateStartEle,
      property: "pushoffExpInitial",
      defaultValue: PUSH_OFF_EXP_INITIAL,
    },
    {
      ele: dislocateDecayEle,
      property: "pushoffExpDecay",
      defaultValue: PUSH_OFF_EXP_DECAY,
    },
    {
      ele: tileSizeDecayEle,
      property: "scaleExpDecay",
      defaultValue: SCALE_EXP_DECAY,
    },
  ];

  // Event handlers
  controls.forEach((control) => {
    rangeInputHandler(control.ele, control.property, engageHoverEle);
  });
  toggleHoverInputHandler(engageHoverEle);

  // Controls toggle handlers
  controlsToggleHandlers();

  // Reset settings
  const reset = document.getElementById("reset");
  resetButtonHandler(reset);

	resizeHandler();
	
	setControlsToDefault(controls, engageHoverEle);

  controlsInitialized = true;
	
  window.tileLandControls = { controls, engageHoverEle };
}

export function switchBoardType(type = BOARD_TYPE_CANVAS) {
  const otherType =
    type === BOARD_TYPE_CANVAS ? BOARD_TYPE_SVG : BOARD_TYPE_CANVAS;

  if (boardCache[otherType]) {
    boardCache[otherType].pause();
  }

  if (!boardCache[type]) {
    const boardWrapper = document.getElementById("boardWrapper");
    const TileLand = type === BOARD_TYPE_CANVAS ? TileLandCanvas : TileLandSVG;
    boardCache[type] = new TileLand(boardWrapper, {
      hoverEngaged: HOVER_ENGAGED
    });
  } else if (boardCache[type].isPaused) {
    boardCache[type].resume();
  }

	boardCache[type].resetBoard();
	document.body.setAttribute('data-board-type', type);
	window.currentTileLand = boardCache[type];
}
