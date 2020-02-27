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

    it(`should successfully validating tables`, async () => {
        const db = await new Database().connect(`./test/dummy/database.sqlite`, `../../test/dummy/database.sqlite`)
        expect(await db.validatingTables()).is.equal(true)
    })

    it(`returns 1 from simple query (SELECT 1)`, async () => {
        const res = await new Database().connect(`./test/dummy/database.sqlite`, `../../test/dummy/database.sqlite`)
        .then(db => db._query(`SELECT 1`, `get`))
        expect(res[`1`]).is.equal(1)
    })

    describe(`User Validation`, async () => {
        it(`register id if not present`, async () => {
            const db = await new Database().connect(`./test/dummy/database.sqlite`, `../../test/dummy/database.sqlite`)
            const res = await db.validatingNewUser(`123`, `Name Test`)
            await db.deleteUser(`123`)
            expect(res.stmt.changes).is.equal(1)
        })
    })
})
