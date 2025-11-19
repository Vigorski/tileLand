import { exponentialDecay, roundTwoDecimal } from "./helpers.js";
import {
  HOVER_ENGAGED,
  HOVER_RADIUS,
  SCALE_EXP_INITIAL,
  SCALE_EXP_DECAY,
  PUSH_OFF_EXP_DECAY,
  PUSH_OFF_EXP_INITIAL,
  COLOR_INACTIVE_SVG,
  COLOR_DECAY,
  COLOR_INITIAL,
  COLOR_FOCUS_SVG,
  WAVE_INCREMENT,
  TILE_SIZE_PIXELS,
} from "./constants.js";

export default class TileLand {
  constructor(container, options = {}) {
    const {
			tilePixelSize = TILE_SIZE_PIXELS,
      tileWidth = 1,
      hoverEngaged = HOVER_ENGAGED,
      hoverRadius = HOVER_RADIUS,
      scaleExpDecay = SCALE_EXP_DECAY,
      pushoffExpInitial = PUSH_OFF_EXP_INITIAL,
      pushoffExpDecay = PUSH_OFF_EXP_DECAY,
      monitor = null,
    } = options;

    this.monitor = monitor;
    this.svg = "http://www.w3.org/2000/svg";
    this.container = container;
		this.tilePixelSize = tilePixelSize;
    this.columns = this.getColumns();
    this.rows = this.getRows();
    this.tileState = new Array();
    this.tileWidth = tileWidth ?? 1;
    this.tileOffset = this.tileWidth / 2;
    this.tileStrokeWidth = this.tileWidth / this.columns;
    this.baseSVG = this.createBaseSVG();
    this.allTiles = this.baseSVG.querySelectorAll(".cascade-waves__tile");
    this.boardXCenter = Math.floor(this.columns / 2);
    this.boardYCenter = Math.floor(this.rows / 2);
    this.isPaused = false;
		this.animationFrameId = null;

    // wave options
    this.waveIncrement = WAVE_INCREMENT;
		this.activeWaves = [];

    // hover options
    this.hoverEngaged = hoverEngaged;
    this.hoverRadius = hoverRadius;
    this.colorGray = COLOR_INACTIVE_SVG;
    this.colorThreshold = COLOR_FOCUS_SVG;
    this.colorInitial = COLOR_INITIAL;
    this.colorDecay = COLOR_DECAY;
    this.pushoffExpInitial = pushoffExpInitial;
    this.pushoffExpDecay = pushoffExpDecay;
    this.scaleExpInitial = SCALE_EXP_INITIAL;
    this.scaleExpDecay = scaleExpDecay;

    this.addHoverEvent();
		this.loop();
  }

	getColumns() {
		const containerWidth = this.container.offsetWidth;
		return Math.round(containerWidth / this.tilePixelSize);
	}
	
	getRows() {
		const containerHeight = this.container.offsetHeight;
		return Math.round(containerHeight / this.tilePixelSize);
	}

