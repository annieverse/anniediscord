const { expect } = require(`chai`)
const Database = require(`../src/struct/database`)

/**
 * @reference ./src/struct/database.js
 */
describe(`Database`, () => {
    console.log(process.env.NODE_ENV)

    it(`connecting to database`, async () => {
        const db = await new Database().connect(`./test/dummy/database.sqlite`, `../../test/dummy/database.sqlite`)
        expect(db.client.driver.open).is.equal(true)
    })

    it(`should successfully verifying tables`, async () => {
        const db = await new Database().connect()
        expect(await db.schemaCheck()).is.equal(true)
    })

    it(`returns 1 from simple query (SELECT 1)`, async () => {
        const res = await new Database()
        .connect(`./test/dummy/database.sqlite`, `../../test/dummy/database.sqlite`)
        .then(db => db._query(`SELECT 1`, `get`))

        expect(res[`1`]).is.equal(1)
    })

    it(`validating user`, async () => {
        const db = await new Database().connect(`./test/dummy/database.sqlite`, `../../test/dummy/database.sqlite`)
        const res = await db.validatingNewUser(`123`, `Name Test`)
        console.log(res)
        expect(db.client.driver.open).is.equal(true)
    })
})
