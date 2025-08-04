"use strict"
const {
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * Define your gender.
 * @author klerikdust
 */
module.exports = {
    name: `setgender`,
    aliases: [`setgender`, `setgenders`, `setgndr`],
    description: `Define your gender`,
    usage: `setgender <F/M>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    server_specific: false,
    messageCommand: true,
    options: [{
        name: `gender`,
        description: `Choose between our available options`,
        type: ApplicationCommandOptionType.String,
        choices: [{ name: `male`, value: `male` }, { name: `female`, value: `female` }, { name: `neutral`, value: `neutral` }]
    }],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale, prefix) {
        return await this.run(client, reply, message, arg, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const key = options.getString(`gender`)
        return await this.run(client, reply, interaction, key, locale)
    },
    async run(client, reply, messageRef, key, locale) {
        const userGender = await client.db.userUtils.getUserGender(messageRef.member.id)
        if (!key) return await reply.send(locale(`SETGENDER.GUIDE`), {
            image: `banner_setgender`,
            socket: {
                prefix: `/`,
                currentGender: reply.socketing(locale(`SETGENDER.${!userGender ? `HASNT_SET` : `ALREADY_SET`}`), {
                    gender: userGender ? (userGender.gender === `m` ? `male` : `female`) : null
                })
            }
        })
        const malePool = [`male`, `ml`, `m`, `boy`, `man`]
        const femalePool = [`female`, `fl`, `f`, `girl`, `woman`]
        const targetGender = malePool.includes(key.toLowerCase()) ? `m` : femalePool.includes(key.toLowerCase()) ? `f` : null
        !targetGender ? client.db.userUtils.updateUserGenderToneutral(messageRef.member.id) : /* Update/register gender */ client.db.userUtils.updateUserGender(messageRef.member.id, targetGender)
        return await reply.send(locale(`SETGENDER.SUCCESSFUL`), {
            status: `success`,
            socket: {
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
    }
}