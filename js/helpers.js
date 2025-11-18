export function debounce (func, limit) {
	let lastFunc;

	return function(...args) {
		clearTimeout(lastFunc);
		lastFunc = setTimeout(() => {
			func(...args);
		}, limit);
	}
}

export function exponentialDecay(initialValue, decay, time) {
	// a(1-b)x -> wherein a is the original amount, b is the decay factor, and x is the amount of time that has passed.
	return initialValue * Math.pow(1 - decay, time);
}

export function roundTwoDecimal(value) {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class PerformanceMonitor {
  constructor(onUpdate) {
    this.startTime = 0;
    this.prevTime = performance.now();
    this.frames = 0;
    this.onUpdate = onUpdate || (fps => console.log(`FPS: ${fps}`));
  }

  begin() {
    this.startTime = performance.now();
  }

  end() {
    const time = performance.now();
    this.frames++;

    if (time >= this.prevTime + 1000) {
      const fps = Math.round((this.frames * 1000) / (time - this.prevTime));
      
      this.onUpdate(fps);

      this.prevTime = time;
      this.frames = 0;
    }
  }
}