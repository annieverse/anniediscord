const GUI = require(`../../ui/prebuild/level`)
const User = require(`../../libs/user`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
    /**
     * Display your current exp, level and rank.
     * @author klerikdust
     */
module.exports = {
    name: `level`,
    aliases: [`lvl`, `lv`],
    description: `Display your current exp, level and rank.`,
    usage: `level <User>(Optional)`,
    permissionLevel: 0,
    applicationCommand: true,
    type: ApplicationCommandType.ChatInput,
    options: [{
        name: `user`,
        description: `Display the level of the specified user`,
        required: false,
        type: ApplicationCommandOptionType.User
    }],
    async execute(client, reply, message, arg, locale) {
        //  Handle if the EXP module isn't enabled in current guild
        if (!message.guild.configs.get(`EXP_MODULE`).value) return reply.send(locale.COMMAND.DISABLED, {
            socket: { command: `EXP Module` },
        })
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
        if (!targetUser) return reply.send(locale.USER.IS_INVALID)
            //  Normalize structure
        targetUser = targetUser.master || targetUser
        const userData = await userLib.requestMetadata(targetUser, 2)
        reply.send(locale.COMMAND.FETCHING, {
                simplified: true,
                socket: {
                    emoji: await client.getEmoji(`790994076257353779`),
                    user: targetUser.id,
                    command: `level`
                }
            })
            .then(async loading => {
                await reply.send(locale.COMMAND.TITLE, {
                    simplified: true,
                    prebuffer: true,
                    image: await new GUI(userData).build(),
                    socket: {
                        emoji: await client.getEmoji(`692428597570306218`),
                        user: targetUser.username,
                        command: `Level`
                    }
                })
                return loading.delete()
            })
    },
    async Iexecute(client, reply, interaction, options, locale) {
        //  Handle if the EXP module isn't enabled in current guild
        if (!interaction.guild.configs.get(`EXP_MODULE`).value) return reply.send(locale.COMMAND.DISABLED, {
            socket: { command: `EXP Module` },
        })
        const userLib = new User(client, interaction)
        let targetUser = interaction.options.getUser(`user`) || interaction.member.user
        
        const userData = await userLib.requestMetadata(targetUser, 2)
        reply.send(locale.COMMAND.FETCHING, {
                simplified: true,
                socket: {
                    emoji: await client.getEmoji(`790994076257353779`),
                    user: targetUser.id,
                    command: `level`
                }
            })
            .then(async loading => {
                await reply.send(locale.COMMAND.TITLE, {
                    simplified: true,
                    prebuffer: true,
                    image: await new GUI(userData).build(),
                    socket: {
                        emoji: await client.getEmoji(`692428597570306218`),
                        user: targetUser.username,
                        command: `Level`
                    },
                    followUp: true
                })
                
                return loading.delete()
            })
    }
}