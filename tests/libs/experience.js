const { expect } = require(`chai`)
const Experience = require(`../../src/libs/exp`)

describe(`Experience Library`, function() {
    const mockClient = {
        logger: {
            error: () => {}
        }
    }

    const mockUser = {
        id: `123456789`
    }

    const mockGuild = {
        id: `987654321`
    }

    const mockChannel = {}
    const mockLocale = {}

    describe(`Constructor validation`, function() {
        it(`should throw error when user is null`, function() {
            expect(() => {
                new Experience(mockClient, null, mockGuild, mockChannel, mockLocale)
            }).to.throw(TypeError, `Experience constructor requires a valid user with id property`)
        })

        it(`should throw error when user is undefined`, function() {
            expect(() => {
                new Experience(mockClient, undefined, mockGuild, mockChannel, mockLocale)
            }).to.throw(TypeError, `Experience constructor requires a valid user with id property`)
        })

        it(`should throw error when user has no id property`, function() {
            expect(() => {
                new Experience(mockClient, {}, mockGuild, mockChannel, mockLocale)
            }).to.throw(TypeError, `Experience constructor requires a valid user with id property`)
        })

        it(`should throw error when guild is null`, function() {
            expect(() => {
                new Experience(mockClient, mockUser, null, mockChannel, mockLocale)
            }).to.throw(TypeError, `Experience constructor requires a valid guild with id property`)
        })

        it(`should throw error when guild is undefined`, function() {
            expect(() => {
                new Experience(mockClient, mockUser, undefined, mockChannel, mockLocale)
            }).to.throw(TypeError, `Experience constructor requires a valid guild with id property`)
        })

        it(`should throw error when guild has no id property`, function() {
            expect(() => {
                new Experience(mockClient, mockUser, {}, mockChannel, mockLocale)
            }).to.throw(TypeError, `Experience constructor requires a valid guild with id property`)
        })

        it(`should successfully create instance with valid parameters`, function() {
            expect(() => {
                const exp = new Experience(mockClient, mockUser, mockGuild, mockChannel, mockLocale)
                expect(exp.instanceId).to.equal(`[EXP_LIBS_${mockGuild.id}@${mockUser.id}]`)
                expect(exp.user).to.equal(mockUser)
                expect(exp.guild).to.equal(mockGuild)
            }).to.not.throw()
        })
    })
})