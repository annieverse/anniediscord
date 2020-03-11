const { expect } = require(`chai`)
const PermissionController = require(`../src/libs/permissions.js`)
/**
 * @reference ./src/controller/permissions.js
 */
describe(`Permission Controller`, () => {
    describe(`.authorityCheck()`, () => {
        it(`should able to fetch admin-level on admin user`, () => {
            const dummyMessageObject = {
                channel: {
                    type: `text`
                },
                author: {
                    id: `123`
                },
                member: {
                    highestRole: {
                        permissions: `ADMINISTRATOR`
                    }
                }
            }
            const res = new PermissionController(dummyMessageObject).authorityCheck()
            expect(res.level).to.equal(3)
            expect(res.permissionString).to.equal(`ADMINISTRATOR`)
        })
        it(`should able to return as regular user if no perm strings are matched`, () => {
            const dummyMessageObject = {
                channel: {
                    type: `text`
                },
                author: {
                    id: `123`
                },
                member: {
                    highestRole: {
                        permissions: `SEND_MESSAGES`
                    }
                }
            }
            const res = new PermissionController(dummyMessageObject).authorityCheck()
            expect(res.level).to.equal(0)
            expect(res.permissionString).to.equal(`SEND_MESSAGES`)
        })
        it(`should able to return as developer user if account id is match`, () => {
            const dummyMessageObject = {
                channel: {
                    type: `text`
                },
                author: {
                    id: `230034968515051520`
                },
                member: {
                    highestRole: {
                        permissions: `ADMINISTRATOR`
                    }
                }
            }
            const res = new PermissionController(dummyMessageObject).authorityCheck()
            expect(res.level).to.equal(4)
            expect(res.permissionString).to.equal(`ADMINISTRATOR`)
        })
        it(`should only returning as regular user when on DM interface`, () => {
            const dummyMessageObject = {
                channel: {
                    type: `dm`
                },
                author: {
                    id: `123`
                },
                member: {
                    highestRole: {
                        permissions: `ADMINISTRATOR`
                    }
                }
            }
            const res = new PermissionController(dummyMessageObject).authorityCheck()
            expect(res.level).to.equal(0)
            expect(res.name).to.equal(`User`)
        })
    })
})
