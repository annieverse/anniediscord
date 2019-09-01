const profile = require(`../../utils/profilecardInterface`)
const portfolio = require(`../../utils/portfoliocardInterface`)

/**
 * Main module
 * @Profile Display detailed user personal card.
 */
class Profile {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	//          WORKING ON NEW SHOP INTERFACE
	/**
     *  Initialzer method
     */
	async execute() {
		const { reply, name, code: {PROFILECARD}, meta: {author} } = this.stacks
		const pages = [profile, portfolio]

		//  Returns if user is invalid
		if (!author) return reply(PROFILECARD.INVALID_USER)
    
		//  Display result
		return reply(PROFILECARD.HEADER, {
			socket: [name(author.id)],
			image: await pages[0](this.stacks, author),
			prebuffer: true,
			simplified: true
		}).then(msg => {
				msg.react(`⏪`).then(() => {
					msg.react(`⏩`)

					const backwardsFilter = (reaction, user) => (reaction.emoji.name === `⏪`) && (user.id === author.id)
					const forwardsFilter = (reaction, user) => (reaction.emoji.name === `⏩`) && (user.id === author.id)

					const backwards = msg.createReactionCollector(backwardsFilter, {
						time: 60000
					})
					const forwards = msg.createReactionCollector(forwardsFilter, {
						time: 60000
					})
					let count = 0

					backwards.on(`collect`, async r => {
						r.remove(author)
						count--

						if (pages[count]) {
							reply(PROFILECARD.HEADER, {
								socket: [name(author.id)],
								image: await pages[count](this.stacks, author),
								prebuffer: true,
								simplified: true
							})
						} else {
							count++
						}

					})
					forwards.on(`collect`, async r => {
						r.remove(author)
						count++

						if (pages[count]) {
							reply(PROFILECARD.HEADER, {
								socket: [name(author.id)],
								image: await pages[count](this.stacks, author),
								prebuffer: true,
								simplified: true
							})
						} else {
							count--
						}
					})

					setTimeout(() => {
						msg.clearReactions()
					}, 60000)
				})
			})
	}
}

module.exports.help = {
	start: Profile,
	name: `profile`,
	aliases: [`prfl`, `profil`, `p`, `mycard`],
	description: `Display user's profile card`,
	usage: `profile [@user]<optional>`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}