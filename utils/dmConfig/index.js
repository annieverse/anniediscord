`use-strict`

/**
 *  Toggle options for enable/disable notification
 *  @Class
 */
class Notification {
	constructor(Stacks) {
		this.stacks = Stacks
		this.author = Stacks.message.author
		this.db = Stacks.db(Stacks.message.author.id)
		this.reply = Stacks.reply
		this.dm = Stacks.code.DM
	}


	/**
     *  Disable user notification
     */
	async disable() {
		try {
			//  Set get_notification to zero
			await this.db.disableNotification()
			//  Successful
			return this.reply(this.dm.NOTIFICATION_DISABLED, {field: this.author})
		}
		catch(e) {
			//  Incase the database queries are busy
			return this.reply(this.dm.ERROR)
		}
	}


	/**
     *  Enable user notification
     */
	async enable() {
		try {
			//  Set get_notification to one
			await this.db.enableNotification()
			//  Successful
			return this.reply(this.dm.NOTIFICATION_ENABLED, {field: this.author})
		}
		catch(e) {
			//  Incase the database queries are busy
			return this.reply(this.dm.ERROR)
		}
	}

}

module.exports = Notification