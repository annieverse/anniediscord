module.exports = (measure) => {
	return `${(measure[0] * 1000) + (measure[1] / 1e6)} ms`
}
