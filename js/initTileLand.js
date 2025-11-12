import TileLandSVG from './tileLandSVG.js';
import TileLandCanvas from './tileLandCanvas.js';
import {
	HOVER_ENGAGED,
	HOVER_RADIUS,
	SCALE_EXP_DECAY,
	PUSH_OFF_EXP_DECAY,
	PUSH_OFF_EXP_INITIAL,
	BOARD_TYPE_CANVAS
} from './constants.js';
import { debounce } from './helpers.js';

function toggleHoverInputHandler(input, instance) {
	input.addEventListener('change', e => {
		const checked = e.target.checked;
		instance.hoverEngaged = checked;
		if (!checked) instance.returnTilesToDefault();
	});
}

function rangeInputHandler(input, instance, property, hoverInputEle) {
	input.addEventListener('input', e => {
		updateInputAndIndicator(e.target, instance, property);
		toggleHover(true, instance, hoverInputEle);
	});
}

function updateInputAndIndicator(input, instance, property, defaultValue) {
	const indicator = input.nextElementSibling;
	const val = defaultValue ?? Number(input.value);
	instance[property] = val;
	indicator.innerText = val;

	if (defaultValue) {
		input.value = val;
	}
}

function toggleHover(state, instance, hoverInputEle) {
	hoverInputEle.checked = state;
	instance.hoverEngaged = state;
	instance.hoverUpdate();
}

function setControlsToDefault(controls, instance, hoverInputEle) {
	controls.forEach(control => {
		updateInputAndIndicator(control.ele, instance, control.property, control.defaultValue);
	});
	hoverInputEle.checked = HOVER_ENGAGED;
}

function prepareNewBoard(type) {
	if (window.currentTileLand) {
		window.currentTileLand.destroy?.();
		window.currentTileLand = null;
	}

	const TileLand = type === BOARD_TYPE_CANVAS ? TileLandCanvas : TileLandSVG;
	const boardWrapper = document.getElementById('boardWrapper');

	window.currentTileLand = new TileLand(boardWrapper, {
		hoverEngaged: HOVER_ENGAGED
	});

	return window.currentTileLand;
}

export function initTileLand(type = BOARD_TYPE_CANVAS) {
	const currentTileLand = prepareNewBoard(type);

	// Controls
	const engageHoverEle = document.getElementById('engageHover');
	const hoverRadiusEle = document.getElementById('hoverRadius');
	const dislocateStartEle = document.getElementById('dislocateStart');
	const dislocateDecayEle = document.getElementById('dislocateDecay');
	const tileSizeDecayEle = document.getElementById('tileSizeDecay');

	const controls = [
		{ele: hoverRadiusEle, property: 'hoverRadius', defaultValue: HOVER_RADIUS},
		{ele: dislocateStartEle, property: 'pushoffExpInitial', defaultValue: PUSH_OFF_EXP_INITIAL},
		{ele: dislocateDecayEle, property: 'pushoffExpDecay', defaultValue: PUSH_OFF_EXP_DECAY},
		{ele: tileSizeDecayEle, property: 'scaleExpDecay', defaultValue: SCALE_EXP_DECAY},
	];

	setControlsToDefault(controls, currentTileLand, engageHoverEle);

	// Event handlers
	controls.forEach(control => {
		rangeInputHandler(control.ele, currentTileLand, control.property, engageHoverEle);
	});
	toggleHoverInputHandler(engageHoverEle, currentTileLand);

	// Reset settings
	const reset = document.getElementById('reset');
	reset.addEventListener('click', () => {
		setControlsToDefault(controls, currentTileLand, engageHoverEle);
		currentTileLand.resetBoard();
	});

	// Resize
	if (currentTileLand) {
		const debouncedResetTileLand = debounce.call(
			currentTileLand,
			currentTileLand.resetBoard,
			250
		);
		window.addEventListener('resize', () => debouncedResetTileLand());
	}
}
