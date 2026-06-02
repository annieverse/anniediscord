"use strict"
const { describe, it, beforeEach, afterEach } = require(`mocha`)
const { expect } = require(`chai`)
const sinon = require(`sinon`)

const Reminder = require(`../../src/libs/reminder`)
const remindCommand = require(`../../src/commands/user/remind`)

/**
 * Builds a minimal fake client that satisfies the parts of `Reminder`
 * and the remind command that the tests touch. The cron pool, db, cache
 * and logger are all stubs so nothing reaches a real shard/db/redis.
 */
function buildFakeClient(overrides = {}) {
    const logger = { info: sinon.stub(), warn: sinon.stub(), debug: sinon.stub(), error: sinon.stub() }
    const pool = {
        add: sinon.stub(),
        stop: sinon.stub(),
        deleteJob: sinon.stub(),
        exists: sinon.stub().returns(true)
    }
    const reminders = {
        getAllReminders: sinon.stub().resolves([]),
        getUserReminders: sinon.stub().resolves([]),
        registerUserReminder: sinon.stub().resolves(),
        deleteUserReminder: sinon.stub().resolves(),
        updateUserReminder: sinon.stub().resolves()
    }
    const redis = { get: sinon.stub().resolves(null), set: sinon.stub(), del: sinon.stub() }
    const client = {
        shard: { ids: [0], count: 1 },
        cronManager: pool,
        logger,
        db: { reminders, redis },
        users: { fetch: sinon.stub().resolves({ send: sinon.stub() }) }
    }
    return Object.assign(client, overrides)
}

/**
 * Instantiates `Reminder` without running its async initialize() side effects.
 */
function buildReminderLib(client) {
    const lib = Object.create(Reminder.prototype)
    lib.client = client
    lib.pool = client.cronManager
    lib.instanceId = `[TEST@REMINDER]`
    return lib
}

