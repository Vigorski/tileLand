import { exponentialDecay } from "./helpers.js";
import { tileSize } from "./constants.js";

export default class TileLandCanvas {
	constructor(container, options = {}) {
		const {
			tilePixelSize = tileSize.md,
			hoverEngaged = false,
			hoverRadius = 3.5,
			scaleExpInitial = 1,
			scaleExpDecay = 0.4,
			pushoffExpInitial = 0.1,
			pushoffExpDecay = 0.6,
			colorGray = [67, 62, 66],
			colorThreshold = [104, 37, 184],
			colorInitial = 0.25,
			colorDecay = 0.6,
			activeTileLerpRate = .1,
			returningTileLerpRate = .01
		} = options;

		this.container = container;
		this.tilePixelSize = tilePixelSize;
		this.hoverEngaged = hoverEngaged;
		this.hoverRadius = hoverRadius;
		this.waveIncrement = 0.5;

		this.activeTileLerpRate = activeTileLerpRate;
		this.returningTileLerpRate = returningTileLerpRate;

		this.scaleExpInitial = scaleExpInitial;
		this.scaleExpDecay = scaleExpDecay;
		this.pushoffExpInitial = pushoffExpInitial;
		this.pushoffExpDecay = pushoffExpDecay;
		this.colorGray = colorGray;
		this.colorThreshold = colorThreshold;
		this.colorInitial = colorInitial;
		this.colorDecay = colorDecay;
		this.boundHandleHover = this.handleHover.bind(this);

		this.aspectRatio = 9 / 16;
		this.columns = this.getColumns();
		this.rows = this.getRows();
		this.radiusNear = this.columns / 2;
		this.radiusFar = this.columns * 2;

		this.tileState = [];
		this.createCanvas();
		this.generateTiles();
		this.hoverEngaged && this.addHoverEvent();
		this.draw();
	}

	getColumns() {
		const containerWidth = document.getElementById('boardWrapper').offsetWidth;
		return Math.round(containerWidth / this.tilePixelSize);
	}

	getRows() {
		return Math.round(this.columns * this.aspectRatio);
	}

	createCanvas() {
		this.canvas = document.createElement('canvas');
		this.ctx = this.canvas.getContext('2d');
		this.canvas.width = this.columns * this.tilePixelSize;
		this.canvas.height = this.rows * this.tilePixelSize;
		this.container.appendChild(this.canvas);

		// this.canvas.addEventListener('click', (e) => {
		// 	const [mouseX, mouseY] = this.getMouseCanvasCoordinates(e);
		// 	const o = { x: Math.floor(mouseX), y: Math.floor(mouseY) };
		// 	this.incrementWaveRadius(o);
		// });
	}

