
/* eslint-disable  */
const expect = require(`chai`).expect;
const env = require(`../.data/environment.json`);
const pkg = require(`../package.json`);

describe(`Initial check-up`, () => {

    //  Check for current version.
    it(`${pkg.name} version should be above 3.x.x`, () => {
        expect(parseInt(pkg.version)).to.be.above(3, `Outdated API`);
    })


    //  Check token availability.
    it(`Token validation`, () => {
        expect(process.env.TOKEN ? process.env.TOKEN : env.temp_token).to.not.be.undefined;
    })

})
