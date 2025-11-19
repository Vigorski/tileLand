import { exponentialDecay } from "./helpers.js";
import {
  TILE_SIZE_PIXELS,
  HOVER_ENGAGED,
  HOVER_RADIUS,
  SCALE_EXP_INITIAL,
  SCALE_EXP_DECAY,
  PUSH_OFF_EXP_DECAY,
  PUSH_OFF_EXP_INITIAL,
  COLOR_INACTIVE_CANVAS,
  COLOR_DECAY,
  COLOR_INITIAL,
  COLOR_FOCUS_CANVAS,
  ACTIVE_TILE_LERP_RATE,
  RETURNING_TILE_LERP_RATE,
  WAVE_INCREMENT,
  BOARD_TYPE_CANVAS,
} from "./constants.js";

export default class TileLandCanvas {
  constructor(container, options = {}) {
    const {
      tilePixelSize = TILE_SIZE_PIXELS,
      hoverEngaged = HOVER_ENGAGED,
      hoverRadius = HOVER_RADIUS,
      scaleExpDecay = SCALE_EXP_DECAY,
      pushoffExpInitial = PUSH_OFF_EXP_INITIAL,
      pushoffExpDecay = PUSH_OFF_EXP_DECAY,
      colorInactive = COLOR_INACTIVE_CANVAS,
      colorFocus = COLOR_FOCUS_CANVAS,
      monitor = null,
    } = options;

    this.boardType = BOARD_TYPE_CANVAS;
    this.monitor = monitor;
    this.isPaused = false;
    this.animationFrameId = null;
    this.container = container;
    this.tilePixelSize = tilePixelSize;
    this.tileOffset = 0.5; // Tiles are whole numbers. Half of the tile size to center the mouse cursor on the tile.
    this.hoverEngaged = hoverEngaged;
    this.hoverRadius = hoverRadius;
    this.waveIncrement = WAVE_INCREMENT;

    this.activeTileLerpRate = ACTIVE_TILE_LERP_RATE;
    this.returningTileLerpRate = RETURNING_TILE_LERP_RATE;

    this.scaleExpInitial = SCALE_EXP_INITIAL;
    this.scaleExpDecay = scaleExpDecay;
    this.pushoffExpInitial = pushoffExpInitial;
    this.pushoffExpDecay = pushoffExpDecay;
    this.colorInactive = colorInactive;
    this.colorFocus = colorFocus;
    this.colorInitial = COLOR_INITIAL;
    this.colorDecay = COLOR_DECAY;

    this.columns = this.getColumns();
    this.rows = this.getRows();
		this.flatTiles = [];
		this.baseTiles = [];
		this.pushedTiles = [];
    this.boardXCenter = Math.floor(this.columns / 2);
    this.boardYCenter = Math.floor(this.rows / 2);

    this.tileState = [];
    this.activeWaves = [];
    this.mouseCoordinates = {
      mouseX: 0,
      mouseY: 0,
    };
    this.createCanvas();
    this.generateTiles();
		this.flattenTiles();
    this.addHoverEvent();
    this.draw();
  }

  getColumns() {
    const containerWidth = document.getElementById("boardWrapper").offsetWidth;
    return Math.round(containerWidth / this.tilePixelSize);
  }

  getRows() {
		const containerHeight = document.getElementById("boardWrapper").offsetHeight;
    return Math.round(containerHeight / this.tilePixelSize);
  }

  createCanvas() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = this.columns * this.tilePixelSize;
    this.canvas.height = this.rows * this.tilePixelSize;
    this.container.appendChild(this.canvas);

