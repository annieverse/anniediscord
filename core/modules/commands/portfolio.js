const GUI = require(`../../utils/portfoliocardInterface`)

/**
 * Main module
 * @Portfolio Display user recent works.
 */
class Portfolio {
	constructor(Stacks) {
		this.stacks = Stacks
		this.requirement_level = 35
	}


	/**
     *  Initialzer method
     */
	async execute() {
		const { reply, name, code: {PORTFOLIOCARD}, meta: {author, data} } = this.stacks


		//  Returns if user is invalid
		if (!author) return reply(PORTFOLIOCARD.INVALID_USER)
		//  Returns if user level is below the requirement
		if (data.level < this.requirement_level) return reply(PORTFOLIOCARD.LVL_TOO_LOW, {socket: [this.requirement_level]})

        
		//  Fetch
		return reply(PORTFOLIOCARD.FETCHING, {socket: [name(author.id)], simplified: true})
			.then(async load => {
				//  Display result
				reply(PORTFOLIOCARD.HEADER, {
					socket: [name(author.id)],
					image: await GUI(this.stacks, author),
					prebuffer: true,
					simplified: true
				})
				load.delete()
			})
	}
}

module.exports.help = {
	start: Portfolio,
	name: `portfolio`,
	aliases: [`portfolio`, `protofolio`],
	description: `Display user's portfolio card`,
	usage: `portfolio [@user]<optional>`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}