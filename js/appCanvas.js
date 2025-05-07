import TileLand from "./tileLandCanvas.js";
import { debounce } from "./helpers.js";
import { tileSize } from "./constants.js";

// Controls 
const engageHoverEle = document.getElementById('engageHover');
const hoverRadiusEle = document.getElementById('hoverRadius');
const dislocateStartEle = document.getElementById('dislocateStart');
const dislocateDecayEle = document.getElementById('dislocateDecay');
const tileSizeDecayEle = document.getElementById('tileSizeDecay');
const tilePushSpeedEle = document.getElementById('pushSpeed');
const tileReturnSpeedEle = document.getElementById('returnSpeed');

const options = {
	tilePixelSize: tileSize.lg,
	hoverEngaged: engageHoverEle.checked,
	hoverRadius: 3.6,
	pushoffExpInitial: 0.1,
	pushoffExpDecay: 0.6,
	scaleExpInitial: 1,
	scaleExpDecay: 0.4,
	activeTileLerpRate: .1,
	returningTileLerpRate: .01
};

const boardWrapper = document.getElementById('boardWrapper');
const initTileLand = new TileLand(boardWrapper, options);

function onRangeChange(ele, obj, property) {
  ele.addEventListener('input', e => {
    const indicator = e.target.nextElementSibling;
    const val = Number(e.target.value);
    obj[property] = val;
    indicator.innerText = val;

		if (obj instanceof TileLand) {
			obj.tileDislocate({x: obj.columns / 2, y: obj.rows / 2});
		}
  });
}

// Hover Events
onRangeChange(hoverRadiusEle, initTileLand, 'hoverRadius');
onRangeChange(dislocateStartEle, initTileLand, 'pushoffExpInitial');
onRangeChange(dislocateDecayEle, initTileLand, 'pushoffExpDecay');
onRangeChange(tileSizeDecayEle, initTileLand, 'scaleExpDecay');
onRangeChange(tilePushSpeedEle, initTileLand, 'activeTileLerpRate');
onRangeChange(tileReturnSpeedEle, initTileLand, 'returningTileLerpRate');

engageHoverEle.addEventListener('change', e => {
	const checked = e.target.checked;
	initTileLand.hoverEngaged = checked;
	
	if (!checked) {
		initTileLand.resetBoard();
	}
});

// reset settings
const reset = document.getElementById('reset');
reset.addEventListener('click', () => {
	// reset inputs
	engageHoverEle.checked = false;
	hoverRadiusEle.value = 3.6;
	dislocateStartEle.value = 0.1;
	dislocateDecayEle.value = 0.6;
	tileSizeDecayEle.value = 0.4;

	// reset tile board
  initTileLand.hoverEngaged = false;
	initTileLand.hoverRadius = 3.6;
	initTileLand.pushoffExpInitial = 0.1;
	initTileLand.pushoffExpDecay = 0.6;
	initTileLand.scaleExpInitial = 1;
	initTileLand.scaleExpDecay = 0.4;
	initTileLand.resetBoard();
});

// Window resize
if (initTileLand) {
	const debouncedResetTileLand = debounce.call(initTileLand, initTileLand.resetBoard, 250);

	window.addEventListener('resize', () => {
		debouncedResetTileLand();
	});
}