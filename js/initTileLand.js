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

const DEFAULT_CONFIG = {
	hoverEngaged: HOVER_ENGAGED,
	hoverRadius: HOVER_RADIUS,
	pushoffExpInitial: PUSH_OFF_EXP_INITIAL,
	pushoffExpDecay: PUSH_OFF_EXP_DECAY,
	scaleExpDecay: SCALE_EXP_DECAY,
};

const boardState = {
  boardCache: {
		[BOARD_TYPE_CANVAS]: null,
		[BOARD_TYPE_SVG]: null,
	},
	configCache: {
		[BOARD_TYPE_CANVAS]: { ...DEFAULT_CONFIG },
		[BOARD_TYPE_SVG]: { ...DEFAULT_CONFIG },
	},
	currentBoardType: BOARD_TYPE_CANVAS,
	currentBoard: null,
	boardControls: null,
	controlsInitialized: false,
};

function updateConfig(property, value) {
	boardState.configCache[boardState.currentBoardType][property] = value;

	if (boardState.currentBoard) {
		boardState.currentBoard[property] = value;
	}
}

function toggleHoverInputHandler(input, _, valueOverride) {
	const hasValueOverride = typeof valueOverride !== 'undefined';
	const checked = hasValueOverride ? valueOverride : input.checked;
	
	updateConfig('hoverEngaged', checked);

	if (!checked) boardState.currentBoard.returnTilesToDefault();

	if (typeof valueOverride !== 'undefined') {
		boardState.currentBoard.activateHoverInCenter();
	}
}

function rangeInputHandler(input, property, valueOverride) {
  const indicator = input.nextElementSibling;
	const hasValueOverride = typeof valueOverride !== 'undefined';
  const val = hasValueOverride ? valueOverride : Number(input.value);

	if (hasValueOverride) input.value = val;

  updateConfig(property, val);
  indicator.innerText = val;
}

function setResizeHandler() {
	const debouncedCaller = debounce(() => {
    if (boardState.currentBoard) boardState.currentBoard.resetBoard();
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

function syncControlsToConfig(boardType) {
	const config = boardState.configCache[boardType];

	boardState.boardControls.forEach(control => {
		const val = config[control.property];
		
		if (control.handler === toggleHoverInputHandler) {
			control.ele.checked = val;
			control.handler(control.ele, null, val); 
		} else {
			control.handler(control.ele, control.property, val);
		}
	});
}

function setResetButtonHandler() {
	const button = document.getElementById("reset");

  button.addEventListener("click", () => {
    boardState.configCache[boardState.currentBoardType] = { ...DEFAULT_CONFIG };
    syncControlsToConfig(boardState.currentBoardType);
		boardState.currentBoard.resetBoard();
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
			property: "hoverEngaged",
			handler: toggleHoverInputHandler,
			event: "change",
		},
		{
      ele: hoverRadiusEle,
      property: "hoverRadius",
			handler: rangeInputHandler,
			event: "input",
    },
    {
      ele: dislocateStartEle,
      property: "pushoffExpInitial",
			handler: rangeInputHandler,
			event: "input",
    },
    {
      ele: dislocateDecayEle,
      property: "pushoffExpDecay",
			handler: rangeInputHandler,
			event: "input",
    },
    {
      ele: tileSizeDecayEle,
      property: "scaleExpDecay",
			handler: rangeInputHandler,
			event: "input",
    }
  ];

  // Event Listeners
	boardState.boardControls.forEach((control) => {
		control.ele.addEventListener(control.event, e => {
			control.handler(e.target, control.property);
			
			if (control.property !== 'hoverEngaged') {
				// if (!engageHoverEle.checked) {
					engageHoverEle.checked = true;
					toggleHoverInputHandler(engageHoverEle, null, true);
				// }
			}
		});
  });
	
  setToggleControlsHandlers();
  setResetButtonHandler();
	setResizeHandler();
	
  boardState.controlsInitialized = true;
}

export function switchBoardType(type = BOARD_TYPE_CANVAS) {
  const otherType = type === BOARD_TYPE_CANVAS ? BOARD_TYPE_SVG : BOARD_TYPE_CANVAS;

  if (boardState.boardCache[otherType]) {
    boardState.boardCache[otherType].pause();
  }

	// Update global active type
  boardState.currentBoardType = type;

	// Initialize new board if needed
  if (!boardState.boardCache[type]) {
    const boardWrapper = document.getElementById("boardWrapper");
    const TileLand = type === BOARD_TYPE_CANVAS ? TileLandCanvas : TileLandSVG;

		const initialConfig = boardState.configCache[type];
    boardState.boardCache[type] = new TileLand(boardWrapper, {
      ...initialConfig,
			monitor
    });
  } else if (boardState.boardCache[type].isPaused) {
    boardState.boardCache[type].resume();
  }

	boardState.currentBoard = boardState.boardCache[type];
	boardState.currentBoard.resetBoard();
	syncControlsToConfig(type);
	
	document.body.setAttribute('data-board-type', type);
}
