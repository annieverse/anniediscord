const { packages, keywords } = require(`../../utils/event-rewards`)

/**
 * Main module
 * @sendEventReward Send Rewards for events.
 */
class sendEventReward {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	/**
     *	Initializer method
     */
	async execute() {
		const { isEventManager, palette, avatar, addRole, collector, code, args, name, reply, bot:{db}, meta: {author} } = this.stacks

		//  Centralized reward object
		let metadata = {
			keywords: keywords,
			packages: packages,
			get whole_keywords() {
				let arr = []
				for (let i = 0; i < this.keywords.length; i++) {
					arr.push(...this.keywords[i])
				}
				return arr
			}
		}


		//  Returns if user has no event manager authority
		if (!isEventManager) return reply(code.EVENTMANAGER_UNAUTHORIZED_ACCESS)
		//  Returns if user doesn't include any parameter
		if (!args[0]) return reply(code.DISTREWARD.SHORT_GUIDE)
		//  Returns if target user is invalid
		if (!author) return reply(code.INVALID_USER)


		//  Confirmation
		reply(code.DISTREWARD.CONFIRMATION, {
			socket: [name(author.id)],
			color: palette.golden,
			notch: true,
			thumbnail: avatar(author.id)
		})
			.then(() => {
				collector.on(`collect`, async msg => {
					let input = msg.content.toLowerCase()


					//  Close connections
					collector.stop()
					msg.delete()


					//  Returns if parameter doesn't match with anything in the list.
					if (!metadata.whole_keywords.includes(input)) return reply(code.DISTREWARD.INVALID_REWARD)


					//  Store key of selected group
					metadata.selected_group = metadata.keywords.filter(v => v.includes(input))[0][0]
					//  Store item rewards reference
					metadata.selected_rewards = packages[metadata.selected_group]


					//  Store micro-items reward
					await db.setUser(author.id).deliverRewardItems(metadata.selected_rewards)
					//  Add role if package contains role reward
					if (metadata.selected_rewards.role) addRole(metadata.selected_rewards.role, author.id)

                
					//  Successful
					return reply(code.DISTREWARD.SUCCESSFUL, {
						socket: [name(author.id), metadata.selected_group],
						color: palette.lightgreen
					})
				})
			})
	}
}
    
module.exports.help = {
	start: sendEventReward,
	name:`sendreward`,
	aliases: [`sendreward`],
	description: `Send Rewards for events`,
	usage: `sendreward @user <place>`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}