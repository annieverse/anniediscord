"use strict"
const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits } = require(`discord.js`)
const stringSimilarity = require(`string-similarity`)
/**
 * Command's Class description
 * @author yourname
 */
module.exports = {
    /**
     * Define the file name (without the extension!)
     * @required
     * @type {string}
     */
    name: `setitem`,
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
    description: `Set the item you want to use for the leaderboard.`,
    /**
     * Define how to use the command. Include optional arguments/flags if needed
     * @required
     * @type {string}
     */
    usage: `setitem <item>`,
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
    messageCommand: true,
    /**
     * Use 'PermissionFlagsBits' to define the command's Permission level. (Most of the time you will not need to define this)
     * By seeting this property only users with the same or higher permission level will be able to use and see the command.
     * @Optional Only if applicationCommand is true and you need specific permissions
     * @type {PermissionFlagsBits}
     */
    default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
    /**
     * Define the command's options. This is what is used as an argument for the command (Application commands only).
     * @required for ONLY ApplicationCommands
     * @type {Array}
     */
    options: [{
        name: `item`, // Must be all lowercase
        description: `The item name or Id`,
        required: true,
        type: ApplicationCommandOptionType.String
    }],
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
    server_specific: [`577121315480272908`],
    /**
     * Any other properties you want to add to the command.
     */
    configId: `AVARIKSAGA_LB_ITEM`,
    /**
     * The executed function upon command invocation.
     * The standard provided prarameters are writen in sequence below
     * [client, reply, message, arg, locale]
     * @required Only for MessageCommands
     * @type {function}
     */
    async execute(client, reply, message, arg, locale) {
        return this.run(client, reply, message, locale, arg)
        // ... Your command ran here.
    },
    /**
     * The executed function upon command invocation.
     * The standard provided prarameters are writen in sequence below
     * [client, reply, interaction, options, locale]
     * @required Only for ApplicationCommands
     * @type {function}
     */
    async Iexecute(client, reply, interaction, options, locale) {
        const arg = options.getString(`item`)
        return this.run(client, reply, interaction, locale, arg)
    },
    async run(client, reply, messageRef, locale, arg) {
        // ... Your command ran here.
        // Only carry over the arguments you need.
        //  Find best match
        const searchStringResult = stringSimilarity.findBestMatch(answerName, availableItems.map(i => i.name.toLowerCase()))
        const item = searchStringResult.bestMatch.rating >= 0.5
            //  By name
            ?
            availableItems.find(i => i.name.toLowerCase() === searchStringResult.bestMatch.target)
            //  Fallback search by ID
            :
            availableItems.find(i => parseInt(i.item_id) === parseInt(answerName))
        if (!item) return await reply.send(`I'm sorry no item under that name or Id, please try again`)
        console.log(item)
        console.log(item).item_id
        // client.db.guildUtils.updateGuildConfiguration({
        //     configCode: this.configId,
        //     customizedParameter: item,
        //     guild: message.guild,
        //     setByUserId: message.author.id,
        //     cacheTo: message.guild.configs
        // })
        return await reply.send(`The item has been set to ${item.name}`)
    }
}