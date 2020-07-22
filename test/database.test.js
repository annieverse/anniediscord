const { expect } = require(`chai`)
const Database = require(`../src/libs/database`)

/**
 * @reference ./src/struct/database.js
 */
describe(`Database`, () => {

    it(`[.connect()] should successful connecting to database`, async () => {
        const db = await new Database().connect(`./test/dummy/database.sqlite`, `../../test/dummy/database.sqlite`)
        expect(db.client.open).is.equal(true)
    })

    it(`[._query()] should returns 1 from simple query (SELECT 1)`, async () => {
        const db = await new Database().connect(`./test/dummy/database.sqlite`, `../../test/dummy/database.sqlite`)
        const res = await db._query(`SELECT 1`)
        expect(res[`1`]).is.equal(1)
    })

    describe(`User Validation`, async () => {
        it(`[.validateUser()] should register id if not present`, async () => {
            const db = await new Database().connect(`./test/dummy/database.sqlite`, `../../test/dummy/database.sqlite`)
            const res = await db.validateUser(`123`,`634111906625617960`)
            await db.deleteUser(`123`)
            expect(res.changes).is.equal(1)
        })
    })
})
