const Pistachio = require(`../../libs/pistachio`)
/**
 *  Handle art post collection when reacted
 *  @heartReactionHandler
 *  @author Pan
 */
class heartReactionHandler { 
    constructor(data) {
        this.defaultEmoji = `❤️`
        this.data = data
        this.reactor = data.reactor
        this.communityNotificationLabel = `comnotif:${this.reactor.id}`
        this.message = data.reaction.message
        this.reaction = data.reaction
        this.bot = data.annie
        this.notificationTimeout = 3600000
        this.pistachio = new Pistachio({bot: this.bot, message: this.message})
    }

    /**
     * remove a like to a post when a heart is removed
     * @remove
     */
    async remove(){
        // Returns if the heart module is disbled
        if (!this.bot.post_heart_module) return

        //  Returns if the reaction is unmatch.
        if (this.unmatchEmoji) return
		//  Returns if no artwork url was found
        if (!this.artwork) return 
		//  Returns if current channel is not listed in arts channels.
        if (this.nonArtChannels) return
        //  Returns if user react is a this.bot
        if (this.isBot) return

        this.moduleID = `REMOVINGLIKE_${this.reactor.id}_${this.message.id}_${this.message.guild.id}`
        //  Returns if user has recently liked the post
        if (await this.bot.isCooldown(this.moduleID)) return
        // Set new cooldown for liking post
        this.bot.setCooldown(this.moduleID, this.notificationTimeout)
        
        let postmeta = await this.data.annie.db.getpostData({url: this.artwork})
        
        if (!postmeta) return

        //  Get attachment metadata
        let metadata = {
            url: this.artwork
        }
        // Update the record
        this.data.annie.db.removeHeart(metadata)
    }

    /**
     * Add a like to a post when a heart is added
     * @add
     */
    async add(){

        // Returns if the heart module is disbled
        if (!this.bot.post_heart_module) return

        //  Returns if the reaction is unmatch.
        if (this.unmatchEmoji) return
		//  Returns if no artwork url was found
        if (!this.artwork) return 
		//  Returns if current channel is not listed in arts channels.
        if (this.nonArtChannels) return
        //  Returns if user trying to heart their own post
        if (this.selfLiking) this.reaction.users.remove(this.reactor)
        //  Returns if user react is a this.bot
        if (this.isBot) return
        
        this.moduleID = `ADDINGLIKE_${this.reactor.id}_${this.message.id}_${this.message.guild.id}`
        //  Returns if user has recently liked the post
        if (await this.bot.isCooldown(this.moduleID)) return
        // Set new cooldown for liking post
        this.bot.setCooldown(this.moduleID, this.notificationTimeout)

        let postmeta = await this.data.annie.db.getpostData({url: this.artwork})
        
        if (!postmeta) {
            this.data.annie.db.registerPost({
                userId: this.message.author.id,
                url: this.artwork,
                caption: this.caption,
                channelId: this.message.channel.name,
                guildId: this.message.guild.id
            })
            
            this.message.react(this.defaultEmoji)
        }

        //  Get attachment metadata
        let metadata = {
            url: this.artwork,
            recently_liked_by: this.reactor.id
        }
        // Update the record
        this.data.annie.db.addHeart(metadata)
		//  Send notification to user based on heart counts
        await this.notification()
        
    }

    /**
     *  Send post notification to user's DM.
     */
	async notification() {

		const postmeta = await this.data.annie.db.getpostData({url: this.artwork})
        const {receive_notification} = await this.data.annie.db.getNotificationStatus(this.message.author.id)
        
		//  Returns if user has disabled their notification
        //if (receive_notification==`-1`) return //-1 = explicit no
        var once = null
		if (receive_notification==`0`) {//0 = default
			once = `**Do you want to continue receiving post notification, like this?** \n\n`+
			`If no, you need to do nothing. I will stop sending you notifications. \n`+
			`If yes, please reply with "**enable notifications**" below. \n\n`+
			`You can disable notifications with "**disable notifications**" again.`
		}


		/**
		 * 	Handling regular notification (Non-booster user)
		 * 	@regularNotification
		 */
		const regularNotification = async () => {
			this.pistachio.reply(this.bot.locale.en.FEATURED.LIKED + ` \n [Original Post](https://discordapp.com/channels/${this.message.guild.id}/${this.message.channel.id}/${this.message.id}) `, {
				socket: {"reactor":this.reactor.username, "amount":postmeta.total_likes == 1 ? postmeta.total_likes: postmeta.total_likes - 1},
				thumbnail: this.artwork,
				field: this.message.author,
				notch: true
			})

			if (once) {
				this.pistachio.reply(once, {field: this.message.author})
				return this.data.annie.db.disableNotification(this.message.author.id)
			}	
		}


		/**
		 * 	Handling premium notification (Bbooster user)
		 * 	@premiumNotification
		 */
		const premiumNotification = async () => {
			this.pistachio.reply(this.bot.locale.en.FEATURED.LIKED + ` \n [Original Post](https://discordapp.com/channels/${this.message.guild.id}/${this.message.channel.id}/${this.message.id}) `, {
				socket: {"reactor":this.reactor.username, "amount":postmeta.total_likes == 1 ? postmeta.total_likes: postmeta.total_likes - 1},
				thumbnail: this.artwork,
				field: this.message.author,
				notch: true
			})

			if (once) {
				this.pistachio.reply(once, {field: this.message.author})
				return this.db.disableNotification(this.message.author.id)
			}	
		}

		try {
			if (this.pistachio.isVip()) return premiumNotification()
			regularNotification()
		}
		catch(e) { 
			return this.logger.info(`Fail to execute post notification. > ${e.stack}`) 
		}
    }
    get caption() {
        //  Return blank caption
        if (!this.message.content) return ``
        //  Chop caption with length exceed 180 characters.
        if (this.message.content.length >= 180) return this.message.content.substring(0, 180) + `. .`

        return this.message.content
    }