	generateTiles() {
		for (let y = 0; y < this.columns; y++) {
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
					targetScale: 1,
					currentScale: 1,
					color: [...this.colorGray]
				};
			}
		}
	}

	getMouseCanvasCoordinates(e) {
		const rect = this.canvas.getBoundingClientRect();
		const mouseX = (e.clientX - rect.left) / this.tilePixelSize;
		const mouseY = (e.clientY - rect.top) / this.tilePixelSize;

		return [mouseX, mouseY];
	}

	handleHover(e) {
		const [mouseX, mouseY] = this.getMouseCanvasCoordinates(e);
		this.tileDislocate({ x: mouseX, y: mouseY });
	}

	addHoverEvent() {
		this.canvas.addEventListener('mousemove', this.boundHandleHover);
	}

	removeHoverEvent() {
		this.canvas.removeEventListener('mousemove', this.boundHandleHover);
	}

	tileDislocate(o) {
		for (let y = 0; y < this.columns; y++) {
			for (let x = 0; x < this.columns; x++) {
				const tile = this.tileState[y][x];
				const dx = x - o.x;
				const dy = y - o.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist <= this.hoverRadius) {
					const scale = exponentialDecay(this.scaleExpInitial, this.scaleExpDecay, this.hoverRadius - dist);
					const push = exponentialDecay(this.pushoffExpInitial, this.pushoffExpDecay, dist - this.hoverRadius);
					const colorRate = exponentialDecay(this.colorInitial, this.colorDecay, dist - this.hoverRadius);

					tile.hovered = true;
					tile.targetOffsetX = dx * push * this.tilePixelSize;
					tile.targetOffsetY = dy * push * this.tilePixelSize;
					tile.targetScale = scale;
					tile.color = [
						Math.round(this.colorGray[0] + this.colorThreshold[0] * colorRate),
						Math.round(this.colorGray[1] - this.colorThreshold[1] * colorRate),
						Math.round(this.colorGray[2] + this.colorThreshold[2] * colorRate),
					];
				} else if (tile.hovered) {
					tile.hovered = false;
					tile.targetScale = 1;
					tile.targetOffsetX = 0;
					tile.targetOffsetY = 0;
					tile.color = [...this.colorGray];
				}
			}
		}
	}

	// incrementWaveRadius(origin) {
	// 	let waveRadius = 0;
	// 	waveRadius += this.waveIncrement;
	// 	this.loopThroughTiles(origin, waveRadius);
	// 	// if (waveRadius <= this.columns + this.radiusNear) {}
	// }

	// loopThroughTiles(o, r) {
	// 	//////////////////////////////////////
	// 	// Select 8 tiles at a time at the outline of the circle
	// 	// Here we draw 8 tiles at a time, so we only need 45deg of the entire circle
	// 	// maxIteration = x = y of a 45deg triangle or its the number of times we need to redraw x8 tiles to make a full circle
	// 	//////////////////////////////////////

	// 	const cos45 = Math.cos(Math.PI / 4);
	// 	const maxIterations = Math.floor(r * cos45);

	// 	for (let y = 0; y <= maxIterations; y++) {
	// 		const x = Math.floor(Math.sqrt(r * r - y * y));
	// 		// draw 4 on the horizontal axis
	// 		this.activateTile(y, -x, o);
	// 		this.activateTile(y, x, o);
	// 		this.activateTile(-y, -x, o);
	// 		this.activateTile(-y, x, o);
	// 		// draw 4 on the vertical axis
	// 		this.activateTile(x, -y, o);
	// 		this.activateTile(x, y, o);
	// 		this.activateTile(-x, -y, o);
	// 		this.activateTile(-x, y, o);
	// 	}
	// }

	// activateTile(dy, dx, o) {
	// 	const tx = o.x + dx;
	// 	const ty = o.y + dy;
	// 	const tile = this.tileState[ty] && this.tileState[ty][tx];

	// 	if (tile) {
	// 		tile.targetScale = 0.2;
	// 		tile.color = [205, 145, 255];
	// 	}
	// }

	resetBoard() {
    this.tileState = [];
		this.columns = this.getColumns();
		this.rows = this.getRows();
    this.canvas.width = this.columns * this.tilePixelSize;
    this.canvas.height = this.rows * this.tilePixelSize;
		this.hoverEngaged && this.addHoverEvent();
    this.generateTiles();
	}

	draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Flatten tile grid into array
    const allTiles = [];
    for (let y = 0; y < this.columns; y++) {
        for (let x = 0; x < this.columns; x++) {
            allTiles.push(this.tileState[y][x]);
        }
    }

    // Sort pushed tiles last in array so as to be drawn last (on top)
    allTiles.sort((a, b) => {
        const aPush = Math.abs(a.currentOffsetX) + Math.abs(a.currentOffsetY);
        const bPush = Math.abs(b.currentOffsetX) + Math.abs(b.currentOffsetY);
        return aPush - bPush;
    });

    allTiles.forEach(tile => {
        // Interpolation
        const isReturning = tile.targetOffsetX === 0 && tile.targetOffsetY === 0;
        const lerpRate = isReturning ? this.returningTileLerpRate : this.activeTileLerpRate;

        tile.currentOffsetX += (tile.targetOffsetX - tile.currentOffsetX) * lerpRate;
        tile.currentOffsetY += (tile.targetOffsetY - tile.currentOffsetY) * lerpRate;
        tile.currentScale += (tile.targetScale - tile.currentScale) * lerpRate;

        const px = tile.x * this.tilePixelSize + tile.currentOffsetX;
        const py = tile.y * this.tilePixelSize + tile.currentOffsetY;

        this.ctx.save();
        this.ctx.translate(px + this.tilePixelSize / 2, py + this.tilePixelSize / 2);
        this.ctx.scale(tile.currentScale, tile.currentScale);

        // Fill
        this.ctx.fillStyle = `rgb(${tile.color[0]}, ${tile.color[1]}, ${tile.color[2]})`;
        this.ctx.fillRect(-this.tilePixelSize / 2, -this.tilePixelSize / 2, this.tilePixelSize, this.tilePixelSize);

				// Stroke
        const [r, g, b] = tile.color;
        this.ctx.strokeStyle = `rgb(${r + 40}, ${g + 40}, ${b + 40})`;
        this.ctx.lineWidth = 1 / tile.currentScale;
        this.ctx.strokeRect(-this.tilePixelSize / 2, -this.tilePixelSize / 2, this.tilePixelSize, this.tilePixelSize);

        this.ctx.restore();
    });

    requestAnimationFrame(() => this.draw());
	}
}