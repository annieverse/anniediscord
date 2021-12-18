const moment = require(`moment`)
/**
 * Never forget things. Ask Annie to reminds you anytime!
 * @author klerikdust
 */
module.exports = {
    name: `remind`,
	aliases: [`remind`, `rmd`, `reminds`, `reminder`, `remindme`],
	description: `Never forget things. Ask Annie to reminds you anytime!`,
	usage: `remind <message> <time>`,
	permissionLevel: 0,
    async execute(client, reply, message, arg, locale) {
        //  Displays guide and user's active reminders
        if (!arg) {
            const userReminders = await client.reminders.getReminders(message.author.id)
            return reply.send(locale.REMINDER.HOME, {
                image: `banner_reminder`,
                socket: {
                    prefix: client.prefix,
                    activeReminders: userReminders.length <= 0 ? `Currently you don't have any active reminders.` : `Currently you have ${userReminders.length} active reminders!`
                }
            })
        }
        //  Handle if the date is not valid
        const context = client.reminders.getContextFrom(arg, message.author.id)
        if (!context.isValidReminder) return reply.send(locale.REMINDER.INVALID_DATE, {
            socket: {
                emoji: await client.getEmoji(`790338393015713812`),
                prefix: client.prefix
            }
        })
        client.reminders.register(context)
        return reply.send(locale.REMINDER.SUCCESSFUL, {
            status: `success`,
            socket: {
                emoji: await client.getEmoji(`789212493096026143`),
                time: moment(context.remindAt.timestamp).fromNow()
            }
        })
    }
}
