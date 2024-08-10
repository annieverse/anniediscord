"use strict"
const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits } = require(`discord.js`)
const chunkOptions = require(`../../utils/chunkArray`)
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
    name: `viewdata`,
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
    description: `Retrieve data about users in guild pertaining to whose used a command`,
    /**
     * Define how to use the command. Include optional arguments/flags if needed
     * @required
     * @type {string}
     */
    usage: `viewdata`,
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
        return this.run(client, reply, interaction)
    },
    async run(client, reply, messageRef) {
        const formatedData = []
        const results = await client.db.custom.retrieveData(messageRef.guild.id)
        results.forEach(element => {
            const user = !element.user_id ? `Unknown User/UnClaimed` : messageRef.guild.members.resolve(element.user_id)
            const wallet = element.wallet
            formatedData.push(`- ${user}: \`${wallet}\``)
        })

        const dataToDisplay = chunkOptions(formatedData, 10)
        const formatedDataToDisplay = []
        dataToDisplay.forEach(element => formatedDataToDisplay.push(element.join(`\n`)))
        return await reply.send(formatedDataToDisplay, {
            paging: true,
            header: `All entries for ${messageRef.guild.name}`,
            ephemeral: true
        })
    },
}