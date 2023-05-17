const commanifier = require(`../../utils/commanifier`)
const Confirmator = require(`../../libs/confirmator`)
const trueInt = require(`../../utils/trueInt`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)

    /**
     * Converts Artcoins into EXP at the rate of 2:1
     * @author klerikdust
     */
module.exports = {
        name: `cartcoin`,
        aliases: [`convertac`, `acconvert`, `cartcoin`, `cartcoins`, `artcoinconvert`, `convertartcoin`],
        description: `Converts Artcoins into EXP at the rahttps://media.discordapp.net/attachments/527190439661404174/843838360396234763/unknown.png?size=64te of 1:8`,
        usage: `cartcoin <Amount>`,
        permissionLevel: 0,
        multiUser: false,
        applicationCommand: true,
        messageCommand: true,
        options: [
            {
                name: `all`,
                description: `Convert all of your Artcoins`,
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: `amount`,
                description: `choose the amount of Artcoins you want to convert`,
                type: ApplicationCommandOptionType.Subcommand,
                options: [{
                    name: `how_many`,
                    description: `How many Artcoins you wish to convert`, 
                    requied: true,  
                    type: ApplicationCommandOptionType.Integer,
                }]
            }
        ],
        type: ApplicationCommandType.ChatInput,
        artcoinsRatio: 8,
        async execute(client, reply, message, arg, locale) {
            //  Returns as guide if user doesn't specify any parameters
            if (!arg) return await reply.send(locale.CARTCOIN.SHORT_GUIDE, {
                image: `banner_cartcoins`,
                socket: {
                    emoji: await client.getEmoji(`692428692999241771`),
                    prefix: client.prefix
                },
                footer: `Keep in mind the conversion rate is 1:${this.artcoinsRatio}`
            })
            const userBalance = await client.db.userUtils.getUserBalance(message.author.id, message.guild.id)
            const amountToUse = arg.startsWith(`all`) ? userBalance : trueInt(arg)
                //  Returns if user amount input is below the acceptable threeshold
            if (!amountToUse || amountToUse < this.artcoinsRatio) return await reply.send(locale.CARTCOIN.INVALID_AMOUNT, {
                socket: {
                    emoji: await client.getEmoji(`692428748838010970`)
                }
            })
            const totalGainedExp = amountToUse / this.artcoinsRatio
            const confirmation = await reply.send(locale.CARTCOIN.CONFIRMATION, {
                thumbnail: message.author.displayAvatarURL(),
                notch: true,
                socket: {
                    emoji: await client.getEmoji(`758720612087627787`),
                    amount: commanifier(amountToUse),
                    gainedExp: commanifier(totalGainedExp)
                }
            })
            const c = new Confirmator(message, reply)
            await c.setup(message.author.id, confirmation)
            c.onAccept(async() => {
                        //  Returns if user's artcoins is below the amount of going to be used
                        if (userBalance < amountToUse) return await reply.send(locale.CARTCOIN.INSUFFICIENT_AMOUNT, {
                                        socket: {
                                            amount: `${await client.getEmoji(`758720612087627787`)}${commanifier(userBalance)}`,
                    emoji: await client.getEmoji(`790338393015713812`)
                }
            })
			//	Deduct balance & add new exp
			client.db.databaseUtils.updateInventory({
                itemId: 52,
                value: amountToUse, 
                operation: `-`, 
                userId: message.author.id, 
                guildId: message.guild.id
            })
			client.experienceLibs(message.member, message.guild, message.channel,locale).execute(totalGainedExp)
			return await reply.send(locale.CARTCOIN.SUCCESSFUL, {
				status: `success`,
				socket: {
					artcoins: `${await client.getEmoji(`758720612087627787`)} ${commanifier(amountToUse)}`,
					exp: `${commanifier(totalGainedExp)} EXP`
				}
			})
        })
        },
        async Iexecute(client, reply, interaction, options, locale) {
            const userBalance = await client.db.userUtils.getUserBalance(interaction.user.id, interaction.guild.id)
            const amountToUse = options.getSubcommand() == `all` ? userBalance : options.getInteger(`how_many`)
            
                //  Returns if user amount input is below the acceptable threeshold
            if (!amountToUse || amountToUse < this.artcoinsRatio) return await reply.send(locale.CARTCOIN.INVALID_AMOUNT, {
                socket: {
                    emoji: await client.getEmoji(`692428748838010970`)
                }
            })
            const totalGainedExp = amountToUse / this.artcoinsRatio
            const confirmation = await reply.send(locale.CARTCOIN.CONFIRMATION, {
                thumbnail: interaction.member.displayAvatarURL(),
                notch: true,
                socket: {
                    emoji: await client.getEmoji(`758720612087627787`),
                    amount: commanifier(amountToUse),
                    gainedExp: commanifier(totalGainedExp)
                }
            })
            const c = new Confirmator(interaction, reply, true)
            await c.setup(interaction.member.id, confirmation)
            c.onAccept(async() => {
                await interaction.fetchReply()
                        //  Returns if user's artcoins is below the amount of going to be used
                        if (userBalance < amountToUse) return await reply.send(locale.CARTCOIN.INSUFFICIENT_AMOUNT, {
                                        socket: {
                                            amount: `${await client.getEmoji(`758720612087627787`)}${commanifier(userBalance)}`,
                    emoji: await client.getEmoji(`790338393015713812`)
                }
            })
            //	Deduct balance & add new exp
            client.db.databaseUtils.updateInventory({
                itemId: 52,
                value: amountToUse, 
                operation: `-`, 
                userId: interaction.member.id, 
                guildId: interaction.guild.id
            })
            client.experienceLibs(interaction.member, interaction.guild, interaction.channel,locale).execute(totalGainedExp)
            return await reply.send(locale.CARTCOIN.SUCCESSFUL, {
                status: `success`,
                socket: {
                    artcoins: `${await client.getEmoji(`758720612087627787`)} ${commanifier(amountToUse)}`,
                    exp: `${commanifier(totalGainedExp)} EXP`
                },
                followUp: true
            })
            })
        }
}