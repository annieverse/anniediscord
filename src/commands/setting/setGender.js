/**
 * Define your gender.
 * @author klerikdust
 */
module.exports = {
    name: `setGender`,
    aliases: [`setgender`, `setgenders`, `setgndr`],
    description: `Define your gender`,
    usage: `setgender <F/M>`,
    permissionLevel: 0,
    applicationCommand: false,
    async execute(client, reply, message, arg, locale, prefix) {
        const userGender = await client.db.getUserGender(message.author.id)
        if (!arg) return reply.send(locale.SETGENDER.GUIDE, {
            image: `banner_setgender`,
            socket: {
                prefix: prefix,
                currentGender: reply.socketing(locale.SETGENDER[!userGender ? `HASNT_SET` : `ALREADY_SET`], {
                    gender: userGender ? (userGender.gender === `m` ? `male` : `female`) : null
                })
            }
        })
        const malePool = [`male`, `ml`, `m`, `boy`, `man`]
        const femalePool = [`female`, `fl`, `f`, `girl`, `woman`]
            //  Handle out of range options
        const key = arg.toLowerCase()
        const targetGender = malePool.includes(key) ? `m` :
            femalePool.includes(key) ? `f` :
            null
        if (!targetGender) return reply.send(locale.SETGENDER.INVALID, {
                socket: {
                    emoji: await client.getEmoji(`AnnieYandereAnim`)
                }
            })
            //  Update/register gender
        client.db.updateUserGender(message.author.id, targetGender)
        return reply.send(locale.SETGENDER.SUCCESSFUL, {
            status: `success`,
            socket: {
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
    }
}