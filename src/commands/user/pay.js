const User = require(`../../libs/user`)
const Confirmator = require(`../../libs/confirmator`)
const GUI = require(`../../ui/prebuild/pay`)
const commanifier = require(`../../utils/commanifier`)
const trueInt = require(`../../utils/trueInt`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
    /**
     * Share artcoins with your friends!
     * @author klerikdust
     */
module.exports = {
        name: `pay`,
        aliases: [`pay`, `transfer`, `transfers`, `share`, `give`],
        description: `Share artcoins with your friends!`,
        usage: `pay <User>`,
        permissionLevel: 0,
        applicationCommand: true,
        requirementLevel: 3,
        tax: 0.02,
        maxAllowed: 999999,
        options:[
            {
                name: `pay`,
                description: `Pay a user`,
                type: ApplicationCommandOptionType.Subcommand,
                options: [{
                    name: `user`,
                    description: `The user you want to pay`,
                    required: true,
                    type: ApplicationCommandOptionType.User
                },{
                    name: `amount`,
                    description: `The amount of artcoins you want to pay`,
                    required: true,
                    type: ApplicationCommandOptionType.Integer,
                    min_value: 1,
                    max_value: 9999999
            }]
        },{
            name: `how`,
            description: `How to pay a user`,
            type: ApplicationCommandOptionType.Subcommand
        }],
        type: ApplicationCommandType.ChatInput,
        async execute(client, reply, message, arg, locale) {
            const userLib = new User(client, message)
            const userData = await userLib.requestMetadata(message.author, 2)
                //  Returns if user level is below the requirement
            if (userData.exp.level < this.requirementLevel) return reply.send(locale.PAY.LVL_TOO_LOW, { socket: { level: this.requirementLevel } })
                //  Displays as guide if user doesn't specify any parameter
            if (!arg) return reply.send(locale.PAY.SHORT_GUIDE, {
                header: `Hi, ${message.author.username}`,
                image: `banner_pay`,
                socket: { prefix: client.prefix }
            })
            let targetUser = await userLib.lookFor(arg)
            if (!targetUser) return reply.send(locale.USER.IS_INVALID)
            arg = arg.replace(targetUser.usedKeyword + ` `, ``)
            targetUser = targetUser.master || targetUser
                //  Handle if user is trying to pay themselves
            if (userLib.isSelf(targetUser.id)) return reply.send(locale.PAY.SELF_TARGETING, { socket: { emoji: await client.getEmoji(`692428748838010970`) } })
                //  Parse amount of artcoins to be send
            const amountToSend = arg.replace(/\D/g, ``)
                //  Handle if user not specifying the amount to send
            if (!amountToSend) return reply.send(locale.PAY.INVALID_AMOUNT)
                //  Handle if user isn't inputting valid amount to send
            if (!trueInt(amountToSend)) return reply.send(locale.PAY.INVALID_NUMBER)
                //  Handle if user inputted amount to send way above limit.
            if (amountToSend > this.maxAllowed) return reply.send(locale.PAY.EXCEEDING_LIMIT, { socket: { limit: commanifier(this.maxAllowed) } })
                //  Parse amount of tax to be deducted from the transaction
            const amountOfTax = amountToSend * this.tax
            const total = Math.round(amountToSend - amountOfTax)
                //  Render confirmation
            const targetUserData = await userLib.requestMetadata(targetUser, 2)
            const confirmation = await reply.send(locale.PAY.USER_CONFIRMATION, {
                        prebuffer: true,
                        image: await new GUI(targetUserData, total).build(),
                        socket: {
                            user: targetUser.username,
                            amount: `${await client.getEmoji(`758720612087627787`)} ${commanifier(total)}`
			}
		})
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(() => {
            //  Handle if user trying to send artcoins above the amount they had
            if (userData.inventory.artcoins < amountToSend) return reply.send(locale.PAY.INSUFFICIENT_BALANCE)
 			//  Send artcoins to target user
			client.db.updateInventory({itemId: 52, value: total, userId: targetUser.id, guildId: message.guild.id})
			//  Deduct artcoins from sender's balance
			client.db.updateInventory({itemId: 52, value: amountToSend, operation: `-`, userId: message.author.id, guildId: message.guild.id})
 			reply.send(``, {
 				customHeader: [`${targetUser.username} has received your artcoins!♡`, targetUser.displayAvatarURL()],
 				socket:{target: targetUser.username} 
 			})
 		})
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const userLib = new User(client, interaction)
            const userData = await userLib.requestMetadata(interaction.member.user, 2)
                //  Returns if user level is below the requirement
            if (userData.exp.level < this.requirementLevel) return reply.send(locale.PAY.LVL_TOO_LOW, { socket: { level: this.requirementLevel } })
                //  Displays as guide if user doesn't specify any parameter
            if (interaction.options.getSubcommand()==`how`) return reply.send(locale.PAY.SHORT_GUIDE, {
                header: `Hi, ${interaction.member.user.username}`,
                image: `banner_pay`,
                socket: { prefix: `/` }
            })
            let targetUser = interaction.options.getUser(`user`)
            if (!targetUser) return reply.send(locale.USER.IS_INVALID)
                //  Handle if user is trying to pay themselves
            if (userLib.isSelf(targetUser.id)) return reply.send(locale.PAY.SELF_TARGETING, { socket: { emoji: await client.getEmoji(`692428748838010970`) } })
                //  Parse amount of artcoins to be send
            const amountToSend = interaction.options.getInteger(`amount`)
                //  Parse amount of tax to be deducted from the transaction
            const amountOfTax = amountToSend * this.tax
            const total = Math.round(amountToSend - amountOfTax)
                //  Render confirmation
            const targetUserData = await userLib.requestMetadata(targetUser, 2)
            const confirmation = await reply.send(locale.PAY.USER_CONFIRMATION, {
                        prebuffer: true,
                        image: await new GUI(targetUserData, total).build(),
                        socket: {
                            user: targetUser.username,
                            amount: `${await client.getEmoji(`758720612087627787`)} ${commanifier(total)}`
			}
		})
        const c = new Confirmator(interaction, reply, true)
        await c.setup(interaction.member.id, confirmation)
        c.onAccept(() => {
            //  Handle if user trying to send artcoins above the amount they had
            if (userData.inventory.artcoins < amountToSend) return reply.send(locale.PAY.INSUFFICIENT_BALANCE,{followUp:true})
 			//  Send artcoins to target user
			client.db.updateInventory({itemId: 52, value: total, userId: targetUser.id, guildId: interaction.guild.id})
			//  Deduct artcoins from sender's balance
			client.db.updateInventory({itemId: 52, value: amountToSend, operation: `-`, userId: interaction.member.id, guildId: interaction.guild.id})
 			reply.send(``, {
 				customHeader: [`${targetUser.username} has received your artcoins!♡`, targetUser.displayAvatarURL()],
 				socket:{target: targetUser.username},
                followUp: true
 			})
 		})
    }
}