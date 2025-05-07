const requestAnimationFrame =
	window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

export default class TileLand {
	constructor(container, options = {}) {
		const {
			columns,
			tileWidth,
			tileOffset,
			tileStrokeWidth,
			waveIncrement,
			hoverRadius,
			hoverEngaged,
			scaleExpInitial,
			scaleExpDecay,
			pushoffExpInitial,
			pushoffExpDecay,
		} = options;

		this.svg = 'http://www.w3.org/2000/svg';
		this.container = container;
		this.columns = columns ?? 25;
		this.tileState = new Array();
		this.tileWidth = tileWidth ?? 1;
		this.tileOffset = tileOffset ?? this.tileWidth / 2;
		this.tileStrokeWidth = tileStrokeWidth ?? this.tileWidth / this.columns;
		this.baseSVG = this.createBaseSVG();
		this.allTiles = this.baseSVG.querySelectorAll('.cascade-waves__tile');
		this.radiusNear = this.columns / 2;
		this.radiusFar = this.columns * 2;

		// wave options
		this.waveIncrement = waveIncrement ?? 0.5;

		// hover options
		this.hoverEngaged = hoverEngaged ?? false;
		this.hoverRadius = hoverRadius ?? 3.5;
		this.colorGray = [67, 62, 66];
		this.colorThreshold = [104, 37, 184];
		this.colorInitial = 0.25;
		this.colorDecay = 0.6;
		this.pushoffExpInitial = pushoffExpInitial ?? 0.1;
		this.pushoffExpDecay = pushoffExpDecay ?? 0.6;
		this.scaleExpInitial = scaleExpInitial ?? 1;
		this.scaleExpDecay = scaleExpDecay ?? 0.4;

		this.addHoverEvent();
	}

	// o = center, r = radius, a = opposite side, b = adjacent side, c = hypotenuse
	createBaseSVG() {
		// create baseSVG
		const baseSVG = document.createElementNS(this.svg, 'svg');
		baseSVG.setAttribute('width', '100%');
		baseSVG.setAttribute('viewBox', `-${this.tileOffset} -${this.tileOffset} ${this.columns} ${this.columns}`);
		baseSVG.setAttribute('class', 'cascade-waves');

		// create root grid parent group
		// this is used to trigger correct events and acts as an accurate coordinate system
		const rootGrid = document.createElementNS(this.svg, 'g');
		rootGrid.setAttribute('class', 'cascade-waves__root-grid');

		// create tiles wrapper
		const tilesWrapper = document.createElementNS(this.svg, 'g');
		tilesWrapper.setAttribute('class', 'cascade-waves__tiles');

		// gennerate all tiles
		for (let y = 0; y < this.columns; y++) {
			for (let x = 0; x < this.columns; x++) {
				rootGrid.appendChild(this.createRootTile(x, y));
				tilesWrapper.appendChild(this.createTile(x, y));
			}
		}

		baseSVG.appendChild(tilesWrapper);
		baseSVG.appendChild(rootGrid);
		this.container.appendChild(baseSVG);

		return baseSVG;
	}

	createTile(x, y) {
		// create group wrapper for tiles
		const rectGroup = document.createElementNS(this.svg, 'g');
		rectGroup.setAttributeNS(null, 'transform', `translate(${x}, ${y})`);
		rectGroup.setAttribute('class', 'cascade-waves__tile');

		// create tile
		const rect = document.createElementNS(this.svg, 'rect');
		rect.setAttributeNS(null, 'width', this.tileWidth);
		rect.setAttributeNS(null, 'height', this.tileWidth);
		// make center of tile the starting coordinate points
		// ex: if tile width is 1, x should be -0.5
		rect.setAttributeNS(null, 'x', -this.tileOffset);
		rect.setAttributeNS(null, 'y', -this.tileOffset);
		rect.setAttributeNS(null, 'stroke-width', this.tileStrokeWidth);
		
		rectGroup.appendChild(rect);

		// update tileState with this tile
		this.setTileState(x, y, rect);

		return rectGroup;
	}

	createRootTile(x, y) {
		const rect = document.createElementNS(this.svg, 'rect');
		rect.setAttributeNS(null, 'x', x);
		rect.setAttributeNS(null, 'y', y);
		rect.setAttributeNS(null, 'width', this.tileWidth);
		rect.setAttributeNS(null, 'height', this.tileWidth);
		// make center of tile the starting coordinate points
		// ex: if tile width is 1, x should be -0.5
		rect.setAttributeNS(null, 'transform', `translate(${-this.tileOffset}, ${-this.tileOffset})`);
		rect.setAttribute('class', 'cascade-waves__root-tile');
		rect.dataset.pos = [x, y];

		//set events for tile
		rect.addEventListener('click', () => {
			// initiate animation with requestAnimationFrame once here but
			// requestAnimationFrame must be called again recursively within the called function
			const o = { x: x, y: y };
			const increment = this.incrementWaveRadius(o);
			requestAnimationFrame(() => increment());
		});

		return rect;
	}

