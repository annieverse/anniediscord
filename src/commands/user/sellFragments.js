const User = require(`../../libs/user`)
const Confirmator = require(`../../libs/confirmator`)
const GUI = require(`../../ui/prebuild/sellFragment`)
const commanifier = require(`../../utils/commanifier`)
const trueInt = require(`../../utils/trueInt`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * Exchange all your unused fragments into artcoins!
 * @author klerikdust
 */
module.exports = {
    name: `sellfragments`,
    aliases: [`sellfrag`, `sellfragments`, `sellfrags`, `sellfragment`],
    description: `Exchange all your unused fragments into artcoins!`,
    usage: `sellfragments <amount/all>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    options: [{
            name: `all`,
            description: `Sell all your fragments`,
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: `specific`,
            description: `The amount of fragments you want to sell`,
            type: ApplicationCommandOptionType.Subcommand,
            options: [{
                name: `amount`,
                description: `The amount of fragments you want to sell`,
                required: true,
                type: ApplicationCommandOptionType.Integer,
                min_value: 5,
            }]
        }
    ],
    type: ApplicationCommandType.ChatInput,
    rate: 5,
    minimumToSell: 5,
    async execute(client, reply, message, arg, locale) {
        //  Display guild if user doesn't specify any arg
        if (!arg) return await reply.send(locale.SELLFRAGMENTS.GUIDE, {
            header: `Hi, ${message.author.username}!`,
            image: `banner_sellfragments`,
            socket: {
                prefix: client.prefix,
                emoji: await client.getEmoji(`700731914801250324`),
                emojiFragment: await client.getEmoji(`577121735917174785`),
                rate: `${this.rate}:1`,
                min: this.minimumToSell
            }
        })
        const userData = await (new User(client, message)).requestMetadata(message.author, 2)
        //  Handle if user doesn't have any fragments in their inventory
        if (!userData.inventory.fragments) return await reply.send(locale.SELLFRAGMENTS.EMPTY_FRAGMENTS, {
            socket: {
                emoji: await client.getEmoji(`692428748838010970`)
            },
        })
        //  Handle if user specified an invalid amount
        const amountToSell = arg.startsWith(`all`) ? userData.inventory.fragments : trueInt(arg)
        if (!amountToSell) return await reply.send(locale.SELLFRAGMENTS.INVALID_AMOUNT)
        //  Handle if user's specified amount is lower than the minimum sell 
        if (amountToSell < this.minimumToSell) return await reply.send(locale.SELLFRAGMENTS.AMOUNT_TOO_LOW, {
            socket: {
                amount: this.minimumToSell,
                emoji: await client.getEmoji(`692428748838010970`)
            }
        })
        //  Calculate amount to receive
        const receivedAmount = Math.floor(amountToSell / this.rate)
        //  Confirmation
        const confirmation = await reply.send(locale.SELLFRAGMENTS.CONFIRMATION, {
            prebuffer: true,
            image: await new GUI(userData, receivedAmount).build(),
            socket: {
                fragmentsAmount: commanifier(amountToSell),
                artcoinsAmount: commanifier(receivedAmount),
                fragmentsEmoji: await client.getEmoji(`577121735917174785`),
                artcoinsEmoji: await client.getEmoji(`758720612087627787`)
            }
        })
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async () => {
            //  Prevent user from selling over the amount of their owned fragments
            if (amountToSell > userData.inventory.fragments) return await reply.send(locale.SELLFRAGMENTS.INVALID_AMOUNT)
            //  Deliver artcoins to user's inventory
            client.db.updateInventory({
                itemId: 52,
                userId: message.author.id,
                guildId: message.guild.id,
                value: receivedAmount
            })
            //  Deduct fragments from user's inventory
            client.db.updateInventory({
                itemId: 51,
                userId: message.author.id,
                guildId: message.guild.id,
                value: amountToSell,
                operation: `-`
            })
            return await reply.send(``, {
                customHeader: [`Fragments has been sold!`, message.author.displayAvatarURL()]
            })
        })
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const userData = await (new User(client, interaction)).requestMetadata(interaction.member.user, 2)
        //  Handle if user doesn't have any fragments in their inventory
        if (!userData.inventory.fragments) return await reply.send(locale.SELLFRAGMENTS.EMPTY_FRAGMENTS, {
            socket: {
                emoji: await client.getEmoji(`692428748838010970`)
            },
        })
        //  Handle if user specified an invalid amount
        let arg = options.getInteger(`amount`)
        if (options.getSubcommand() == `all`) arg = userData.inventory.fragments
        if (!arg) return await reply.send(locale.SELLFRAGMENTS.GUIDE, {
            header: `Hi, ${interaction.member.user.username}!`,
            image: `banner_sellfragments`,
            socket: {
                prefix: `/`,
                emoji: await client.getEmoji(`700731914801250324`),
                emojiFragment: await client.getEmoji(`577121735917174785`),
                rate: `${this.rate}:1`,
                min: this.minimumToSell
            }
        })
        const amountToSell = options.getSubcommand() === `all` ? userData.inventory.fragments : options.getInteger(`amount`)
        if (!amountToSell) return await reply.send(locale.SELLFRAGMENTS.INVALID_AMOUNT)
        //  Handle if user's specified amount is lower than the minimum sell 
        if (amountToSell < this.minimumToSell) return await reply.send(locale.SELLFRAGMENTS.AMOUNT_TOO_LOW, {
            socket: {
                amount: this.minimumToSell,
                emoji: await client.getEmoji(`692428748838010970`)
            }
        })
        //  Calculate amount to receive
        const receivedAmount = Math.floor(amountToSell / this.rate)
        //  Confirmation
        const confirmation = await reply.send(locale.SELLFRAGMENTS.CONFIRMATION, {
            prebuffer: true,
            image: await new GUI(userData, receivedAmount).build(),
            socket: {
                fragmentsAmount: commanifier(amountToSell),
                artcoinsAmount: commanifier(receivedAmount),
                fragmentsEmoji: await client.getEmoji(`577121735917174785`),
                artcoinsEmoji: await client.getEmoji(`758720612087627787`)
            }
        })
        const c = new Confirmator(interaction, reply, true)
        await c.setup(interaction.member.id, confirmation)
        c.onAccept(async () => {
            //  Prevent user from selling over the amount of their owned fragments
            if (amountToSell > userData.inventory.fragments) return await reply.send(locale.SELLFRAGMENTS.INVALID_AMOUNT)
            //  Deliver artcoins to user's inventory
            client.db.updateInventory({
                itemId: 52,
                userId: interaction.member.id,
                guildId: interaction.guild.id,
                value: receivedAmount
            })
            //  Deduct fragments from user's inventory
            client.db.updateInventory({
                itemId: 51,
                userId: interaction.member.id,
                guildId: interaction.guild.id,
                value: amountToSell,
                operation: `-`
            })
            return await reply.send(``, {
                customHeader: [`Fragments has been sold!`, interaction.member.displayAvatarURL()],
                followUp: true
            })
        })
    }
}