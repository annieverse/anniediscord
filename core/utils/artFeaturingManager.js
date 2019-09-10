const { dev, administrator_id } = require(`../../.data/environment`)
const { art_domain } = require(`../modules/config`)
const database = require(`./databaseManager`)
const Pistachio = require(`./Pistachio`)

/**
 *  Handles #Featured system
 *  @ClassWrapper
 */
class HeartCollector {
	constructor(Stacks) {
		this.components = { 
			user: Stacks.user, 
			reaction: Stacks.reaction, 
			bot:Stacks.bot, 
			message:Stacks.reaction.message, 
			meta: {author:null}
		}
		this.keyv = Stacks.bot.keyv
		this.logger = Stacks.bot.logger
		this.stacks = new Pistachio(this.components).bag()
		this.metadata = {
			timestamp: Date.now(),
			featured_channel: Stacks.bot.channels.get(`582808377864749056`),
			featured_requirement: 10,
			main_emoji: `❤`,
			msg: Stacks.reaction.message,
			get postComponents() {
				const { timestamp, artwork, msg:{author, channel}, favs} = this
				return {
					timestamp: timestamp,
					url: artwork,
					author: author.id,
					channel: channel.id,
					heart_counts: favs,
					last_heart_timestamp: timestamp
				}
			},
			get artwork() {
				return this.msg.attachments.first() ? this.msg.attachments.first().url : null
			},
			get caption() {
				//  Return blank caption
				if (!this.msg.content) return ``
				//  Chop caption with length exceed 180 characters.
				if (this.msg.content.length >= 180) return this.msg.content.substring(0, 180) + `. .`

				return this.msg.content
			},
			get favs() {
				Stacks.reaction.fetchUsers()

				function test() {
					if (Stacks.reaction.users.size > Stacks.reaction.count) {
						return Stacks.reaction.users.size
					} else if (Stacks.reaction.users.size < Stacks.reaction.count) {
						return Stacks.reaction.count
					} else if (Stacks.reaction.users.size == Stacks.reaction.count) {
						return Stacks.reaction.count
					}
				}
				return test()
			},
			get heartsTooLow() {
				return this.favs < this.featured_requirement
			},
			get notAuthorizedSandboxUser() {
				return dev && !administrator_id.includes(Stacks.user.id)
			},
			get unmatchEmoji() {
				return Stacks.reaction.emoji.name !== this.main_emoji
			},
			get nonArtChannels() {
				return !art_domain.includes(this.msg.channel.id)
			},
			get selfLiking() {
				return this.msg.author.id === Stacks.user.id
			},
		}
		this.db = new database(this.metadata.msg.author.id)
		this.reactid = `${this.metadata.artwork}:${this.components.user.id}`,
		this.notificationTimeout = 3600000,
		this.featuredPost = this.db.featuredPostMetadata(this.metadata.artwork)
	}


	/**
     *  Send post notification to user's DM.
     */
	async notification() {
		//  Mutation pistachio
		const { reply, code:{FEATURED}, bot, user } = this.stacks
		const { get_notification } = await this.db.userMetadata(user.id)
		const postmeta = await this.featuredPost

		//  Returns if user react is a this.bot
		if (bot.user.id === user.id) return
		//  Returns if user has disabled their notification
		if (get_notification==`-1`) return //-1 = explicit no
		var once = null
		if (get_notification==`0`) {//0 = default
			once = `**Do you want to continue receiving notifications for likes, like this?** \n\n`+
			`If no, you need to do nothing. I will stop sending you notifications. \n`+
			`If yes, please reply with "**enable notifications**" below. \n\n`+
			`You can disable notifications with "**disable notifications**" again.`
		}

		try {
			//  Featured notification
			if (!this.metadata.heartsTooLow && !postmeta) reply(
				FEATURED.SUCCESSFUL, {
					socket: [this.metadata.msg.author.username, this.metadata.msg.channel],
					thumbnail: this.metadata.artwork,
					field: this.metadata.msg.author,
					notch: true
				})
                
			//  First or two liked.
			else if (this.metadata.favs <= 2) reply(
				FEATURED.FIRST_LIKE, {
					socket: [user.username],
					thumbnail: this.metadata.artwork,
					field: this.metadata.msg.author,
					notch: true
				})

			//  Regular notification
			else reply(FEATURED.LIKED, {
				socket: [user.username, this.metadata.favs - 1],
				thumbnail: this.metadata.artwork,
				field: this.metadata.msg.author,
				notch: true
			})

			if (once) {
				reply(once, {field: this.metadata.msg.author})
				await this.db.disableNotification()
			}
			return
		}
		catch(e) { return }
	}


	/**
     *  Register new heart and check for feature
     */
	async Add() {
		//  Mutation pistachio
		const { reply, avatar, reaction, user } = this.stacks

		//  Returns if the reaction is unmatch.
		if (this.metadata.unmatchEmoji) return
		//  Returns if no artwork url was found
		if (!this.metadata.artwork) return 
		//  Returns if user is not authorized in development server
		if (this.metadata.notAuthorizedSandboxUser) return
		//  Returns if current channel is not listed in arts channels.
		if (this.metadata.nonArtChannels) return
		//  Returns if user trying to heart their own post
		if (this.metadata.selfLiking) return reaction.remove(user)
		//  Returns if user has recently liked the post
		if (await this.keyv.get(this.reactid)) return

		
		//  Store recent reaction to avoid double notification spam. Restored in 1 hour.
		this.keyv.set(this.reactid, `1`, this.notificationTimeout)
		this.logger.info(`${this.metadata.msg.author.username}'s work has been liked by ${user.username} in #${this.metadata.msg.channel.name}`)
		
		
		//  Store new heart
		await this.db.addHeart()
		//  Send notification to user based on heart counts
		await this.notification()


		//  Returns if heart counts are not sufficient.
		if (this.metadata.heartsTooLow) return
		//  Returns if post already in #featured
		if (await this.featuredPost) return
		//  Register post metadata
		await this.db.registerFeaturedPost(this.metadata.postComponents)

        
		//  Send post to #featured
		this.logger.info(`${this.metadata.msg.author.username}'s work has been featured.`)
		return reply(this.metadata.caption + `\n\u200b`, {
			prebuffer: true,
			image: this.metadata.artwork,
			field: this.metadata.featured_channel,
			customHeader: [this.metadata.msg.author.tag, avatar(this.metadata.msg.author.id)]
		}) 
	}
}

module.exports = HeartCollector