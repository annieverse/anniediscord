const Command = require(`../../libs/commands`)
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
		await this.requestUserMetadata(2)
		const gui = require(`../../ui/prebuild/levelUpMessage`)
		const img = await new gui(this.user, 60).build()
		return reply(`test`, {prebuffer:true, image: img, simplified:true})
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