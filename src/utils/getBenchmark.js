module.exports = (measure) => {
    let parsedMeasure = process.hrtime(measure)
    return `${Math.round((parsedMeasure[0] * 1000) + (parsedMeasure[1] / 1e6))} ms`
}