  // o = center, r = radius, a = opposite side, b = adjacent side, c = hypotenuse
  createBaseSVG() {
    // create baseSVG
    const baseSVG = document.createElementNS(this.svg, "svg");
    baseSVG.setAttribute("width", "100%");
	 	baseSVG.setAttribute("height", "100%");
    baseSVG.setAttribute(
      "viewBox",
      `-${this.tileOffset} -${this.tileOffset} ${this.columns} ${this.rows}`
    );
    baseSVG.setAttribute("class", "cascade-waves");

    // create root grid parent group
    // this is used to trigger correct events and acts as an accurate coordinate system
    const rootGrid = document.createElementNS(this.svg, "g");
    rootGrid.setAttribute("class", "cascade-waves__root-grid");

    // create tiles wrapper
    const tilesWrapper = document.createElementNS(this.svg, "g");
    tilesWrapper.setAttribute("class", "cascade-waves__tiles");

    // gennerate all tiles
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        rootGrid.appendChild(this.createRootTile(x, y));
        tilesWrapper.appendChild(this.createTile(x, y));
      }
    }

    baseSVG.appendChild(tilesWrapper);
    baseSVG.appendChild(rootGrid);
    this.container.appendChild(baseSVG);

		// Attach the wave event to root grid
    baseSVG.addEventListener("click", (e) => {
      if (e.target.classList.contains("cascade-waves__root-tile")) {
        const [x, y] = e.target.dataset.pos.split(",").map(Number);
        const o = { x: x, y: y };

        this.incrementWaveRadius(o);
      }
    });

    return baseSVG;
  }

  createTile(x, y) {
    // create group wrapper for tiles
    const rectGroup = document.createElementNS(this.svg, "g");
    rectGroup.setAttributeNS(null, "transform", `translate(${x}, ${y})`);
    rectGroup.setAttribute("class", "cascade-waves__tile");

    // create tile
    const rect = document.createElementNS(this.svg, "rect");
    rect.setAttributeNS(null, "width", this.tileWidth);
    rect.setAttributeNS(null, "height", this.tileWidth);
    // make center of tile the starting coordinate points
    // ex: if tile width is 1, x should be -0.5
    rect.setAttributeNS(null, "x", -this.tileOffset);
    rect.setAttributeNS(null, "y", -this.tileOffset);
    rect.setAttributeNS(null, "stroke-width", this.tileStrokeWidth);

    rectGroup.appendChild(rect);

    // update tileState with this tile
    this.setTileState(x, y, rect);

    return rectGroup;
  }

  createRootTile(x, y) {
    const rect = document.createElementNS(this.svg, "rect");
    rect.setAttributeNS(null, "x", x);
    rect.setAttributeNS(null, "y", y);
    rect.setAttributeNS(null, "width", this.tileWidth);
    rect.setAttributeNS(null, "height", this.tileWidth);
    // make center of tile the starting coordinate points
    // ex: if tile width is 1, x should be -0.5
    rect.setAttributeNS(
      null,
      "transform",
      `translate(${-this.tileOffset}, ${-this.tileOffset})`
    );
    rect.setAttribute("class", "cascade-waves__root-tile");
    rect.dataset.pos = [x, y];

    return rect;
  }

	loop() {
    if (this.isPaused) return;
    if (this.monitor) this.monitor.begin();

		this.drawWavesAction();

    if (this.monitor) this.monitor.end();

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  pause() {
    if (this.baseSVG) {
      this.baseSVG.style.display = "none";
    }
    this.isPaused = true;

		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
  }

  resume() {
    if (this.baseSVG) {
      this.baseSVG.style.display = "block";
    }

    this.isPaused = false;
		this.loop();
  }

  destroyBoard() {
		this.pause();
    if (this.baseSVG) {
      this.container.removeChild(this.baseSVG);
      this.baseSVG = null;
    }
  }

  resetBoard() {
    this.destroyBoard();
		this.columns = this.getColumns();
		this.rows = this.getRows();
		this.boardXCenter = Math.floor(this.columns / 2);
		this.boardYCenter = Math.floor(this.rows / 2);
    this.baseSVG = this.createBaseSVG();
    this.hoverEngaged = HOVER_ENGAGED;
    this.addHoverEvent();
    this.hoverRadius = HOVER_RADIUS;
    this.pushoffExpInitial = PUSH_OFF_EXP_INITIAL;
    this.pushoffExpDecay = PUSH_OFF_EXP_DECAY;
    this.scaleExpDecay = SCALE_EXP_DECAY;
    this.scaleExpInitial = SCALE_EXP_INITIAL;
		this.isPaused = false;
    this.loop();
  }

  returnTilesToDefault() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        const tile = this.tileState[y]?.[x];
        if (!tile) continue;

        tile.hovered = false;
        tile.element.style.transform = "scale(1)";
        tile.element.style.fill = "#433e42";
      }
    }
  }

  incrementWaveRadius(o) {
    this.activeWaves.push({
			origin: o,
			radius: 0
		});
  }

	drawWavesAction() {
    if (this.activeWaves.length === 0) return;

    this.activeWaves.forEach((wave) => {
        wave.radius += this.waveIncrement;
        this.loopThroughTiles(wave.origin, wave.radius);
    });

    const maxRadius = this.columns + this.boardXCenter;
    this.activeWaves = this.activeWaves.filter(
        (wave) => wave.radius < maxRadius
    );
	}

  loopThroughTiles(o, r) {
    //////////////////////////////////////
    // Select 8 tiles at a time at the outline of the circle
    // Here we draw 8 tiles at a time, so we only need 45deg of the entire circle
    // maxIteration = x = y of a 45deg triangle or its the number of times we need to redraw x8 tiles to make a full circle
    //////////////////////////////////////

    const cosinus = Math.cos(this.toRadians(45));
    const maxIterations = Math.floor(r * cosinus);

    for (let y = 0; y <= maxIterations; y++) {
      const x = Math.floor(Math.sqrt(r * r - y * y));
      // draw 4 on horizontal axis
      this.activateTile(o.y + y, o.x - x);
      this.activateTile(o.y + y, o.x + x);
      this.activateTile(o.y - y, o.x - x);
      this.activateTile(o.y - y, o.x + x);
      // draw 4 on vertioal axis
      this.activateTile(o.y + x, o.x - y);
      this.activateTile(o.y + x, o.x + y);
      this.activateTile(o.y - x, o.x - y);
      this.activateTile(o.y - x, o.x + y);
    }
  }

  activateTile(y, x) {
    if (!!this.tileState[y] && !!this.tileState[y][x]) {
      this.tileState[y][x].element.classList.add("cascade-waves__tile--active");

      // Remove animated state of tiles after wave
      this.tileState[y][x].element.addEventListener("animationend", (e) => {
        setTimeout(() => {
          // Must remove class with async because intersecting waves cause a glitch and class remains
          e.target.classList.remove("cascade-waves__tile--active");
        }, 0);
      }, { once: true }); // remove listener after it's been triggered
    }
  }

  ////////////////////////////////////////////
  // Hover effect
  ////////////////////////////////////////////

  addHoverEvent() {
    this.baseSVG.addEventListener("mousemove", (e) => {
      if (!this.hoverEngaged) return;

      const baseSVGRect = this.baseSVG.getBoundingClientRect();
      const baseLeft = Math.floor(baseSVGRect.left);
      const baseTop = Math.floor(baseSVGRect.top);
      // the hover event works with the actual pixels on screen instead of the viewBox of the svg we defined
      // so we must calculate the actual tile width here
      const pixelTileSizeX = baseSVGRect.width / this.columns;
      const pixelTileSizeY = baseSVGRect.height / this.rows;
      const relativeX = (e.clientX - baseLeft) / pixelTileSizeX;
      const relativeY = (e.clientY - baseTop) / pixelTileSizeY;

      const center = {
        x: relativeX - this.tileWidth / 2,
        y: relativeY - this.tileWidth / 2,
      };

      this.tileDislocate(center);
    });
  }

  tileDislocate(center) {
    if (!center) return;

    const o = { x: center.x, y: center.y };

    for (let y = 0; y <= this.rows; y++) {
      for (let x = 0; x <= this.columns; x++) {
        // check if tile exists, else skip to next tile
        const tile = this.tileState[y]?.[x];
        if (!tile) continue;

        const tilePosition = { x: x, y: y };
        const tileElement = tile.element;

        if (this.insideRadius(o, tilePosition, this.hoverRadius)) {
          // define the sides of the triangle made by mouse center and current tile
          const a = x - o.x;
          const b = y - o.y;
          const c = Math.sqrt(a * a + b * b);
          // define dislocation behavior.
          const SCALE_RATE = roundTwoDecimal(
            exponentialDecay(
              this.scaleExpInitial,
              this.scaleExpDecay,
              this.hoverRadius - c
            )
          );
          const PUSH_OFF_RATE = roundTwoDecimal(
            exponentialDecay(
              this.pushoffExpInitial,
              this.pushoffExpDecay,
              c - this.hoverRadius
            )
          );
          const COLOR_RATE = roundTwoDecimal(
            exponentialDecay(
              this.colorInitial,
              this.colorDecay,
              c - this.hoverRadius
            )
          );

          // define new color based on predefined color threshold
          // the threshold is the difference between the purple color being used on wave tiles and the neutral gray color
          const newColorFill = [
            Math.round(this.colorGray[0] + this.colorThreshold[0] * COLOR_RATE),
            Math.round(this.colorGray[1] - this.colorThreshold[1] * COLOR_RATE),
            Math.round(this.colorGray[2] + this.colorThreshold[2] * COLOR_RATE),
          ];

          this.tileState[y][x].hovered = true;
          // by subtracting tile position from event center, we get the correct position for movement on the coordinate system -> a = x - o.x
          tileElement.style.transform = `translate(${a * PUSH_OFF_RATE}px, ${
            b * PUSH_OFF_RATE
          }px) scale(${SCALE_RATE})`;
          tileElement.style.fill = `rgb(${newColorFill[0]}, ${newColorFill[1]}, ${newColorFill[2]})`;
        } else if (this.tileState[y][x].hovered) {
          // back to original tile state
          this.tileState[y][x].hovered = false;
          tileElement.style.transform = `scale(1)`;
          tileElement.style.fill = "#433e42";
        }
      }
    }
  }

  activateHoverInCenter() {
    const center = {
      x: this.boardXCenter,
      y: this.boardYCenter,
    };
    this.tileDislocate(center);
  }

  ////////////////////////////////////////////
  // Utility methods
  ////////////////////////////////////////////

  setTileState(x, y, rect) {
    if (!this.tileState[y]) {
      this.tileState[y] = new Array();
    }

    this.tileState[y][x] = {
      x,
      y,
      element: rect,
      hovered: false,
    };
  }

  insideRadius(o, tilePosition, r) {
    const a = o.x - tilePosition.x;
    const b = o.y - tilePosition.y;
    const c = Math.sqrt(a * a + b * b);
    return c <= r;
  }

  toRadians(angle) {
    return angle * (Math.PI / 180);
  }
}
