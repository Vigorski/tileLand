export default class TileLandCanvas {
	constructor(container, options = {}) {
		const {
			columns = 25,
			tilePixelSize = 20,
			waveIncrement = 0.5,
			hoverRadius = 3.5,
			scaleExpInitial = 1,
			scaleExpDecay = 0.4,
			pushoffExpInitial = 0.1,
			pushoffExpDecay = 0.6,
			colorGray = [67, 62, 66],
			colorThreshold = [104, 37, 184],
			colorInitial = 0.25,
			colorDecay = 0.6,
		} = options;

		this.container = container;
		this.columns = columns;
		this.tilePixelSize = tilePixelSize;
		this.hoverRadius = hoverRadius;
		this.waveIncrement = waveIncrement;

		this.scaleExpInitial = scaleExpInitial;
		this.scaleExpDecay = scaleExpDecay;
		this.pushoffExpInitial = pushoffExpInitial;
		this.pushoffExpDecay = pushoffExpDecay;
		this.colorGray = colorGray;
		this.colorThreshold = colorThreshold;
		this.colorInitial = colorInitial;
		this.colorDecay = colorDecay;

		this.radiusNear = this.columns / 2;
		this.radiusFar = this.columns * 2;

		this.tileState = [];
		this.createCanvas();
		this.generateTiles();
		this.addHoverEvent();
		this.draw();
	}

	createCanvas() {
		this.canvas = document.createElement('canvas');
		this.ctx = this.canvas.getContext('2d');
		this.canvas.width = this.columns * this.tilePixelSize;
		this.canvas.height = this.columns * this.tilePixelSize;
		this.container.appendChild(this.canvas);
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

	addHoverEvent() {
		this.canvas.addEventListener('mousemove', (e) => {
			const rect = this.canvas.getBoundingClientRect();
			const mouseX = (e.clientX - rect.left) / this.tilePixelSize;
			const mouseY = (e.clientY - rect.top) / this.tilePixelSize;
			this.tileDislocate({ x: mouseX, y: mouseY });
		});
	}

	tileDislocate(o) {
		for (let y = 0; y < this.columns; y++) {
			for (let x = 0; x < this.columns; x++) {
				const tile = this.tileState[y][x];
				const dx = x - o.x;
				const dy = y - o.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist <= this.hoverRadius) {
					const scale = this.exponentialDecay(this.scaleExpInitial, this.scaleExpDecay, this.hoverRadius - dist);
					const push = this.exponentialDecay(this.pushoffExpInitial, this.pushoffExpDecay, dist - this.hoverRadius);
					const colorRate = this.exponentialDecay(this.colorInitial, this.colorDecay, dist - this.hoverRadius);

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
	// 	const animate = () => {
	// 		waveRadius += this.waveIncrement;
	// 		this.loopThroughTiles(origin, waveRadius);
	// 		if (waveRadius <= this.columns + this.radiusNear) requestAnimationFrame(animate);
	// 	};
	// 	requestAnimationFrame(animate);
	// }

	// loopThroughTiles(o, r) {
	// 	const cos45 = Math.cos(Math.PI / 4);
	// 	const maxIterations = Math.floor(r * cos45);

	// 	for (let y = 0; y <= maxIterations; y++) {
	// 		// draw 4 on the horizontal axis
	// 		this.activateTile(y, -t, o);
	// 		this.activateTile(y, t, o);
	// 		this.activateTile(-y, -t, o);
	// 		this.activateTile(-y, t, o);
	// 		// draw 4 on the vertical axis
	// 		this.activateTile(t, -y, o);
	// 		this.activateTile(t, y, o);
	// 		this.activateTile(-t, -y, o);
	// 		this.activateTile(-t, y, o);
	// 	}
	// }

	// activateTile(dy, dx, o) {
	// 	const tx = o.x + dx;
	// 	const ty = o.y + dy;

	// 	if (this.tileState[ty] && this.tileState[ty][tx]) {
	// 		const tile = this.tileState[ty][tx];
	// 		tile.scale = 1.3;
	// 		tile.color = [205, 145, 255];
	// 	}
	// }

	draw() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		for (let y = 0; y < this.columns; y++) {
			for (let x = 0; x < this.columns; x++) {
				const tile = this.tileState[y][x];
				const isReturning = tile.targetOffsetX === 0 && tile.targetOffsetY === 0;
				const lerpRate = isReturning ? .01 : 0.1;

				tile.currentOffsetX += (tile.targetOffsetX - tile.currentOffsetX) * lerpRate;
				tile.currentOffsetY += (tile.targetOffsetY - tile.currentOffsetY) * lerpRate;
				tile.currentScale += (tile.targetScale - tile.currentScale) * lerpRate;
				
				const px = x * this.tilePixelSize + tile.currentOffsetX;
				const py = y * this.tilePixelSize + tile.currentOffsetY;

				this.ctx.save();
				this.ctx.translate(px + this.tilePixelSize / 2, py + this.tilePixelSize / 2);
				this.ctx.scale(tile.currentScale, tile.currentScale);
				this.ctx.fillStyle = `rgb(${tile.color[0]}, ${tile.color[1]}, ${tile.color[2]})`;
				this.ctx.fillRect(-this.tilePixelSize / 2, -this.tilePixelSize / 2, this.tilePixelSize, this.tilePixelSize);
				const [r, g, b] = tile.color;
				this.ctx.strokeStyle = `rgb(${r + 40}, ${g + 40}, ${b + 40})`;
				this.ctx.lineWidth = 1 / tile.currentScale;
				this.ctx.strokeRect(-this.tilePixelSize / 2, -this.tilePixelSize / 2, this.tilePixelSize, this.tilePixelSize);
				this.ctx.restore();
			}
		}
		requestAnimationFrame(() => this.draw());
	}

	exponentialDecay(initialValue, decay, time) {
		return initialValue * Math.pow(1 - decay, time);
	}
}