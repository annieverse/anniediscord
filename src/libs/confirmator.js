/**
 * Manages transaction confirmation thru reaction.
 * @class
 */
module.exports = class Confirmator {
    constructor(message, reply) {
        /**
         * Used emoji for reject button.
         * @type {string}
         */
        this.cancelButtonId = `794593423575351307`
        /**
         * Target message instance
         * @type {Message}
         */
        this.message = message
        /**
         * Message wrapper from Response class.
         * @type {external:Response}
         */
        this.reply = reply
    }
    
    /**
     * Initializing buttons for confirmation
     * @param {string} [targetUserId=this.message.author.id] Target user that confirms the transaction.
     * @param {Message} [targetMessage=this.message] Target to attach the event to.
     * @return {void}
     */
    async setup(targetUserId=this.message.author.id, targetMessage=this.message) {
        this.message = targetMessage
		const confirmationEmoji = `✅`
        //  Recursively find the cancel emoji
		const cancelEmoji = await this.message.client.getEmoji(`794593423575351307`)
		targetMessage.react(confirmationEmoji)
		targetMessage.react(cancelEmoji)
        const confirmationButtonFilter = (reaction, user) => [confirmationEmoji, cancelEmoji].includes(reaction.emoji.toString()) && user.id === targetUserId
		this.activeInstance = targetMessage.createReactionCollector(confirmationButtonFilter, { time: 300000, max: 1 })
    }

    /**
     * Callback function on finalized/confirmed transaction. 
     * Rejected transaction will be automatically handled.
     * @param {function|null} [fn=null] Callback function to call.
     * @return {Event}
     */
    onAccept(fn=null) {
        if (!fn) throw new TypeError(`parameter 'fn' must be a valid callback function`)
        if (!this.activeInstance) throw new Error(`there are no active instance to listen to`)
        return this.activeInstance.on(`collect`, async r => {
            if (this.isRejected(r)) {
                return this.reply.send(this.message.client.locales.en.ACTION_CANCELLED, {
                    socket: {
                        emoji: await this.message.client.getEmoji(`781954016271138857`)
                    }
                })
            }
            await fn(r)
            return this.end()
        })
    }

    /**
	 * Check if current active instance is cancelled/rejected.
	 * @return {boolean}
	 */
	isRejected() {
		const r = this.message.reactions.cache
		if (r.has(this.cancelButtonId)) {
			if (r.get(this.cancelButtonId).count >= 2) {
				this.end()
				return true
			}
		}
		return false
	}

    /**
	 * Finalize/end transaction instance.
	 * @param {object} [response={}] target confirmation response to finalize with.
	 * @returns {void}
	 */
	end() {
		this.message.reactions.removeAll()
        .catch(e => this.message.client.logger.warn(`<FAIL_CONFIRMATOR_END> ${e.message}`))
        this.activeInstance = null
	}
}