describe(`Reminder feature`, () => {
    let sandbox
    let clock

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        //  Pin "now" to a fixed timestamp so relative-time assertions stay stable
        clock = sinon.useFakeTimers(new Date(`2026-05-31T12:00:00.000Z`).getTime())
    })

    afterEach(() => {
        sandbox.restore()
        clock.restore()
    })

    describe(`Reminder.getActiveReminders`, () => {
        it(`returns an empty array when the user has no reminders`, async () => {
            const client = buildFakeClient()
            const lib = buildReminderLib(client)
            const result = await lib.getActiveReminders(`123`)
            expect(result).to.deep.equal([])
        })

        it(`normalizes db rows, parses remind_at, and exposes a usable shape`, async () => {
            const future = new Date(`2026-05-31T15:00:00.000Z`)
            const client = buildFakeClient()
            client.db.reminders.getUserReminders.resolves([{
                registered_at: `Sat, 31 May 2026 11:00:00 GMT`,
                reminder_id: `uuid-1`,
                user_id: `123`,
                message: `drink water`,
                remind_at: JSON.stringify({ timestamp: future, milliseconds: 1000 * 60 * 60 * 3 })
            }])
            const lib = buildReminderLib(client)
            const result = await lib.getActiveReminders(`123`)
            expect(result).to.have.lengthOf(1)
            expect(result[0]).to.include({ id: `uuid-1`, userId: `123`, message: `drink water` })
            expect(result[0].remindAt.timestamp).to.be.instanceOf(Date)
            expect(result[0].remindAt.timestamp.toISOString()).to.equal(future.toISOString())
        })

        it(`filters out reminders that already elapsed`, async () => {
            const past = new Date(`2026-05-31T09:00:00.000Z`)
            const future = new Date(`2026-05-31T18:00:00.000Z`)
            const client = buildFakeClient()
            client.db.reminders.getUserReminders.resolves([
                { registered_at: `x`, reminder_id: `old`, user_id: `123`, message: `expired`, remind_at: JSON.stringify({ timestamp: past, milliseconds: 0 }) },
                { registered_at: `x`, reminder_id: `new`, user_id: `123`, message: `future`, remind_at: JSON.stringify({ timestamp: future, milliseconds: 0 }) }
            ])
            const lib = buildReminderLib(client)
            const result = await lib.getActiveReminders(`123`)
            expect(result).to.have.lengthOf(1)
            expect(result[0].id).to.equal(`new`)
        })

        it(`sorts reminders by the soonest trigger first`, async () => {
            const soon = new Date(`2026-05-31T13:00:00.000Z`)
            const later = new Date(`2026-05-31T20:00:00.000Z`)
            const client = buildFakeClient()
            client.db.reminders.getUserReminders.resolves([
                { registered_at: `x`, reminder_id: `later`, user_id: `123`, message: `later`, remind_at: JSON.stringify({ timestamp: later, milliseconds: 0 }) },
                { registered_at: `x`, reminder_id: `soon`, user_id: `123`, message: `soon`, remind_at: JSON.stringify({ timestamp: soon, milliseconds: 0 }) }
            ])
            const lib = buildReminderLib(client)
            const result = await lib.getActiveReminders(`123`)
            expect(result.map(r => r.id)).to.deep.equal([`soon`, `later`])
        })

        it(`tolerates an already-parsed remind_at object`, async () => {
            const future = new Date(`2026-05-31T15:00:00.000Z`)
            const client = buildFakeClient()
            client.db.reminders.getUserReminders.resolves([{
                registered_at: `x`, reminder_id: `uuid-2`, user_id: `123`, message: `parsed`,
                remind_at: { timestamp: future, milliseconds: 0 }
            }])
            const lib = buildReminderLib(client)
            const result = await lib.getActiveReminders(`123`)
            expect(result).to.have.lengthOf(1)
            expect(result[0].remindAt.timestamp.toISOString()).to.equal(future.toISOString())
        })
    })

    describe(`Reminder.deleteReminder`, () => {
        it(`broadcasts the cron stop, clears cache, and deletes from the database`, async () => {
            const client = buildFakeClient()
            client.shard.broadcastEval = sinon.stub().resolves([true])
            const lib = buildReminderLib(client)
            const result = await lib.deleteReminder(`123`, `uuid-1`)
            expect(result).to.be.true
            expect(client.shard.broadcastEval.calledOnce).to.be.true
            expect(client.db.redis.del.calledWith(`REMINDERS@123`)).to.be.true
            expect(client.db.reminders.deleteUserReminder.calledWith(`uuid-1`)).to.be.true
        })

        it(`falls back to the local cron pool when there is no shard manager`, async () => {
            const client = buildFakeClient()
            client.shard = null
            const lib = buildReminderLib(client)
            lib.pool = client.cronManager
            const result = await lib.deleteReminder(`123`, `uuid-1`)
            expect(result).to.be.true
            expect(client.cronManager.stop.calledWith(`uuid-1`)).to.be.true
            expect(client.cronManager.deleteJob.calledWith(`uuid-1`)).to.be.true
            expect(client.db.reminders.deleteUserReminder.calledWith(`uuid-1`)).to.be.true
        })

        it(`still deletes from the database even if stopping the cron throws`, async () => {
            const client = buildFakeClient()
            client.shard.broadcastEval = sinon.stub().rejects(new Error(`shard offline`))
            const lib = buildReminderLib(client)
            const result = await lib.deleteReminder(`123`, `uuid-1`)
            expect(result).to.be.true
            expect(client.db.reminders.deleteUserReminder.calledWith(`uuid-1`)).to.be.true
            expect(client.logger.warn.called).to.be.true
        })
    })

    describe(`Reminder.getDateFromDuration`, () => {
        it(`parses a spaced duration string into a future date`, () => {
            const client = buildFakeClient()
            const lib = buildReminderLib(client)
            const result = lib.getDateFromDuration(`3 hours`)
            expect(result).to.not.be.null
            expect(result.milliseconds).to.equal(1000 * 60 * 60 * 3)
            expect(result.timestamp.toISOString()).to.equal(new Date(`2026-05-31T15:00:00.000Z`).toISOString())
        })

        it(`parses a compact duration string`, () => {
            const client = buildFakeClient()
            const lib = buildReminderLib(client)
            const result = lib.getDateFromDuration(`30m`)
            expect(result.milliseconds).to.equal(1000 * 60 * 30)
        })

        it(`returns null for empty, non-string, or unparseable input`, () => {
            const client = buildFakeClient()
            const lib = buildReminderLib(client)
            expect(lib.getDateFromDuration(``)).to.be.null
            expect(lib.getDateFromDuration(`   `)).to.be.null
            expect(lib.getDateFromDuration(null)).to.be.null
            expect(lib.getDateFromDuration(`not a duration`)).to.be.null
        })

        it(`returns null for non-positive durations`, () => {
            const client = buildFakeClient()
            const lib = buildReminderLib(client)
            expect(lib.getDateFromDuration(`0s`)).to.be.null
            expect(lib.getDateFromDuration(`-5m`)).to.be.null
        })
    })

    describe(`Reminder.editReminder`, () => {
        const baseContext = {
            id: `uuid-1`,
            userId: `123`,
            message: `new message`,
            remindAt: { timestamp: new Date(`2026-05-31T18:00:00.000Z`), milliseconds: 1000 * 60 * 60 * 6 },
            registeredAt: `Sat, 31 May 2026 11:00:00 GMT`
        }

        it(`broadcasts the cron stop, persists the update, clears cache, and re-arms the cron`, async () => {
            const client = buildFakeClient()
            client.shard.broadcastEval = sinon.stub().resolves([true])
            const lib = buildReminderLib(client)
            const startSpy = sandbox.stub(lib, `startReminder`)
            const result = await lib.editReminder(baseContext)
            expect(result).to.be.true
            expect(client.shard.broadcastEval.calledOnce).to.be.true
            expect(client.db.reminders.updateUserReminder.calledWith(`uuid-1`, `new message`, baseContext.remindAt)).to.be.true
            expect(client.db.redis.del.calledWith(`REMINDERS@123`)).to.be.true
            expect(startSpy.calledOnce).to.be.true
        })

        it(`re-arms the cron with the new message and date`, async () => {
            const client = buildFakeClient()
            client.shard.broadcastEval = sinon.stub().resolves([true])
            const lib = buildReminderLib(client)
            const startSpy = sandbox.stub(lib, `startReminder`)
            await lib.editReminder(baseContext)
            const armedWith = startSpy.firstCall.args[0]
            expect(armedWith).to.include({ id: `uuid-1`, userId: `123`, message: `new message` })
            expect(armedWith.remindAt).to.equal(baseContext.remindAt)
        })

        it(`falls back to the local cron pool when there is no shard manager`, async () => {
            const client = buildFakeClient()
            client.shard = null
            const lib = buildReminderLib(client)
            lib.pool = client.cronManager
            sandbox.stub(lib, `startReminder`)
            const result = await lib.editReminder(baseContext)
            expect(result).to.be.true
            expect(client.cronManager.stop.calledWith(`uuid-1`)).to.be.true
            expect(client.cronManager.deleteJob.calledWith(`uuid-1`)).to.be.true
            expect(client.db.reminders.updateUserReminder.calledOnce).to.be.true
        })

        it(`still updates the database even if stopping the cron throws`, async () => {
            const client = buildFakeClient()
            client.shard.broadcastEval = sinon.stub().rejects(new Error(`shard offline`))
            const lib = buildReminderLib(client)
            sandbox.stub(lib, `startReminder`)
            const result = await lib.editReminder(baseContext)
            expect(result).to.be.true
            expect(client.db.reminders.updateUserReminder.calledOnce).to.be.true
            expect(client.logger.warn.called).to.be.true
        })
    })

    describe(`remind command structure`, () => {
        it(`exposes create, list, and delete subcommands for slash mode`, () => {
            const names = remindCommand.options.map(o => o.name)
            expect(names).to.include.members([`create`, `list`, `delete`])
        })

        it(`keeps the original creation options nested under the create subcommand`, () => {
            const create = remindCommand.options.find(o => o.name === `create`)
            const optionNames = create.options.map(o => o.name)
            expect(optionNames).to.deep.equal([`message`, `in_how_long`, `time_unit`])
        })

        it(`requires an id option for the delete subcommand`, () => {
            const del = remindCommand.options.find(o => o.name === `delete`)
            expect(del.options[0].name).to.equal(`id`)
            expect(del.options[0].required).to.be.true
        })

        it(`exposes an edit subcommand that requires an id option`, () => {
            const edit = remindCommand.options.find(o => o.name === `edit`)
            expect(edit).to.not.be.undefined
            expect(edit.options[0].name).to.equal(`id`)
            expect(edit.options[0].required).to.be.true
        })
    })

    describe(`remind command helpers`, () => {
        it(`_fill replaces every occurrence of a token`, () => {
            const out = remindCommand._fill(`{{a}} and {{a}} then {{b}}`, { a: `X`, b: `Y` })
            expect(out).to.equal(`X and X then Y`)
        })

        it(`_trim shortens long strings and leaves short ones intact`, () => {
            expect(remindCommand._trim(`short`, 10)).to.equal(`short`)
            expect(remindCommand._trim(`abcdefghijk`, 5)).to.equal(`abcde...`)
        })

        it(`_resolveTarget resolves by 1-based list position`, () => {
            const reminders = [{ id: `a`, message: `one` }, { id: `b`, message: `two` }]
            expect(remindCommand._resolveTarget(reminders, `2`)).to.equal(reminders[1])
        })

        it(`_resolveTarget falls back to a full id match`, () => {
            const reminders = [{ id: `uuid-a`, message: `one` }, { id: `uuid-b`, message: `two` }]
            expect(remindCommand._resolveTarget(reminders, `uuid-b`)).to.equal(reminders[1])
        })

        it(`_resolveTarget returns null for an out-of-range or unknown target`, () => {
            const reminders = [{ id: `a`, message: `one` }]
            expect(remindCommand._resolveTarget(reminders, `99`)).to.be.null
            expect(remindCommand._resolveTarget(reminders, `nope`)).to.be.null
        })

        it(`_parseSimplifiedList numbers entries from 1`, () => {
            const list = remindCommand._parseSimplifiedList([
                { id: `a`, message: `first` },
                { id: `b`, message: `second` }
            ])
            expect(list).to.contain(`(ID:1)`)
            expect(list).to.contain(`(ID:2)`)
            expect(list).to.contain(`first`)
            expect(list).to.contain(`second`)
        })

        it(`_discordTimestamp formats dates for the viewer's Discord timezone`, () => {
            expect(remindCommand._discordTimestamp(new Date(`2026-05-31T15:00:00.000Z`)))
                .to.equal(`<t:1780239600:f>`)
        })

        it(`_discordTimestamp returns an empty string for an invalid date`, () => {
            expect(remindCommand._discordTimestamp(`not-a-date`)).to.equal(``)
        })

        it(`_parseReminderList paginates when over the page limit`, () => {
            const future = new Date(`2026-05-31T15:00:00.000Z`)
            const reminders = []
            for (let i = 0; i < 23; i++) {
                reminders.push({ id: `id-${i}`, message: `msg ${i}`, remindAt: { timestamp: future, milliseconds: 0 } })
            }
            const locale = (key) => ({
                "REMINDER.LIST_INTRO": `intro {{size}} {{time}} {{emoji}}\n`,
                "REMINDER.LIST_ENTRY": `[ID:{{id}}] {{message}} {{time}} {{date}}`
            })[key]
            const pages = remindCommand._parseReminderList(reminders, locale, { size: 23, time: `soon`, emoji: `:e:` })
            //  23 entries / 10 per page => 3 pages
            expect(pages).to.have.lengthOf(3)
            //  intro line only on the first page
            expect(pages[0]).to.contain(`intro 23`)
            expect(pages[1]).to.not.contain(`intro`)
            //  list ids are 1-based positions
            expect(pages[0]).to.contain(`[ID:1]`)
            //  Discord renders this absolute date in each viewer's timezone.
            expect(pages[0]).to.contain(`<t:1780239600:f>`)
        })

        it(`_parseReminderList keeps everything on one page when under the limit`, () => {
            const future = new Date(`2026-05-31T15:00:00.000Z`)
            const reminders = [
                { id: `a`, message: `one`, remindAt: { timestamp: future, milliseconds: 0 } },
                { id: `b`, message: `two`, remindAt: { timestamp: future, milliseconds: 0 } }
            ]
            const locale = (key) => ({
                "REMINDER.LIST_INTRO": `intro {{size}} {{time}} {{emoji}}\n`,
                "REMINDER.LIST_ENTRY": `[ID:{{id}}] {{message}}`
            })[key]
            const pages = remindCommand._parseReminderList(reminders, locale, { size: 2, time: `soon`, emoji: `:e:` })
            expect(pages).to.have.lengthOf(1)
            expect(pages[0]).to.contain(`[ID:1]`)
            expect(pages[0]).to.contain(`[ID:2]`)
        })
    })

    describe(`remind command routing`, () => {
        function buildReplyStub() {
            return { send: sinon.stub().resolves({ delete: sinon.stub() }) }
        }
        function buildCommandClient() {
            const client = buildFakeClient()
            client.getEmoji = sinon.stub().resolves(`:emoji:`)
            client.prefix = `>`
            client.reminders = {
                getActiveReminders: sinon.stub().resolves([]),
                getContextFrom: sinon.stub().returns({ isValidReminder: false }),
                getContext: sinon.stub().returns({ isValidReminder: false }),
                getDateFromDuration: sinon.stub().returns({ timestamp: new Date(`2026-05-31T18:00:00.000Z`), milliseconds: 1000 * 60 * 60 * 6 }),
                register: sinon.stub(),
                deleteReminder: sinon.stub().resolves(true),
                editReminder: sinon.stub().resolves(true)
            }
            return client
        }

        it(`routes "list" keyword to the list view`, async () => {
            const client = buildCommandClient()
            const reply = buildReplyStub()
            const listSpy = sandbox.spy(remindCommand, `list`)
            const message = { author: { id: `123` } }
            await remindCommand.execute(client, reply, message, `list`, (k) => k, `>`)
            expect(listSpy.calledOnce).to.be.true
            listSpy.restore()
        })

        it(`routes "delete" keyword to the delete view with the trailing id`, async () => {
            const client = buildCommandClient()
            const reply = buildReplyStub()
            const deleteSpy = sandbox.spy(remindCommand, `delete`)
            const message = { author: { id: `123` } }
            await remindCommand.execute(client, reply, message, `delete 2`, (k) => k, `>`)
            expect(deleteSpy.calledOnce).to.be.true
            //  last argument is the parsed target id
            expect(deleteSpy.firstCall.args[6]).to.equal(`2`)
            deleteSpy.restore()
        })

        it(`treats free-form input as a new reminder`, async () => {
            const client = buildCommandClient()
            const reply = buildReplyStub()
            const message = { author: { id: `123` } }
            await remindCommand.execute(client, reply, message, `to bake a cake in 3 minutes`, (k) => k, `>`)
            expect(client.reminders.getContextFrom.calledOnce).to.be.true
        })

        it(`accepts the legacy flat slash options while subcommand registration propagates`, async () => {
            const client = buildCommandClient()
            const reply = buildReplyStub()
            const interaction = { member: { id: `123` } }
            const options = {
                getSubcommand: sinon.stub().callsFake((required = true) => {
                    if (required) throw new Error(`No subcommand specified for interaction.`)
                    return null
                }),
                getString: sinon.stub().callsFake(name => name === `message` ? `hello` : `minutes`),
                getInteger: sinon.stub().returns(3)
            }
            await remindCommand.Iexecute(client, reply, interaction, options, (k) => k)
            expect(options.getSubcommand.calledWith(false)).to.be.true
            expect(client.reminders.getContext.calledWith(`hello`, 3, `minutes`, `123`)).to.be.true
        })

        it(`shows the home guide when no argument is given`, async () => {
            const client = buildCommandClient()
            const reply = buildReplyStub()
            const message = { author: { id: `123` } }
            await remindCommand.execute(client, reply, message, ``, (k) => k, `>`)
            expect(reply.send.calledOnce).to.be.true
            expect(reply.send.firstCall.args[0]).to.equal(`REMINDER.HOME`)
        })

        it(`list view short-circuits with LIST_EMPTY when there are no reminders`, async () => {
            const client = buildCommandClient()
            const reply = buildReplyStub()
            const message = { author: { id: `123` } }
            await remindCommand.list(client, reply, message, (k) => k, `>`, `123`)
            expect(reply.send.calledOnce).to.be.true
            expect(reply.send.firstCall.args[0]).to.equal(`REMINDER.LIST_EMPTY`)
        })

        it(`delete view asks for an id when none is supplied`, async () => {
            const client = buildCommandClient()
            client.reminders.getActiveReminders.resolves([
                { id: `a`, message: `one`, remindAt: { timestamp: new Date(`2026-05-31T15:00:00.000Z`), milliseconds: 0 } }
            ])
            const reply = buildReplyStub()
            const message = { author: { id: `123` } }
            await remindCommand.delete(client, reply, message, (k) => k, `>`, `123`, ``)
            expect(reply.send.firstCall.args[0]).to.equal(`REMINDER.DELETE_MISSING_ID`)
        })

        it(`delete view reports DELETE_NOT_FOUND for an out-of-range id`, async () => {
            const client = buildCommandClient()
            client.reminders.getActiveReminders.resolves([
                { id: `a`, message: `one`, remindAt: { timestamp: new Date(`2026-05-31T15:00:00.000Z`), milliseconds: 0 } }
            ])
            const reply = buildReplyStub()
            const message = { author: { id: `123` } }
            await remindCommand.delete(client, reply, message, (k) => k, `>`, `123`, `99`)
            expect(reply.send.firstCall.args[0]).to.equal(`REMINDER.DELETE_NOT_FOUND`)
        })

        it(`delete view reports DELETE_EMPTY when nothing is active`, async () => {
            const client = buildCommandClient()
            const reply = buildReplyStub()
            const message = { author: { id: `123` } }
            await remindCommand.delete(client, reply, message, (k) => k, `>`, `123`, `1`)
            expect(reply.send.firstCall.args[0]).to.equal(`REMINDER.DELETE_EMPTY`)
        })

        it(`routes "edit" keyword to the edit flow with the trailing id`, async () => {
            const client = buildCommandClient()
            const reply = buildReplyStub()
            const editSpy = sandbox.spy(remindCommand, `edit`)
            const message = { author: { id: `123` } }
            await remindCommand.execute(client, reply, message, `edit 2`, (k) => k, `>`)
            expect(editSpy.calledOnce).to.be.true
            expect(editSpy.firstCall.args[6]).to.equal(`2`)
            editSpy.restore()
        })

        it(`edit view reports EDIT_EMPTY when nothing is active`, async () => {
            const client = buildCommandClient()
            const reply = buildReplyStub()
            const message = { author: { id: `123` } }
            await remindCommand.edit(client, reply, message, (k) => k, `>`, `123`, `1`)
            expect(reply.send.firstCall.args[0]).to.equal(`REMINDER.EDIT_EMPTY`)
        })

        it(`edit view asks for an id when none is supplied`, async () => {
            const client = buildCommandClient()
            client.reminders.getActiveReminders.resolves([
                { id: `a`, message: `one`, remindAt: { timestamp: new Date(`2026-05-31T15:00:00.000Z`), milliseconds: 0 } }
            ])
            const reply = buildReplyStub()
            const message = { author: { id: `123` } }
            await remindCommand.edit(client, reply, message, (k) => k, `>`, `123`, ``)
            expect(reply.send.firstCall.args[0]).to.equal(`REMINDER.EDIT_MISSING_ID`)
        })

        it(`edit view reports EDIT_NOT_FOUND for an out-of-range id`, async () => {
            const client = buildCommandClient()
            client.reminders.getActiveReminders.resolves([
                { id: `a`, message: `one`, remindAt: { timestamp: new Date(`2026-05-31T15:00:00.000Z`), milliseconds: 0 } }
            ])
            const reply = buildReplyStub()
            const message = { author: { id: `123` } }
            await remindCommand.edit(client, reply, message, (k) => k, `>`, `123`, `99`)
            expect(reply.send.firstCall.args[0]).to.equal(`REMINDER.EDIT_NOT_FOUND`)
        })

        it(`edit view bails out when the first prompt times out`, async () => {
            const client = buildCommandClient()
            client.reminders.getActiveReminders.resolves([
                { id: `a`, message: `one`, registeredAt: `x`, remindAt: { timestamp: new Date(`2026-05-31T15:00:00.000Z`), milliseconds: 0 } }
            ])
            const reply = buildReplyStub()
            const message = { author: { id: `123` } }
            //  No response on the first prompt
            sandbox.stub(remindCommand, `_awaitTextInput`).resolves(null)
            await remindCommand.edit(client, reply, message, (k) => k, `>`, `123`, `1`)
            const sentKeys = reply.send.getCalls().map(c => c.args[0])
            expect(sentKeys).to.include(`REMINDER.EDIT_TIMEOUT`)
            expect(client.reminders.editReminder.called).to.be.false
        })

        it(`edit view reports EDIT_INVALID_TIME when the duration can't be parsed`, async () => {
            const client = buildCommandClient()
            client.reminders.getActiveReminders.resolves([
                { id: `a`, message: `one`, registeredAt: `x`, remindAt: { timestamp: new Date(`2026-05-31T15:00:00.000Z`), milliseconds: 0 } }
            ])
            client.reminders.getDateFromDuration.returns(null)
            const reply = buildReplyStub()
            const message = { author: { id: `123` } }
            const inputStub = sandbox.stub(remindCommand, `_awaitTextInput`)
            inputStub.onFirstCall().resolves(`new message text`)
            inputStub.onSecondCall().resolves(`gibberish`)
            await remindCommand.edit(client, reply, message, (k) => k, `>`, `123`, `1`)
            const sentKeys = reply.send.getCalls().map(c => c.args[0])
            expect(sentKeys).to.include(`REMINDER.EDIT_INVALID_TIME`)
            expect(client.reminders.editReminder.called).to.be.false
        })

        it(`edit view reaches the confirmation prompt with both inputs valid`, async () => {
            const client = buildCommandClient()
            client.reminders.getActiveReminders.resolves([
                { id: `a`, message: `old message`, registeredAt: `x`, remindAt: { timestamp: new Date(`2026-05-31T15:00:00.000Z`), milliseconds: 0 } }
            ])
            const reply = buildReplyStub()
            //  Confirmator.setup edits/deletes the confirmation message; stub the message + guild it needs
            const message = { author: { id: `123` }, guild: { id: `g1` }, client: { db: { databaseUtils: { doesCacheExist: sinon.stub().resolves(false), setCache: sinon.stub() } }, getEmoji: sinon.stub().resolves(`:e:`) } }
            const inputStub = sandbox.stub(remindCommand, `_awaitTextInput`)
            inputStub.onFirstCall().resolves(`brand new message`)
            inputStub.onSecondCall().resolves(`3 hours`)
            //  The confirmation reply needs an edit + collector for Confirmator.setup
            reply.send.resolves({
                edit: sinon.stub().resolves(),
                createMessageComponentCollector: sinon.stub().returns({ on: sinon.stub() }),
                guild: { id: `g1` },
                client: message.client
            })
            await remindCommand.edit(client, reply, message, (k) => k, `>`, `123`, `1`)
            const sentKeys = reply.send.getCalls().map(c => c.args[0])
            expect(sentKeys).to.include(`REMINDER.EDIT_CONFIRMATION`)
        })

        it(`_awaitTextInput returns trimmed content from the channel collector`, async () => {
            const first = { content: `  hello there  ` }
            const collected = { first: () => first }
            const messageRef = {
                channel: { awaitMessages: sinon.stub().resolves(collected) }
            }
            const result = await remindCommand._awaitTextInput(messageRef, `123`)
            expect(result).to.equal(`hello there`)
        })

        it(`_awaitTextInput returns null on timeout`, async () => {
            const messageRef = {
                channel: { awaitMessages: sinon.stub().rejects(new Map()) }
            }
            const result = await remindCommand._awaitTextInput(messageRef, `123`)
            expect(result).to.be.null
        })

        it(`_awaitTextInput returns null when the channel can't collect`, async () => {
            const result = await remindCommand._awaitTextInput({ channel: null }, `123`)
            expect(result).to.be.null
        })
    })
})
