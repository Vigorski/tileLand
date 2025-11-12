import { initTileLand } from "./initTileLand.js";
import { BOARD_TYPE_SVG, BOARD_TYPE_CANVAS } from "./constants.js";

const app = document.getElementById("app");
const loadSVGBoardButton = document.getElementById("loadSVG");
const loadCanvasBoardButton = document.getElementById("loadCanvas");

async function loadBoard(type = BOARD_TYPE_CANVAS) {
	app.innerHTML = "";
  
	const html = await fetch("partials/tileLandCanvas.html").then(r => r.text());

	app.innerHTML = html;
  initTileLand(type);
}

loadSVGBoardButton.addEventListener("click", () => loadBoard(BOARD_TYPE_SVG));
loadCanvasBoardButton.addEventListener("click", () => loadBoard(BOARD_TYPE_CANVAS));