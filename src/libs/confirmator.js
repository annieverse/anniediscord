const { ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require(`Discord.js`)
/**
 * Manages transaction confirmation thru reaction.
 * @class
 */
module.exports = class Confirmator {
    constructor(message, reply, slashCommand) {
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
        /**
         * Whether this is a slash command or not.
         * @type {boolean}
         */
        this.slashCommand = slashCommand || false
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
        
        if (this.slashCommand) {
            let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId(`confirm`)
                .setLabel(`Confirm`)
                .setStyle(ButtonStyle.Success),
            )
            .addComponents(
                new ButtonBuilder()
                .setCustomId(`cancel`)
                .setLabel(`Cancel`)
                .setStyle(ButtonStyle.Danger)
            )
            targetMessage.edit({components: [row]})
            const filter = i => (i.customId === `confirm`|| i.customId === `cancel`) && i.user.id === targetUserId
            this.activeInstance = targetMessage.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 15000 })
        }else{
            targetMessage.react(confirmationEmoji)
            targetMessage.react(cancelEmoji)
    
            const filter = (reaction, user) => [confirmationEmoji, cancelEmoji].includes(reaction.emoji.toString()) && user.id === targetUserId
            this.activeInstance = targetMessage.createReactionCollector({filter,time: 300000, max: 1 })
        }
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
        if (this.slashCommand) {
            this.activeInstance.on(`collect`, async interact => {
                this.responseCollected = interact.customId
                if (this.isRejected(interact)) {
                    // Update original response to clear the buttons
                    await interact.update({
                        components: []
                      })
                    // Fetch the original message in order respond to it again
                    await interact.fetchReply()
                    // send the final response
                    return this.reply.send(this.message.client.locales.en.ACTION_CANCELLED, {
                        socket: {
                            emoji: await this.message.client.getEmoji(`781954016271138857`)
                        },
                        followUp: true
                    })
                }
                
                await fn(interact)
                // Slightly complete the interaction to avoid errors
                return this.end()
                
            })
        }else{
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
    }

    /**
	 * Check if current active instance is cancelled/rejected.
	 * @return {boolean}
	 */
	isRejected() {
        if (this.slashCommand) {
            if (this.responseCollected === `cancel`) {
                this.end()
                return true
            }
            return false
        }
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
        if (this.slashCommand) {
            this.message.edit({components: []})
            this.activeInstance = null
        }else{            
            this.message.reactions.removeAll()
            .catch(e => this.message.client.logger.warn(`<FAIL_CONFIRMATOR_END> ${e.message}`))
        }
        this.activeInstance = null
	}
}
