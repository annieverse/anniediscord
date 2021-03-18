const Command = require(`../../libs/commands`)
const moment = require(`moment`)
/**
 * Never forget things. Ask Annie to reminds you anytime!
 * @author klerikdust
 */
class Remind extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, bot:{reminders} }) {
        await this.requestUserMetadata(1)
        //  Displays guide and user's active reminders
        if (!this.fullArgs) {
            const userReminders = await reminders.getReminders(this.user.master.id)
            return reply(this.locale.REMINDER.HOME, {
                image: `banner_reminder`,
                socket: {
                    prefix: this.bot.prefix,
                    activeReminders: userReminders.length <= 0 ? `Currently you don't have any active reminders.` : `Currently you have ${userReminders.length} active reminders!`
                }
            })
        }
        //  Handle if the date is not valid
        const context = reminders.getContextFrom(this.fullArgs, this.user.master.id)
        if (!context.isValidReminder) return reply(this.locale.REMINDER.INVALID_DATE, {
            socket: {
                emoji: await emoji(`790338393015713812`),
                prefix: this.bot.prefix
            }
        })
        //  Finalize
        reminders.register(context)
        return reply(this.locale.REMINDER.SUCCESSFUL, {
            status: `success`,
            socket: {
                emoji: await emoji(`789212493096026143`),
                time: moment(context.remindAt.timestamp).fromNow()
            }
        })
	}
}

module.exports.help = {
	start: Remind,
	name: `remind`,
	aliases: [`remind`, `rmd`, `reminds`, `reminder`, `remindme`],
	description: `Never forget things. Ask Annie to reminds you anytime!`,
	usage: `remind <message> <time>`,
	group: `User`,
	permissionLevel: 0,
	multiUser: false,
	rawArgs: true
}