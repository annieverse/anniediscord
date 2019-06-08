
/* eslint-disable  */
const assert = require(`assert`);
const env = require(`../.data/environment.json`);

describe(`Initial check-up`, () => {

    //  Check token availability.
    it(`Token validation`, () => {
        assert.ok(process.env.TOKEN ? process.env.TOKEN : env.temp_token);
    })

})
