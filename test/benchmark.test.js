/* eslint-disable  */
const { expect } = require(`chai`)
const getBenchmark = require(`../src/utils/getBenchmark`)


describe(`Benchmarking`, () => {
    const startTime = process.hrtime()
    const result = getBenchmark(startTime)
    const parsed = result.split(` `)
    it(`displayed in milliseconds`, () => {
        expect(parsed[1]).is.include(`ms`)
    })
    it(`the output should be the nearest to zero`, () => {
        expect(parseInt(parsed[0])).is.equal(0)
    })
})