    get artwork() {
        return this.message.attachments.first() ? this.message.attachments.first().url : null
    }

    get unmatchEmoji() {
        return this.reaction.emoji.name !== this.defaultEmoji
    }

    get nonArtChannels() {
        return !this.bot.post_collect_channels.includes(this.message.channel.id)
    }

    get selfLiking() {
        return this.message.author.id ===  this.reactor.id
    }

    get isBot(){
        return this.reactor.bot
    }
}

/**
 * Handle art post collection when submitted
 * @heartHandler
 * @author Pan
 */
class heartHandler {

    constructor(data){
        this.data = data
        this.bot = data.bot
        this.defaultEmoji = `❤️`
        this.communityNotificationLabel = `comnotif:${this.data.message.author.id}`
        this.message = this.data.message
        this.notificationTimeout = 3600
        this.moduleID = `HEARTHANDLER_${this.message.author.id}_${this.message.guild.id}`
        this.pistachio = new Pistachio({bot: this.bot, message: this.message})
    }

    /**
     *  Notify community for Booster user.
     *  @communityNotification
     */
    communityNotification() {
        //  Return if still in cooldown (1h)
        if (this.communityNotificationIsCooldown()) return

        //  Send notification to general. Deletes after 30s.
        this.reply(`**${this.message.author.username}** has posted new art in ${this.data.message.channel} !`, {
            deleteIn: 30,
            field: this.data.message.guild.channels.get(this.bot.post_vip_notification_general_channel)
        })

        // Set new cooldown for liking post
        this.bot.setCooldown(this.moduleID, this.notificationTimeout)
        return this.logger.info(`${this.data.message.author.tag}'s post got notified in #general.`)
    }


    /**
     *  Check if the user has recently posted the art.
     *  @communityNotificationIsCooldown
     */
    async communityNotificationIsCooldown() {
        return await this.bot.isCooldown(this.moduleID) ? true : false
    }

    /**
     * Record post to db and send a vip message if enabled
     * @intialPost
     */
    async intialPost(){

        // Returns if the heart module is disbled
        if (!this.bot.post_heart_module) return

        //  Returns if no artwork url was found
        if (!this.artwork) return 
        //  Returns if current channel is not listed in arts channels.
        if (this.nonArtChannels) return
        //  Returns if user react is a this.bot
        if (this.isBot) return

        const postmeta = await this.bot.db.getpostData({url: this.artwork})
        if (postmeta) return
        const {receive_notification} = await this.bot.db.getNotificationStatus(this.message.author.id)
        //  If user is a VIP user and notification enabled, sent community notification.
        if (this.pistachio.isVip() && receive_notification && this.bot.post_vip_notification_module) this.communityNotification()
        //  React the message
        this.message.react(this.defaultEmoji)
        //  Save the record
        this.bot.db.registerPost({
            userId: this.data.message.author.id,
            url: this.artwork,
            caption: this.caption,
            channelId: this.data.message.channel.id,
            guildId: this.data.message.guild.id
        })


    }
    get caption() {
        //  Return blank caption
        if (!this.message.content) return ``
        //  Chop caption with length exceed 180 characters.
        if (this.message.content.length >= 180) return this.message.content.substring(0, 180) + `. .`

        return this.message.content
    }

    get artwork() {
        return this.message.attachments.first() ? this.message.attachments.first().url : null
    }

    get nonArtChannels() {
        return !this.bot.post_collect_channels.includes(this.message.channel.id)
    }

    get isBot(){
        return this.message.author.bot
    }
}
module.exports = {heartReactionHandler, heartHandler}