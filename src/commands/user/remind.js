"use strict"
const moment = require(`moment`)
const Confirmator = require(`../../libs/confirmator`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Never forget things. Ask Annie to reminds you anytime!
 * @author klerikdust
 */
module.exports = {
    name: `remind`,
    aliases: [`remind`, `rmd`, `reminds`, `reminder`, `remindme`],
    description: `Never forget things. Ask Annie to reminds you anytime!`,
    usage: `remind <message> <time> | remind list | remind delete <id>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `create`,
        description: `Set a brand new reminder`,
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `message`,
            description: `The message to be reminded`,
            required: true,
            type: ApplicationCommandOptionType.String
        },
        {
            name: `in_how_long`,
            description: `when to remind`,
            required: true,
            type: ApplicationCommandOptionType.Integer
        },
        {
            name: `time_unit`,
            description: `the time unit to be used`,
            required: true,
            choices: [
                { name: `seconds`, value: `seconds` },
                { name: `minutes`, value: `minutes` },
                { name: `hours`, value: `hours` },
                { name: `days`, value: `days` }
            ],
            type: ApplicationCommandOptionType.String
        }]
    },
    {
        name: `list`,
        description: `View all of your active reminders`,
        type: ApplicationCommandOptionType.Subcommand
    },
    {
        name: `edit`,
        description: `Edit the message and timer of one of your active reminders`,
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `id`,
            description: `The id of the reminder (as shown in 'remind list')`,
            required: true,
            type: ApplicationCommandOptionType.Integer
        }]
    },
    {
        name: `delete`,
        description: `Delete one of your active reminders`,
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `id`,
            description: `The id of the reminder (as shown in 'remind list')`,
            required: true,
            type: ApplicationCommandOptionType.Integer
        }]
    }],
    type: ApplicationCommandType.ChatInput,

    /**
     * Keywords that route to the "list" action in message mode.
     * @type {array}
     */
    listAliases: [`list`, `ls`, `all`, `active`],

    /**
     * Keywords that route to the "delete" action in message mode.
     * @type {array}
     */
    deleteAliases: [`delete`, `remove`, `del`, `rm`, `cancel`],

    /**
     * Keywords that route to the "edit" action in message mode.
     * @type {array}
     */
    editAliases: [`edit`, `update`, `change`, `modify`],

    /**
     * Timeout (ms) for each text prompt in the edit flow.
     * @type {number}
     */
    editPromptTimeout: 60000,

    /**
     * Maximum reminders rendered per page on the list view.
     * @type {number}
     */
    limitPerPage: 10,

    async execute(client, reply, message, arg, locale, prefix) {
        const args = arg ? arg.trim().split(` `) : []
        const action = args[0] ? args[0].toLowerCase() : null
        //  Displays guide and user's active reminders count
        if (!arg) {
            const userReminders = await client.reminders.getActiveReminders(message.author.id)
            const activeReminders = userReminders.length <= 0
                ? this._fill(locale(`REMINDER.HOME_NO_ACTIVE`), { emoji: await client.getEmoji(`692428969667985458`) })
                : this._fill(locale(`REMINDER.HOME_HAS_ACTIVE`), { size: userReminders.length, emoji: await client.getEmoji(`692428692999241771`) })
            return await reply.send(locale(`REMINDER.HOME`), {
                image: `banner_reminder`,
                socket: {
                    prefix: prefix,
                    activeReminders: activeReminders
                }
            })
        }
        //  Route to list view
        if (this.listAliases.includes(action)) return await this.list(client, reply, message, locale, prefix, message.author.id)
        //  Route to edit flow
        if (this.editAliases.includes(action)) return await this.edit(client, reply, message, locale, prefix, message.author.id, args.slice(1).join(` `).trim())
        //  Route to delete view
        if (this.deleteAliases.includes(action)) return await this.delete(client, reply, message, locale, prefix, message.author.id, args.slice(1).join(` `).trim())
        //  Otherwise treat the whole input as a new reminder
        const context = client.reminders.getContextFrom(arg, message.author.id)
        return await this.run(client, reply, locale, context)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const subcommand = options.getSubcommand()
        if (subcommand === `list`) return await this.list(client, reply, interaction, locale, `/`, interaction.member.id)
        if (subcommand === `edit`) return await this.edit(client, reply, interaction, locale, `/`, interaction.member.id, String(options.getInteger(`id`)))
        if (subcommand === `delete`) return await this.delete(client, reply, interaction, locale, `/`, interaction.member.id, String(options.getInteger(`id`)))
        //  Default to creating a reminder
        const reminderMessage = await options.getString(`message`)
        const reminderTimeAmount = await options.getInteger(`in_how_long`)
        const reminderTimeUnit = await options.getString(`time_unit`)
        const context = client.reminders.getContext(reminderMessage, reminderTimeAmount, reminderTimeUnit, interaction.member.id)
        return await this.run(client, reply, locale, context)
    },
    async run(client, reply, locale, context) {
        if (!context.isValidReminder) return await reply.send(locale(`REMINDER.INVALID_DATE`), {
            socket: {
                emoji: await client.getEmoji(`790338393015713812`),
                prefix: client.prefix
            }
        })
        client.reminders.register(context)
        return await reply.send(locale(`REMINDER.SUCCESSFUL`), {
            status: `success`,
            socket: {
                emoji: await client.getEmoji(`789212493096026143`),
                time: moment(context.remindAt.timestamp).fromNow()
            }
        })
    },

    /**
     * Displaying the user's active reminders, paginated when over the page limit.
     * @return {void}
     */
    async list(client, reply, messageRef, locale, prefix, userId) {
        const reminders = await client.reminders.getActiveReminders(userId)
        //  Handle if there are no active reminders
        if (reminders.length <= 0) return await reply.send(locale(`REMINDER.LIST_EMPTY`), {
            socket: {
                emoji: await client.getEmoji(`692428969667985458`),
                prefix: prefix
            }
        })
        const pages = this._parseReminderList(reminders, locale, {
            size: reminders.length,
            time: moment(reminders[0].remindAt.timestamp).fromNow(),
            emoji: await client.getEmoji(`692428692999241771`)
        })
        await reply.send(pages, {
            paging: true,
            header: `Your Reminders`,
            color: `crimson`
        })
        return await reply.send(locale(`REMINDER.LIST_TIP`), {
            simplified: true,
            socket: {
                prefix: prefix,
                emoji: await client.getEmoji(`848521358236319796`)
            }
        })
    },

    /**
     * Deleting one of the user's active reminders, gated behind a confirmation.
     * @return {void}
     */
    async delete(client, reply, messageRef, locale, prefix, userId, target) {
        const reminders = await client.reminders.getActiveReminders(userId)
        //  Handle if there are no active reminders to delete
        if (reminders.length <= 0) return await reply.send(locale(`REMINDER.DELETE_EMPTY`), {
            socket: { emoji: await client.getEmoji(`692428969667985458`) }
        })
        //  Handle if the user didn't provide an id
        if (!target || !target.length) return await reply.send(locale(`REMINDER.DELETE_MISSING_ID`), {
            socket: {
                emoji: await client.getEmoji(`692428969667985458`),
                prefix: prefix,
                list: this._parseSimplifiedList(reminders)
            }
        })
        //  Resolve the target reminder by 1-based list position or full id match
        const targetReminder = this._resolveTarget(reminders, target)
        //  Handle if the target reminder can't be found
        if (!targetReminder) return await reply.send(locale(`REMINDER.DELETE_NOT_FOUND`), {
            socket: {
                emoji: await client.getEmoji(`692428807193493657`),
                prefix: prefix
            }
        })
        //  Display delete confirmation
        const confirmation = await reply.send(locale(`REMINDER.DELETE_CONFIRMATION`), {
            socket: {
                emoji: await client.getEmoji(`692428578683617331`),
                message: this._trim(targetReminder.message),
                time: moment(targetReminder.remindAt.timestamp).fromNow()
            }
        })
        const c = new Confirmator(messageRef, reply, locale)
        await c.setup(userId, confirmation)
        c.onAccept(async () => {
            await client.reminders.deleteReminder(userId, targetReminder.id)
            await reply.send(locale(`REMINDER.DELETE_SUCCESSFUL`), {
                status: `success`,
                socket: { emoji: await client.getEmoji(`789212493096026143`) },
                followUp: true
            })
        })
    },

    /**
     * Editing one of the user's active reminders through two sequential prompts
     * (new message, then new timer), gated behind a confirmation that contrasts
     * the previous reminder against the new one.
     * @return {void}
     */
    async edit(client, reply, messageRef, locale, prefix, userId, target) {
        const reminders = await client.reminders.getActiveReminders(userId)
        //  Handle if there are no active reminders to edit
        if (reminders.length <= 0) return await reply.send(locale(`REMINDER.EDIT_EMPTY`), {
            socket: { emoji: await client.getEmoji(`692428969667985458`) }
        })
        //  Handle if the user didn't provide an id
        if (!target || !target.length) return await reply.send(locale(`REMINDER.EDIT_MISSING_ID`), {
            socket: {
                emoji: await client.getEmoji(`692428969667985458`),
                prefix: prefix,
                list: this._parseSimplifiedList(reminders)
            }
        })
        //  Resolve the target reminder
        const targetReminder = this._resolveTarget(reminders, target)
        if (!targetReminder) return await reply.send(locale(`REMINDER.EDIT_NOT_FOUND`), {
            socket: {
                emoji: await client.getEmoji(`692428807193493657`),
                prefix: prefix
            }
        })
        //  Prompt 1: the new message
        await reply.send(locale(`REMINDER.EDIT_PROMPT_MESSAGE`), {
            socket: {
                emoji: await client.getEmoji(`692428692999241771`),
                message: this._trim(targetReminder.message)
            }
        })
        const newMessage = await this._awaitTextInput(messageRef, userId)
        if (newMessage === null || newMessage.toLowerCase() === `cancel`) return await reply.send(locale(`REMINDER.EDIT_TIMEOUT`), {
            socket: {
                emoji: await client.getEmoji(`692428578683617331`),
                prefix: prefix
            }
        })
        //  Prompt 2: the new timer
        await reply.send(locale(`REMINDER.EDIT_PROMPT_TIME`), {
            socket: { emoji: await client.getEmoji(`692428692999241771`) }
        })
        const newDuration = await this._awaitTextInput(messageRef, userId)
        if (newDuration === null || newDuration.toLowerCase() === `cancel`) return await reply.send(locale(`REMINDER.EDIT_TIMEOUT`), {
            socket: {
                emoji: await client.getEmoji(`692428578683617331`),
                prefix: prefix
            }
        })
        //  Validate the new duration
        const newRemindAt = client.reminders.getDateFromDuration(newDuration)
        if (!newRemindAt) return await reply.send(locale(`REMINDER.EDIT_INVALID_TIME`), {
            socket: { emoji: await client.getEmoji(`790338393015713812`) }
        })
        //  Prompt 3: confirmation contrasting old vs new
        const confirmation = await reply.send(locale(`REMINDER.EDIT_CONFIRMATION`), {
            socket: {
                emoji: await client.getEmoji(`692428578683617331`),
                oldMessage: this._trim(targetReminder.message),
                oldTime: moment(targetReminder.remindAt.timestamp).fromNow(),
                newMessage: this._trim(newMessage),
                newTime: moment(newRemindAt.timestamp).fromNow()
            }
        })
        const c = new Confirmator(messageRef, reply, locale)
        await c.setup(userId, confirmation)
        c.onAccept(async () => {
            await client.reminders.editReminder({
                id: targetReminder.id,
                userId: userId,
                message: newMessage,
                remindAt: newRemindAt,
                registeredAt: targetReminder.registeredAt
            })
            await reply.send(locale(`REMINDER.EDIT_SUCCESSFUL`), {
                status: `success`,
                socket: {
                    emoji: await client.getEmoji(`789212493096026143`),
                    time: moment(newRemindAt.timestamp).fromNow()
                },
                followUp: true
            })
        })
    },

    /**
     * Resolving a reminder by its 1-based list position, falling back to a full id match.
     * @param {array} [reminders=[]] Source reminders (as ordered in the list view).
     * @param {string} [target=``] The user-supplied id/position.
     * @return {object|null}
     */
    _resolveTarget(reminders = [], target = ``) {
        const index = parseInt(target, 10)
        if (!isNaN(index) && index >= 1 && index <= reminders.length) return reminders[index - 1]
        return reminders.find(reminder => reminder.id === target) || null
    },

    /**
     * Awaiting a single line of text input from the user in the current channel.
     * Used to drive the sequential prompts of the edit flow.
     * @param {object} messageRef Current message/interaction instance (carries the channel).
     * @param {string} userId The user we should listen to.
     * @return {Promise<string|null>} The trimmed content, or null on timeout/no response.
     */
    async _awaitTextInput(messageRef, userId) {
        const channel = messageRef.channel
        if (!channel || typeof channel.awaitMessages !== `function`) return null
        try {
            const collected = await channel.awaitMessages({
                filter: m => m.author.id === userId,
                max: 1,
                time: this.editPromptTimeout,
                errors: [`time`]
            })
            const first = collected.first()
            return first ? first.content.trim() : null
        }
        catch (e) {
            //  awaitMessages rejects with the partial collection on timeout
            return null
        }
    },

    /**
     * Parsing active reminders into paginated, decorated strings.
     * @param {array} [reminders=[]] Source reminders (normalized & sorted).
     * @param {function} locale Locale lookup function.
     * @param {object} [header={}] Intro metadata (size, soonest time, emoji).
     * @return {array}
     */
    _parseReminderList(reminders = [], locale, header = {}) {
        const pages = []
        let str = ``
        let count = 0
        for (let i = 0; i < reminders.length; i++) {
            const reminder = reminders[i]
            str += this._fill(locale(`REMINDER.LIST_ENTRY`), {
                id: i + 1,
                message: this._trim(reminder.message),
                time: moment(reminder.remindAt.timestamp).fromNow(),
                date: moment(reminder.remindAt.timestamp).format(`lll`)
            })
            count++
            if (count >= this.limitPerPage || i === (reminders.length - 1)) {
                str += `\n╰──────────☆～*:;,．*╯`
                pages.push(str)
                str = ``
                count = 0
            } else {
                str += `\n⸻⸻⸻⸻\n`
            }
        }
        //  Prepend the intro line to the first page
        pages[0] = this._fill(locale(`REMINDER.LIST_INTRO`), {
            size: header.size,
            time: header.time,
            emoji: header.emoji
        }) + pages[0]
        return pages
    },

    /**
     * Parsing active reminders into a compact, single-line-per-entry list.
     * @param {array} [reminders=[]] Source reminders.
     * @return {string}
     */
    _parseSimplifiedList(reminders = []) {
        let str = ``
        for (let i = 0; i < reminders.length; i++) {
            str += `╰☆～(ID:${i + 1}) **${this._trim(reminders[i].message, 60)}**\n`
        }
        return str
    },

    /**
     * Trimming a reminder message down to a safe display length.
     * @param {string} [str=``] Target string.
     * @param {number} [breakpoint=100] Length before the string gets trimmed.
     * @return {string}
     */
    _trim(str = ``, breakpoint = 100) {
        if (str.length >= breakpoint) return str.substring(0, breakpoint) + `...`
        return str
    },

    /**
     * Filling {{token}} placeholders in a locale string with the supplied values.
     * @param {string} [template=``] Target locale string.
     * @param {object} [data={}] Token/value pairs.
     * @return {string}
     */
    _fill(template = ``, data = {}) {
        let out = template
        for (const key in data) {
            out = out.split(`{{${key}}}`).join(String(data[key]))
        }
        return out
    }
}
