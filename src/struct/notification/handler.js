`use-strict`
const Controller = require(`../messageController`)
/**
 *  Toggle options for enable/disable notification
 *  @Class
 */
class Notification extends Controller {
	constructor(data) {
		super(data)
	}


	/**
     *  Disable user notification
     */
	async disable() {
		try {
			//  Set get_notification to zero
			await this.db.disableNotification(this.meta.author.id)
			//  Successful
			return this.reply(this.code.DM.NOTIFICATION_DISABLED, {field: this.meta.author})
		}
		catch(e) {
			//  Incase the database queries are busy
			return this.reply(this.code.DM.ERROR)
		}
	}


	/**
     *  Enable user notification
     */
	async enable() {
		try {
			//  Set get_notification to one
			await this.db.enableNotification(this.meta.author.id)
			//  Successful
			return this.reply(this.code.DM.NOTIFICATION_ENABLED, {field: this.meta.author})
		}
		catch(e) {
			//  Incase the database queries are busy
			return this.reply(this.code.DM.ERROR)
		}
	}

}

module.exports = Notification