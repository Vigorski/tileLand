import { initControls, switchBoardType } from "./initTileLand.js";
import { BOARD_TYPE_SVG, BOARD_TYPE_CANVAS } from "./constants.js";

const btnSwitchGroup = document.getElementById("btnSwitchGroup");
const loadSVGBoardButton = document.getElementById("loadSVG");
const loadCanvasBoardButton = document.getElementById("loadCanvas");

async function init() {
	initControls();
	switchBoardType(BOARD_TYPE_CANVAS);
}

function toggleButtons(button) {
  btnSwitchGroup
    .querySelector(".btn-switch--active")
    .classList.remove("btn-switch--active");
  button.classList.add("btn-switch--active");
}

loadCanvasBoardButton.addEventListener("click", (e) => {
  toggleButtons(e.target);
  switchBoardType(BOARD_TYPE_CANVAS);
});
loadSVGBoardButton.addEventListener("click", (e) => {
  toggleButtons(e.target);
  switchBoardType(BOARD_TYPE_SVG);
});

init();
