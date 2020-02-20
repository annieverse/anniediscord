const { expect } = require(`chai`)
const Database = require(`../src/struct/database`)
/**
 * @reference ./src/struct/database.js
 */
describe(`Database`, () => {

    it(`connecting to database`, async () => {
        const db = await new Database().connect(`./test/dummy/database.sqlite`, `../../test/dummy/database.sqlite`)
        expect(db.client.driver.open).is.equal(true)
    })

    it(`returns 1 from simple query (SELECT 1)`, async () => {
        const res = await new Database()
        .connect(`./test/dummy/database.sqlite`, `../../test/dummy/database.sqlite`)
        .then(db => db._query(`SELECT 1`, `get`))

        expect(res[`1`]).is.equal(1)
    })
})
