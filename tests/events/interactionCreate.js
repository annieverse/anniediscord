"use strict"
const { describe, it, beforeEach, afterEach } = require(`mocha`)
const { expect } = require(`chai`)
const sinon = require(`sinon`)
const { Collection, InteractionType } = require(`discord.js`)

//  The handler dispatches resolved commands into the applicationCommand controller
//  and routes errors through errorHandler. Stub both at require-time (same pattern as
//  tests/libs/localizer.js) so we can observe which command object was resolved without
//  spinning up a live controller/shard. `dispatched` is mutated (never reassigned) so the
//  closure captured by the stub keeps pointing at the same array.
const dispatched = []
const Module = require(`module`)
const originalRequire = Module.prototype.require
Module.prototype.require = function (...args) {
    if (args[0].endsWith(`controllers/applicationCommand`)) {
        return (client, interaction, command) => { dispatched.push(command) }
    }
    if (args[0].endsWith(`utils/errorHandler.js`) || args[0].endsWith(`utils/errorHandler`)) {
        return () => Promise.resolve()
    }
    return originalRequire.apply(this, args)
}
const handler = require(`../../src/events/interaction/interactionCreate`)
Module.prototype.require = originalRequire

/**
 * Minimal client carrying just what the handler reads. A fresh global command pool
 * (`ping`) and one guild-only command (`devtool`, owned by `guildA`).
 */
function buildClient() {
    const application_commands = new Collection()
    application_commands.set(`ping`, { name: `ping`, src: `global`, autocomplete: sinon.stub() })

    const guildonly_commands = new Collection()
    const guildAOnly = new Collection()
    guildAOnly.set(`devtool`, { name: `devtool`, src: `guildA`, autocomplete: sinon.stub() })
    guildonly_commands.set(`guildA`, guildAOnly)

    return {
        isReady: () => true,
        application_commands,
        guildonly_commands,
        db: {
            databaseUtils: { validateUserEntry: sinon.stub().resolves() },
            userUtils: { getUserLocale: sinon.stub().resolves({ lang: `en` }) }
        },
        localization: { set lang(v) { }, findLocale: (k) => k },
        responseLibs: () => ({ send: sinon.stub().resolves() }),
        logger: { error: sinon.stub() },
        getEmoji: sinon.stub().resolves(`:e:`),
        dev: false
    }
}

function buildInteraction(commandName, guildId, type = InteractionType.ApplicationCommand) {
    return {
        type,
        commandName,
        guildId,
        user: { id: `123`, username: `tester` },
        options: { data: [] }
    }
}

describe(`interactionCreate handler`, () => {
    let sandbox
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        dispatched.length = 0
    })
    afterEach(() => sandbox.restore())

    describe(`guild-only command isolation (#2)`, () => {
        it(`does NOT mutate the global application_commands singleton when a guild has guild-only commands`, async () => {
            const client = buildClient()
            const poolRef = client.application_commands
            const sizeBefore = client.application_commands.size
            await handler(client, buildInteraction(`devtool`, `guildA`))
            //  Same object reference => the singleton was never reassigned
            expect(client.application_commands).to.equal(poolRef)
            expect(client.application_commands.size).to.equal(sizeBefore)
            expect(client.application_commands.has(`devtool`)).to.be.false
        })

        it(`resolves a guild-only command from its owning guild`, async () => {
            const client = buildClient()
            await handler(client, buildInteraction(`devtool`, `guildA`))
            expect(dispatched).to.have.lengthOf(1)
            expect(dispatched[0].name).to.equal(`devtool`)
        })

        it(`does NOT resolve a guild-only command from a different guild`, async () => {
            const client = buildClient()
            await handler(client, buildInteraction(`devtool`, `guildB`))
            expect(dispatched).to.have.lengthOf(0)
        })

        it(`does not leak a guild-only command across guilds on a subsequent interaction`, async () => {
            const client = buildClient()
            //  Fire from the owning guild first (this is what used to pollute the singleton)
            await handler(client, buildInteraction(`devtool`, `guildA`))
            dispatched.length = 0
            //  Then a different guild must still not see it
            await handler(client, buildInteraction(`devtool`, `guildB`))
            expect(dispatched).to.have.lengthOf(0)
            expect(client.application_commands.has(`devtool`)).to.be.false
        })

        it(`still resolves global commands from any guild`, async () => {
            const client = buildClient()
            await handler(client, buildInteraction(`ping`, `guildB`))
            expect(dispatched).to.have.lengthOf(1)
            expect(dispatched[0].name).to.equal(`ping`)
        })

        it(`falls back to the global pool for DM/no-guild interactions`, async () => {
            const client = buildClient()
            await handler(client, buildInteraction(`ping`, null))
            expect(dispatched).to.have.lengthOf(1)
            expect(dispatched[0].name).to.equal(`ping`)
        })
    })

    describe(`autocomplete branch uses the same per-interaction lookup`, () => {
        it(`invokes autocomplete for a guild-only command from its owning guild without leaking`, async () => {
            const client = buildClient()
            const cmd = client.guildonly_commands.get(`guildA`).get(`devtool`)
            await handler(client, buildInteraction(`devtool`, `guildA`, InteractionType.ApplicationCommandAutocomplete))
            expect(cmd.autocomplete.calledOnce).to.be.true
            expect(client.application_commands.has(`devtool`)).to.be.false
        })

        it(`does not invoke autocomplete for a guild-only command from another guild`, async () => {
            const client = buildClient()
            const cmd = client.guildonly_commands.get(`guildA`).get(`devtool`)
            await handler(client, buildInteraction(`devtool`, `guildB`, InteractionType.ApplicationCommandAutocomplete))
            expect(cmd.autocomplete.called).to.be.false
        })
    })
})
