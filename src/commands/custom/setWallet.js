"use strict"
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
const testRole = require(`../../utils/testRole`)
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
    name: `setwallet`,
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
    description: `Link wallet to you user`,
    /**
     * Define how to use the command. Include optional arguments/flags if needed
     * @required
     * @type {string}
     */
    usage: `setwallet <address>`,
    /**
     * Define the minimum permission level to use the command. Refer to ./src/config/permissions.js for more info
     * @required
     * @type {number}
     */
    permissionLevel: 0,
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
     * Define the command's options. This is what is used as an argument for the command (Application commands only).
     * @required for ONLY ApplicationCommands
     * @type {Array}
     */
    options: [{
        name: `remove`, // Must be all lowercase
        description: `Remove your address`,
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `address`, // Must be all lowercase
        description: `Your address you would like to link`,
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `set`,
            description: `Set a wallet address.`,
            required: true,
            type: ApplicationCommandOptionType.String
        }]
    },
    ],
    /**
     * Use 'ApplicationCommandType' to define the command's type. (Most of the time it will always be 'ChatInput')
     * @required Only if applicationCommand is true
     * @type {ApplicationCommandType}
     */
    type: ApplicationCommandType.ChatInput,
    contexts: [0],
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
    servers: [`577121315480272908`, `882552960771555359`, `1242130891363454996`],
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
        if (options.getSubcommand() === `remove`) return this.delete(client, reply, interaction)
        if (options.getSubcommand() === `address`) {
            const arg = options.getString(`set`)
            return this.run(client, reply, interaction, arg)
        }
    },
    async run(client, reply, messageRef, arg) {
        const grimHeadServer = messageRef.guild.id === `1242130891363454996`
        const annieSupportServer = messageRef.guild.id === `577121315480272908`
        if (grimHeadServer || annieSupportServer) {
            const result = await this.addGrimHeadProjectWallet(client, messageRef, arg)
            if (result === 1) return await reply.send(`Your address has not been verified or changed, please try a different address`, { ephemeral: true })
            if (result === 2) return await reply.send(`Your address has been verified/changed but no role added yet`, { ephemeral: true })
            if (result === 3) return await reply.send(`Role is gone or is not able to be removed`, { ephemeral: true })
            if (result === 4) return await reply.send(`Your address has been verified/changed and role has been added`, { ephemeral: true })
            if (result === 6) return await reply.send(`Your address has been verified/changed and you have the role already.`, { ephemeral: true })
            if (result === 5) return await reply.send(`Your address has been claimed already, please try a different one. If you believe this is a mistake or need to update the record, please let a Moderator know.`, { ephemeral: true })
        } else {
            // this.addAvarikSagaWallet(client, messageRef, arg)
        }
        return await reply.send(`Your address has been set`, { ephemeral: true })
    },
    async delete(client, reply, messageRef, arg) {
        if (messageRef.guild.id === `1242130891363454996` || messageRef.guild.id === `577121315480272908`) {
            const result = this.removeGrimHeadProjectWallet(client, messageRef, arg)
            if (result === 1) return await reply.send(`Wallet has been deleted but, Role is gone or is not able to be removed`, { ephemeral: true })
            if (result === 2) return await reply.send(`Wallet has been deleted and role has been removed`, { ephemeral: true })
        } else {
            // this.removeAvarikSagaWallet(client, messageRef)
        }

        return await reply.send(`Your address has been removed`, { ephemeral: true })
    },
    async addGrimHeadProjectWallet(client, messageRef, arg) {
        const res = await client.db.custom.verifyData(arg, messageRef.guild.id)
        const results = [`FOUND_RECORD`, `NO_RECORD`, `INSERT`]
        if (!results.includes(res) || res === `NO_RECORD`) return 1

        const claimed = await client.db.custom.claimDataEntry(messageRef.member.user.id, arg, messageRef.guild.id)
        if (!results.includes(claimed) || res === `NO_CHANGES`) return 5
        const customRole = messageRef.guild.configs.get(`CUSTOM_ROLE`).value
        if (customRole == ``) return 2
        const test = testRole(client, customRole, messageRef.guild, messageRef.member)
        if (!test.result) return 3
        try {
            if (messageRef.member.roles.cache.has(test.roleId)) return 6
            await messageRef.member.roles.add(test.roleId)
        } catch (error) {
            return 2
        }
        return 4
    },
    async removeGrimHeadProjectWallet(client, messageRef) {
        await client.db.custom.customWalletDelete(messageRef.member.user.id, messageRef.guild.id)
        const customRole = messageRef.guild.configs.get(`CUSTOM_ROLE`).value
        if (customRole == ``) return 1
        const test = testRole(client, customRole, messageRef.guild, messageRef.member)
        if (!test.result) return 1
        messageRef.member.roles.remove(test.role)
        return 2
    },
    async addAvarikSagaWallet(client, messageRef, arg) {
        return client.db.custom.setWalletAddress(messageRef.member.user.id, arg)
    },
    async removeAvarikSagaWallet(client, messageRef) {
        return client.db.custom.deleteWalletAddress(messageRef.member.user.id)
    }
}