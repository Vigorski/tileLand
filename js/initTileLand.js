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
import { debounce, PerformanceMonitor } from "./helpers.js";

const monitor = new PerformanceMonitor((fps) => {
	document.getElementById('fpsCounter').textContent = fps;
});

const boardState = {
  boardCache: {
		[BOARD_TYPE_CANVAS]: null,
		[BOARD_TYPE_SVG]: null,
	},
	currentBoard: null,
	boardControls: null,
	controlsInitialized: false,
	// boardControls: {
	// 	[BOARD_TYPE_CANVAS]: {
	// 		rangeControls: null,
	// 		engageHoverEle: null,
	// 	},
	// 	[BOARD_TYPE_SVG]: {
	// 		rangeControls: null,
	// 		engageHoverEle: null,
	// 	},
	// }
};

function toggleHoverInputHandler(input, _, defaultValue) {
	const hasDefaultValue = typeof defaultValue !== 'undefined';
	const checked = hasDefaultValue ? defaultValue : input.checked;
	if (!checked) boardState.currentBoard.returnTilesToDefault();

	toggleHover(input, checked, hasDefaultValue);
}

function toggleHover(input, state, inCenter) {
  boardState.currentBoard.hoverEngaged = state;

  if (inCenter) {
		input.checked = state;
		boardState.currentBoard.activateHoverInCenter();
	}
}

function rangeInputHandler(input, property, defaultValue) {
  const indicator = input.nextElementSibling;
	const hasDefaultValue = typeof defaultValue !== 'undefined';
  const val = hasDefaultValue ? defaultValue : Number(input.value);
	if (hasDefaultValue) input.value = val;
  boardState.currentBoard[property] = val;
  indicator.innerText = val;
}

function setResetButtonHandler() {
	const button = document.getElementById("reset");

  button.addEventListener("click", () => {
    boardState.currentBoard.resetBoard();
    setControlsToDefault();
  });
}

function setResizeHandler() {
	const debouncedCaller = debounce(() => {
    boardState.currentBoard.resetBoard();
  }, 250);

  window.addEventListener('resize', debouncedCaller);
}

function setToggleControlsHandlers() {
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

function setControlsToDefault() {
	if (!boardState.currentBoard) return;

  boardState.boardControls.forEach((control) => {
    control.handler(control.ele, control.property, control.defaultValue);
  });
}

export function initControls() {
  if (boardState.controlsInitialized) return;

  // Controls
  const engageHoverEle = document.getElementById("engageHover");
  const hoverRadiusEle = document.getElementById("hoverRadius");
  const dislocateStartEle = document.getElementById("dislocateStart");
  const dislocateDecayEle = document.getElementById("dislocateDecay");
  const tileSizeDecayEle = document.getElementById("tileSizeDecay");

  boardState.boardControls = [
    {
			ele: engageHoverEle,
			property: "engageHover",
			defaultValue: HOVER_ENGAGED,
			currentValue: null,
			handler: toggleHoverInputHandler,
			event: "change",
		},
		{
      ele: hoverRadiusEle,
      property: "hoverRadius",
      defaultValue: HOVER_RADIUS,
			currentValue: null,
			handler: rangeInputHandler,
			event: "input",
    },
    {
      ele: dislocateStartEle,
      property: "pushoffExpInitial",
      defaultValue: PUSH_OFF_EXP_INITIAL,
			currentValue: null,
			handler: rangeInputHandler,
			event: "input",
    },
    {
      ele: dislocateDecayEle,
      property: "pushoffExpDecay",
      defaultValue: PUSH_OFF_EXP_DECAY,
			currentValue: null,
			handler: rangeInputHandler,
			event: "input",
    },
    {
      ele: tileSizeDecayEle,
      property: "scaleExpDecay",
      defaultValue: SCALE_EXP_DECAY,
			currentValue: null,
			handler: rangeInputHandler,
			event: "input",
    }
  ];

  // Control event handlers
	boardState.boardControls.forEach((control) => {
		control.ele.addEventListener(control.event, e => {
			control.handler(e.target, control.property);
			if (control.property !== 'engageHover') toggleHover(engageHoverEle, true, true);
		});
  });
	
  // Toggle controls handlers
  setToggleControlsHandlers();
	
  // Reset button handler
  setResetButtonHandler();
	
	// Resize handler
	setResizeHandler();
	
  setControlsToDefault();
	
  boardState.controlsInitialized = true;
}

export function switchBoardType(type = BOARD_TYPE_CANVAS) {
  const otherType = type === BOARD_TYPE_CANVAS ? BOARD_TYPE_SVG : BOARD_TYPE_CANVAS;

  if (boardState.boardCache[otherType]) {
    boardState.boardCache[otherType].pause();
  }

  if (!boardState.boardCache[type]) {
    const boardWrapper = document.getElementById("boardWrapper");
    const TileLand = type === BOARD_TYPE_CANVAS ? TileLandCanvas : TileLandSVG;

    boardState.boardCache[type] = new TileLand(boardWrapper, {
      hoverEngaged: HOVER_ENGAGED,
			monitor
    });
  } else if (boardState.boardCache[type].isPaused) {
    boardState.boardCache[type].resume();
  }

	boardState.boardCache[type].resetBoard();
	setControlsToDefault();
	
	document.body.setAttribute('data-board-type', type);
	boardState.currentBoard = boardState.boardCache[type];
}
