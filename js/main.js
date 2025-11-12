import { initTileLand } from "./initTileLand.js";
import { BOARD_TYPE_SVG, BOARD_TYPE_CANVAS } from "./constants.js";

const app = document.getElementById("app");
const btnSwitchGroup = document.getElementById("btnSwitchGroup");
const loadSVGBoardButton = document.getElementById("loadSVG");
const loadCanvasBoardButton = document.getElementById("loadCanvas");

async function loadBoard(type = BOARD_TYPE_CANVAS) {
  app.innerHTML = "";

  const html = await fetch("partials/tileLandCanvas.html").then((r) =>
    r.text()
  );

  app.innerHTML = html;
  initTileLand(type);
}

function toggleButtons(button) {
  btnSwitchGroup
    .querySelector(".btn-switch--active")
    .classList.remove("btn-switch--active");
  button.classList.add("btn-switch--active");
}

loadCanvasBoardButton.addEventListener("click", (e) => {
	toggleButtons(e.target);
	loadBoard(BOARD_TYPE_CANVAS);
});
loadSVGBoardButton.addEventListener("click", (e) => {
  toggleButtons(e.target);
  loadBoard(BOARD_TYPE_SVG);
});

loadBoard(BOARD_TYPE_CANVAS);