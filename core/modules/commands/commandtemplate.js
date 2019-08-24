/*
 *This is only a template, easy to pull from when making a new command
 *
 */
class commandName {
	constructor(Stacks) {
		this.author = Stacks.meta.author
		this.data = Stacks.meta.data
		this.utils = Stacks.utils
		this.message = Stacks.message
		this.args = Stacks.args
		this.palette = Stacks.palette
		this.stacks = Stacks
	}

	async execute() {
		// Add these three lines so u dont have to go through and put this./this.stacks infront of everything
		// might have to go through if another varible is called
		let message = this.message
		let bot = this.stacks.bot
		let palette = this.stacks.palette
		message
		bot
		palette
		//copy existing code into here
	}
}

module.exports.help = {
	start: commandName, 
	name:`commandtemplate`, // This MUST equal the filename
	aliases: [], // More or less this is what the user will input on discord to call the command
	description: `No function just a place holder for commands`,
	usage: `${require(`../../.data/environment.json`).prefix}TemplateCommand`,
	group: `Admin`,
	public: false,
	require_usermetadata: true,
	multi_user: true
}