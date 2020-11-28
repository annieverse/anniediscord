const Command = require(`../../libs/commands`)
/**
 * Never miss anything. Ask me to remind your task!
 * @author klerikdust
 */
class Reminder extends Command {
	constructor(Stacks) {
		super(Stacks)
	}

	/**
	 * Running command workflow
	 * @param {PistachioMethods} Object pull any pistachio's methods in here.
	 */
	async execute({ reply, name, avatar }) {
	}
}


module.exports.help = {
	start: Reminder,
	name: `reminder`,
	aliases: [`remind`, `remindme`, `reminder`],
	description: `Never miss anything. Ask me to remind your task!`,
	usage: `affiliate`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false
}