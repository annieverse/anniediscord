const GUI = require(`../../ui/prebuild/profile`)
const Confirmator = require(`../../libs/confirmator`)
const User = require(`../../libs/user`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * Set user's profile bio/description
 * @author klerikdust
 */
module.exports = {
    name: `setbio`,
    aliases: [`setdescrip`, `sd`, `sb`, `setbio`, `setdesc`, `setdescription`, `setprofiledescription`, `setprofiledesc`],
    description: `Set your profile bio/description`,
    usage: `setbio <Message>`,
    permissionLevel: 0,
    charactersLimit: 156,
    applicationCommand: true,
    options: [{
        name: `bio`,
        description: `Set your profile bio/description`,
        required: true,
        type: ApplicationCommandOptionType.String,
        max_length: 156
    }],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale, prefix) {
        //  Handle if user doesn't specify the new bio/description
        if (!arg) return reply.send(locale.SETBIO.MISSING_ARG, {
            image: `banner_setbio`,
            socket: {
                prefix: prefix
            }
        })
        //  Handle if user input is exceeding the character limit
        if (arg.length > this.charactersLimit) return reply.send(locale.SETBIO.EXCEEDING_LIMIT, {
            socket: {
                emoji: await client.getEmoji(`692428578683617331`),
                chars: arg.length - this.charactersLimit
            }
        })
        let userData = await (new User(client, message)).requestMetadata(message.author, 2)
        userData.main.bio = arg
        const rendering = await reply.send(locale.SETBIO.RENDERING, {
            simplified: true,
            socket: {
                emoji: await client.getEmoji(`790994076257353779`)
            }
        })
        let img = await new GUI(userData, client, {
            width: 320,
            height: 360
        }).build()
        const confirmation = await reply.send(locale.SETBIO.PREVIEW_CONFIRMATION, {
            prebuffer: true,
            image: img.toBuffer()
        })
        rendering.delete()
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(() => {
            client.db.setUserBio(arg, message.author.id)
            return reply.send(``, {
                customHeader: [`Yay! your new profile's bio has been set!♡`, message.author.displayAvatarURL()]
            })
        })
    },
    async Iexecute(client, reply, interaction, options, locale) {
        let newBio = options.getString(`bio`)
        let userData = await (new User(client, interaction)).requestMetadata(interaction.member.user, 2)
        userData.main.bio = newBio
        const rendering = await reply.send(locale.SETBIO.RENDERING, {
            simplified: true,
            socket: {
                emoji: await client.getEmoji(`790994076257353779`)
            }
        })
        let img = await new GUI(userData, client, {
            width: 320,
            height: 360
        }).build()
        const confirmation = await reply.send(locale.SETBIO.PREVIEW_CONFIRMATION, {
            prebuffer: true,
            image: img.toBuffer(),
            followUp: true
        })
        rendering.delete()
        const c = new Confirmator(interaction, reply, true)
        await c.setup(interaction.member.id, confirmation)
        c.onAccept(() => {
            client.db.setUserBio(newBio, interaction.member.id)
            return reply.send(``, {
                customHeader: [`Yay! your new profile's bio has been set!♡`, interaction.member.displayAvatarURL()],
                followUp: true
            })
        })
    }
}