	destroyBoard() {
		if (this.baseSVG) {
			this.container.removeChild(this.baseSVG);
			this.baseSVG = null;
		}
	}

	resetBoard() {
		this.destroyBoard();
		this.baseSVG = this.createBaseSVG();
		this.addHoverEvent();
	}

	incrementWaveRadius(o) {
		const _this = this;
		let waveRadius = 0;

		return function increment(center = o) {
			waveRadius += _this.waveIncrement;
			_this.loopThroughTiles(center, waveRadius);

			// if r grows half more than current columns, stop wave iteration
			if (waveRadius > _this.columns + _this.radiusNear) return;

			requestAnimationFrame(() => increment());
		};
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
			this.tileState[y][x].element.classList.add('cascade-waves__tile--active');

			// Remove animated state of tiles after wave
			this.tileState[y][x].element.addEventListener('animationend', (e) => {
				setTimeout(() => {
					// Must remove class with async because intersecting waves cause a glitch and class remains
					e.target.classList.remove('cascade-waves__tile--active');
				}, 0)
			});
		}
	}

	////////////////////////////////////////////
	// Hover effect
	////////////////////////////////////////////

	addHoverEvent() {
		this.baseSVG.addEventListener('mousemove', (e) => {
			if (!this.hoverEngaged) return;
			this.tileDislocate(e, null);
		});
	}

	tileDislocate(e, fixed) {
		const baseSVGRect = this.baseSVG.getBoundingClientRect();
		const baseLeft = Math.floor(baseSVGRect.left);
		const baseTop = Math.floor(baseSVGRect.top);
		// the hover event works with the actual pixels on screen instead of the viewBox of the svg we defined
		// so we must calculate the actual tile width here
		const pixelTileSize = baseSVGRect.width / this.columns;
		let x, y = null;
		
		if (!!e) {
			// divide by actual tile width (measured in px) in order to get the same coordinate system as baseSVG
			// We need half of tileWidth here to recenter the cursor in the middle of the circle
			const relativeX = (e.clientX - baseLeft) / pixelTileSize;
			const relativeY = (e.clientY - baseTop) / pixelTileSize;

			x = relativeX - (this.tileWidth / 2);
			y = relativeY - (this.tileWidth / 2);
		} else {
			x = y = fixed;
		}

		const o = { x: x, y: y };
		
		for (let x = 0; x <= this.columns; x++) {
			for (let y = 0; y <= this.columns; y++) {
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
					const SCALE_RATE = this.roundTwoDecimal(this.exponentialDecay(this.scaleExpInitial, this.scaleExpDecay, this.hoverRadius - c));
					const PUSH_OFF_RATE = this.roundTwoDecimal(this.exponentialDecay(this.pushoffExpInitial, this.pushoffExpDecay, c - this.hoverRadius));
					const COLOR_RATE = this.roundTwoDecimal(this.exponentialDecay(this.colorInitial, this.colorDecay, c - this.hoverRadius));

					// define new color based on predefined color threshold
					// the threshold is the difference between the purple color being used on wave tiles and the neutral gray color
					const newColorFill = [
						Math.round(this.colorGray[0] + this.colorThreshold[0] * COLOR_RATE),
						Math.round(this.colorGray[1] - this.colorThreshold[1] * COLOR_RATE),
						Math.round(this.colorGray[2] + this.colorThreshold[2] * COLOR_RATE),
					];

					this.tileState[y][x].hovered = true;
					// by subtracting tile position from event center, we get the correct position for movement on the coordinate system -> a = x - o.x
					tileElement.style.transform = `translate(${a * PUSH_OFF_RATE}px, ${b * PUSH_OFF_RATE}px) scale(${SCALE_RATE})`;
					tileElement.style.fill = `rgb(${newColorFill[0]}, ${newColorFill[1]}, ${newColorFill[2]})`;
				} else if (this.tileState[y][x].hovered) {
					// back to original tile state
					this.tileState[y][x].hovered = false;
					tileElement.style.transform = `scale(1)`;
					tileElement.style.fill = '#433e42';
				}
			}
		}
	}

	hoverUpdate(checked) {
		checked ? this.tileDislocate(null, this.radiusNear) : this.tileDislocate(null, this.radiusFar);
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
			hovered: false
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

	debounce (func, limit) {
		let lastFunc;
		const context = this;
		return function(...args) {
			clearTimeout(lastFunc);
			lastFunc = setTimeout(() => {
				func.apply(context, args)
			}, limit);
		}
	}

	roundTwoDecimal(value) {
		return Math.round((value + Number.EPSILON) * 100) / 100;
	}

	exponentialDecay(initialValue, decay, time) {
		// a(1-b)x -> wherein a is the original amount, b is the decay factor, and x is the amount of time that has passed.
		return initialValue * Math.pow(1 - decay, time);
	}
}
