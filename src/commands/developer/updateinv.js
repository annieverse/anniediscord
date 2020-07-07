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
	async execute() {
		await this.requestUserMetadata(1)
		this.bot.db.updateInventory({itemId: this.args[0], value:this.args[1], operation:`+`, userId: this.args[2]})
		return
	}
}

module.exports.help = {
	start: Test,
	name: `updateinv`,
	aliases: [`update`],
	description: `Dummy command to test anything.`,
	usage: `updateinv <itemid> <amount> <userid>`,
	group: `Developer`,
	permissionLevel: 4,
	multiUser: true,
}