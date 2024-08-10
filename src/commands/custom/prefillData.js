"use strict"
const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits } = require(`discord.js`)
/**
 * Command's Class description
 * ONLY for Avarik Saga
 * @author Andrew
 * @module 
 */
module.exports = {
    /**
     * Define the file name (without the extension!)
     * @required
     * @type {string}
     */
    name: `prefilldata`,
    /**
     * Define accepted aliases. User will be able to call the command with these alternative names.
     * @required
     * @type {object}
     */
    aliases: [],
    /**
     * Make a short, clear and concise command's description
     * @required
     * @type {string}
     */
    description: `Add records to database`,
    /**
     * Define how to use the command. Include optional arguments/flags if needed
     * @required
     * @type {string}
     */
    usage: `prefilldata`,
    /**
     * Define the minimum permission level to use the command. Refer to ./src/config/permissions.js for more info
     * @required
     * @type {number}
     */
    permissionLevel: 2,
    /**
     * Define if the command allows for a user as an arguement and needs the user metadata.
     * @required
     * @type {boolean}
     */
    multiUser: false,
    /**
     * Define if the command is an application command or not. If it is, it will be available to all guilds. (Application commands are slash commands)
     * @required
     * @type {boolean}
     */
    applicationCommand: true,
    /**
     * Define if the command is a regualr text command or not. If it is, it will be available to all guilds. (message commands are for example '!help')
     * @required
     * @type {boolean}
     */
    messageCommand: false,
    /**
     * Use 'ApplicationCommandType' to define the command's type. (Most of the time it will always be 'ChatInput')
     * @required Only if applicationCommand is true
     * @type {ApplicationCommandType}
     */
    type: ApplicationCommandType.ChatInput,
    /**
     * Define if the command is to be used in specific servers
     * @required
     * @type {boolean}
     */
    server_specific: true,
    /**
     * Define what servers the command is used in. 
     * @required ONLY if "server_specific" is set to true.
     * @type {Array}
     */
    servers: [`577121315480272908`, `1242130891363454996`],
    default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
    /**
    * Define the command's options. This is what is used as an argument for the command (Application commands only).
    * @required for ONLY ApplicationCommands
    * @type {Array}
    */
    options: [{
        name: `insert`, // Must be all lowercase
        description: `insert value to compare againt`,
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `value`,
            description: `the value to record`,
            required: true,
            type: ApplicationCommandOptionType.String
        }]
    }, {
        name: `remove`, // Must be all lowercase
        description: `remove value`,
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `value`,
            description: `the value to search by`,
            required: true,
            type: ApplicationCommandOptionType.String
        }]
    }, {
        name: `modify`, // Must be all lowercase
        description: `what data to modify`,
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [{
            name: `by_user`,
            description: `user's data to modify by user`,
            type: ApplicationCommandOptionType.Subcommand,
            options: [{
                name: `user`,
                description: `user's data to modify by user`,
                required: true,
                type: ApplicationCommandOptionType.User,
            }, {
                name: `replace_value_with`,
                description: `replace the value with what?`,
                required: true,
                type: ApplicationCommandOptionType.String,
            }]
        }, {
            name: `by_value`,
            description: `user's data to modify by value`,
            type: ApplicationCommandOptionType.Subcommand,
            options: [{
                name: `value_to_search_by`,
                description: `original value recorded`,
                required: true,
                type: ApplicationCommandOptionType.String,
            }, {
                name: `replace_value_with`,
                description: `replace the value with what?`,
                required: true,
                type: ApplicationCommandOptionType.String,
            }]
        }]
    },
    ],
    /**
     * Any other properties you want to add to the command.
     */
    /**
     * The executed function upon command invocation.
     * The standard provided prarameters are writen in sequence below
     * [client, reply, message, arg, locale]
     * @required Only for MessageCommands
     * @type {function}
     */
    async execute(client, reply, message, arg, locale) {
        return
    },
    /**
     * The executed function upon command invocation.
     * The standard provided prarameters are writen in sequence below
     * [client, reply, interaction, options, locale]
     * @required Only for ApplicationCommands
     * @type {function}
     */
    async Iexecute(client, reply, interaction, options, locale) {
        const insert = options.getSubcommand() === `insert`
        const remove = options.getSubcommand() === `remove`
        const modify = options.getSubcommandGroup() === `modify`
        const values = []
        const command = []
        if (insert) {
            const value = options.getString(`value`)
            values.push(value)
            command.push(`insert`)
        } else if (remove) {
            const value = options.getString(`value`)
            values.push(value)
            command.push(`remove`)
        } else if (modify) {
            const byUser = options.getSubcommand() === `by_user`
            const byValue = options.getSubcommand() === `by_value`
            const value = options.getString(`replace_value_with`)
            values.push(value)
            if (byUser) {
                command.push(`by_user`)
                const user = options.getUser(`user`)
                values.push(user.id)
            } else if (byValue) {
                command.push(`by_value`)
                const valueSearchBy = options.getString(`value_to_search_by`)
                values.push(valueSearchBy)
            }
        } else {
            return await reply.send(`no valid command ran`, { ephemeral: true })
        }

        return this.run(client, reply, interaction, command, values)
    },
    async run(client, reply, messageRef, command, values) {
        const NoChanges = `NO_CHANGES`
        const guildId = messageRef.guild.id
        const results = [`INSERT`, NoChanges, `DELETE`]
        const secondaryResults = [`UPDATE`, NoChanges]
        const cmd = command.toString()
        const validCmds = [`insert`, `remove`, `by_user`, `by_value`]
        if (!validCmds.includes(cmd)) return await reply.send(`no valid command ran`, { ephemeral: true })
        if (cmd === validCmds[0]) {
            // Insert
            const value = values.toString()
            const res = await client.db.custom.prefillData(value, guildId)
            if (!results.includes(res) || res === NoChanges) return await reply.send(`Data was not added as it may already exist or an error occured.`, { ephemeral: true })
            return await reply.send(`Data was entered and saved, a user may try to claim it now via \`setwallet\`.`, { ephemeral: true })
        }
        if (cmd === validCmds[1]) {
            // Remove
            const value = values.toString()
            const res = await client.db.custom.removeData(value, guildId)
            if (!results.includes(res) || res === NoChanges) return await reply.send(`Data was not removed as it may already be gone or an error occured.`, { ephemeral: true })
            return await reply.send(`Data was deleted.`, { ephemeral: true })
        }
        if (cmd === validCmds[2] || cmd === validCmds[3]) {
            // Modify by user
            const value = values[0]
            const valueSearchBy = values[1]
            const result = await client.db.custom.modifyData(guildId, valueSearchBy, value)
            if (!secondaryResults.includes(result) || result === NoChanges) return await reply.send(`Data was not modified/changed as no data entered matched any records.`, { ephemeral: true })
            return await reply.send(`wallet has been updated`, { ephemeral: true })
        }
        return
    },
}