    this.canvas.addEventListener("click", () => {
      const o = {
        x: Math.floor(this.mouseCoordinates.mouseX),
        y: Math.floor(this.mouseCoordinates.mouseY),
      };
      this.incrementWaveRadius(o);
    });
  }

  generateTiles() {
    for (let y = 0; y < this.rows; y++) {
      this.tileState[y] = [];
      for (let x = 0; x < this.columns; x++) {
        this.tileState[y][x] = {
          x,
          y,
          hovered: false,
          targetOffsetX: 0,
          targetOffsetY: 0,
          currentOffsetX: 0,
          currentOffsetY: 0,
					baseCenterX: x * this.tilePixelSize + this.tilePixelSize / 2,
					baseCenterY: y * this.tilePixelSize + this.tilePixelSize / 2,
          targetScale: 1,
          currentScale: 1,
          color: [...this.colorInactive],
          waveActive: false,
          waveTTL: 0,
        };
      }
    }
  }

	flattenTiles() {
		const total = this.columns * this.rows;
    this.flatTiles = new Array(total);
		this.baseTiles.length = 0;
		this.pushedTiles.length = 0;

    let index = 0;
    for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.columns; x++) {
            this.flatTiles[index++] = this.tileState[y][x];
        }
    }
	}

  setMouseCanvasCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / this.tilePixelSize;
    const mouseY = (e.clientY - rect.top) / this.tilePixelSize;

    this.mouseCoordinates.mouseX = mouseX;
    this.mouseCoordinates.mouseY = mouseY;
  }

  addHoverEvent() {
    this.canvas.addEventListener("mousemove", (e) => {
      this.setMouseCanvasCoordinates(e);

      if (this.hoverEngaged) {
        this.tileDislocate({
          x: this.mouseCoordinates.mouseX - this.tileOffset,
          y: this.mouseCoordinates.mouseY - this.tileOffset,
        });
      }
    });
  }

  tileDislocate(o) {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        const tile = this.tileState[y][x];
        const dx = x - o.x;
        const dy = y - o.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= this.hoverRadius) {
          const scale = exponentialDecay(
            this.scaleExpInitial,
            this.scaleExpDecay,
            this.hoverRadius - dist
          );
          const push = exponentialDecay(
            this.pushoffExpInitial,
            this.pushoffExpDecay,
            dist - this.hoverRadius
          );
          const colorRate = exponentialDecay(
            this.colorInitial,
            this.colorDecay,
            dist - this.hoverRadius
          );

          tile.hovered = true;
          tile.targetOffsetX = dx * push * this.tilePixelSize;
          tile.targetOffsetY = dy * push * this.tilePixelSize;
          tile.targetScale = scale;
          tile.color = [
            Math.round(this.colorInactive[0] + this.colorFocus[0] * colorRate),
            Math.round(this.colorInactive[1] + this.colorFocus[1] * colorRate),
            Math.round(this.colorInactive[2] + this.colorFocus[2] * colorRate),
          ];
        } else if (tile.hovered) {
          tile.hovered = false;
          tile.targetScale = 1;
          tile.targetOffsetX = 0;
          tile.targetOffsetY = 0;
          tile.color = [...this.colorInactive];
        }
      }
    }
  }

  incrementWaveRadius(origin) {
    this.activeWaves.push({
      origin,
      radius: 0,
    });
  }

  loopThroughTiles(o, r) {
    //////////////////////////////////////
    // Select 8 tiles at a time at the outline of the circle
    // Here we draw 8 tiles at a time, so we only need 45deg of the entire circle
    // maxIteration = x = y of a 45deg triangle or its the number of times we need to redraw x8 tiles to make a full circle
    //////////////////////////////////////

    const cos45 = Math.cos(Math.PI / 4);
    const maxIterations = Math.floor(r * cos45);

    for (let y = 0; y <= maxIterations; y++) {
      const x = Math.floor(Math.sqrt(r * r - y * y));
      // draw 4 on the horizontal axis
      this.activateTile(y, -x, o);
      this.activateTile(y, x, o);
      this.activateTile(-y, -x, o);
      this.activateTile(-y, x, o);
      // draw 4 on the vertical axis
      this.activateTile(x, -y, o);
      this.activateTile(x, y, o);
      this.activateTile(-x, -y, o);
      this.activateTile(-x, y, o);
    }
  }

  activateTile(dy, dx, o) {
    const tx = o.x + dx;
    const ty = o.y + dy;
    const tile = this.tileState[ty] && this.tileState[ty][tx];

    if (tile) {
      tile.targetScale = 0;
      tile.color = this.colorFocus;
      tile.waveActive = true;
      tile.waveTTL = 8;
    }
  }

  activateHoverInCenter() {
    const center = {
      x: this.boardXCenter,
      y: this.boardYCenter,
    };
    this.tileDislocate(center);
  }

  resetBoard() {
    this.tileState = [];
    this.columns = this.getColumns();
    this.rows = this.getRows();
    this.canvas.width = this.columns * this.tilePixelSize;
    this.canvas.height = this.rows * this.tilePixelSize;
    this.hoverEngaged = HOVER_ENGAGED;
    this.hoverRadius = HOVER_RADIUS;
    this.pushoffExpInitial = PUSH_OFF_EXP_INITIAL;
    this.pushoffExpDecay = PUSH_OFF_EXP_DECAY;
    this.scaleExpDecay = SCALE_EXP_DECAY;
    this.generateTiles();
    this.flattenTiles();
  }

  returnTilesToDefault() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        const tile = this.tileState[y][x];

        tile.hovered = false;
        tile.targetOffsetX = 0;
        tile.targetOffsetY = 0;
        tile.targetScale = 1;
        tile.color = [...this.colorInactive];
      }
    }
  }

  pause() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.canvas.style.display = "none";
    this.isPaused = true;
  }

  resume() {
    this.canvas.style.display = "block";
    this.isPaused = false;
    this.draw();
  }

  destroyBoard() {
    this.pause();
    this.canvas.replaceWith(this.canvas.cloneNode(true));
    this.canvas.remove();
  }

	drawTile(tile) {
		// Interpolation
		const isReturning = tile.targetOffsetX === 0 && tile.targetOffsetY === 0;
		const lerpRate = isReturning
			? this.returningTileLerpRate
			: this.activeTileLerpRate;

		if (tile.waveActive) {
			tile.waveTTL -= 1;

			if (tile.waveTTL <= 0) {
				tile.waveActive = false;
				tile.targetScale = 1;
				tile.color = [...this.colorInactive];
			}
		}

		tile.currentOffsetX += (tile.targetOffsetX - tile.currentOffsetX) * lerpRate;
		tile.currentOffsetY += (tile.targetOffsetY - tile.currentOffsetY) * lerpRate;
		tile.currentScale += (tile.targetScale - tile.currentScale) * lerpRate;

		// tile's center in screen coords
		const cx = tile.baseCenterX + tile.currentOffsetX;
		const cy = tile.baseCenterY + tile.currentOffsetY;

		// scaled dimensions
		const half = (this.tilePixelSize * tile.currentScale) / 2;

		const left = cx - half;
		const top = cy - half;
		const size = half * 2;

		// Fill
		const [r, g, b] = tile.color;
		this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
		this.ctx.fillRect(left, top, size, size);

		// Border
		const thickness = 1;
		this.ctx.fillStyle = `rgb(${r - 40}, ${g - 40}, ${b - 40})`;
		// top border
		this.ctx.fillRect(left, top, size, thickness);
		// bottom border
		this.ctx.fillRect(left, top + size - thickness, size, thickness);
		// left border
		this.ctx.fillRect(left, top, thickness, size);
		// right border
		this.ctx.fillRect(left + size - thickness, top, thickness, size);
	};

	drawWavesAction() {
		this.activeWaves.forEach((wave) => {
      wave.radius += this.waveIncrement;
      this.loopThroughTiles(wave.origin, wave.radius);
    });

    this.activeWaves = this.activeWaves.filter(
      (wave) => wave.radius < this.columns + this.boardXCenter
    );
	}

	drawHoverAction() {
		this.baseTiles.length = 0;
		this.pushedTiles.length = 0;

		for (let i = 0; i < this.flatTiles.length; i++) {
			const tile = this.flatTiles[i];
			
			const pushAmount = tile.targetOffsetX + tile.targetOffsetY;
	
			if (pushAmount !== 0 || tile.waveActive) {
					this.pushedTiles.push(tile);
			} else {
					this.baseTiles.push(tile);
			}
		}
		
		this.baseTiles.forEach((tile) => this.drawTile(tile));
		this.pushedTiles.forEach((tile) => this.drawTile(tile));
	}

  draw() {
		if (this.monitor) this.monitor.begin();

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawWavesAction();
    this.drawHoverAction();

		if (this.monitor) this.monitor.end();

    this.animationFrameId = requestAnimationFrame(() => this.draw());
  }
}
