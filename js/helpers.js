export function debounce (func, limit) {
	let lastFunc;
	const context = this;
	return function(...args) {
		clearTimeout(lastFunc);
		lastFunc = setTimeout(() => {
			func.apply(context, args)
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