const Command = require(`../../libs/commands`)
//const GUI = require(`../../ui/prebuild/welcomer`)
/**
 * 	Dummy command to test anything.
 * 	@author klerikdust
 */
class Test extends Command {

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
	async execute({ reply }) {
		await this.requestUserMetadata(1)

		let users = this.fullArgs.split(`\n`)
		for (let index = 0; index < users.length; index++) {
			const element = users[index]
			try {
				reply(`${element}:  ${this.bot.guilds.get(`459891664182312980`).members.find(m => m.user.tag == element).id}`)
			} catch (error) {
				reply(`Cant find user, tried using this tag: ${element}`)
			}
		}
		//this.bot.guilds.get(`459891664182312980`).members.find(m => m.user.tag == this.fullArgs).id
		return
		/*
		return reply(`test`, {
			simplified: true,
			prebuffer: true,
			image: await new GUI(this.user, this.bot).build()
		})
		*/
	}
}

module.exports.help = {
	start: Test,
	name: `test`,
	aliases: [`test`],
	description: `Dummy command to test anything.`,
	usage: `test <>`,
	group: `Developer`,
	permissionLevel: 4,
	multiUser: true,
}