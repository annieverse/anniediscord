"use strict"
const GUI = require(`../../ui/prebuild/profile`)
const Confirmator = require(`../../libs/confirmator`)
const User = require(`../../libs/user`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`)
const { isInteractionCallbackResponse } = require("../../utils/appCmdHelp")
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
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `bio`,
        description: `Set your profile bio/description`,
        required: true,
        type: ApplicationCommandOptionType.String,
        max_length: 156
    }],
    type: ApplicationCommandType.ChatInput,
    charactersLimit: 156,
    async execute(client, reply, message, arg, locale, prefix) {
        //  Handle if user doesn't specify the new bio/description
        if (!arg) return await reply.send(locale(`SETBIO.MISSING_ARG`), {
            image: `banner_setbio`,
            socket: {
                prefix: prefix
            }
        })
        //  Handle if user input is exceeding the character limit
        if (arg.length > this.charactersLimit) return await reply.send(locale(`SETBIO.EXCEEDING_LIMIT`), {
            socket: {
                emoji: await client.getEmoji(`692428578683617331`),
                chars: arg.length - this.charactersLimit
            }
        })
        return await this.run(client, reply, message, arg, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        let newBio = options.getString(`bio`)
        return await this.run(client, reply, interaction, newBio, locale)
    },
    async run(client, reply, instance, arg, locale) {
        let userData = await (new User(client, instance)).requestMetadata(instance.member.user, 2, locale)
        userData.main.bio = arg
        const rendering = await reply.send(locale(`SETBIO.RENDERING`), {
            simplified: true,
            socket: {
                emoji: await client.getEmoji(`790994076257353779`)
            }
        })
        let img = await new GUI(userData, client, {
            width: 320,
            height: 360
        }).build()
        const confirmation = await reply.send(locale(`SETBIO.PREVIEW_CONFIRMATION`), {
            prebuffer: true,
            image: img.png()
        })
        isInteractionCallbackResponse(rendering) ? rendering.resource.message.delete() : rendering.delete()
        const c = new Confirmator(instance, reply, locale)
        await c.setup(instance.member.id, confirmation)
        c.onAccept(async () => {
            client.db.userUtils.setUserBio(arg, instance.member.id)
            return await reply.send(``, {
                customHeader: [locale(`SETBIO.SET`), instance.member.displayAvatarURL()]
            })
        })
    }
}