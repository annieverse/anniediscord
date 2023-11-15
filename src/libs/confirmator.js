"use strict"
const {
    ComponentType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require(`discord.js`)
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
    setup(targetUserId = this.message.author.id, targetMessage = this.message) {
        this.message = targetMessage
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
        targetMessage.edit({
            components: [row]
        })
        const filter = i => (i.customId === `confirm` || i.customId === `cancel`) && i.user.id === targetUserId
        this.activeInstance = targetMessage.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 60 * 1000
        })
    }

    /**
     * Callback function on finalized/confirmed transaction. 
     * Rejected transaction will be automatically handled.
     * @param {function|null} [fn=null] Callback function to call.
     * @return {Event}
     */
    onAccept(fn = null) {
        if (!fn) throw new TypeError(`parameter 'fn' must be a valid callback function`)
        if (!this.activeInstance) throw new Error(`there are no active instance to listen to`)
        this.onEnd()
        this.onIgnore()
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
                return await this.reply.send(this.reply.localeMetadata.ACTION_CANCELLED, {
                    socket: {
                        emoji: await this.message.client.getEmoji(`781954016271138857`)
                    },
                    followUp: true
                })
            }

            await fn(interact)
            return this.end()

        })
    }

    /**
     * Check if current active instance is cancelled/rejected.
     * @return {boolean}
     */
    isRejected() {
        if (this.responseCollected === `cancel`) {
            this.end()
            return true
        }
        return false
    }

    /**
     * Finalize/end transaction instance.
     * @param {object} [response={}] target confirmation response to finalize with.
     * @returns {void}
     */
    end() {
        this.message.edit({
            components: []
        })
        this.activeInstance = null
    }

    onEnd() {
        this.activeInstance.on(`end`, () => {
            return this.end()
        })
    }

    onIgnore() {
        this.activeInstance.on(`ignore`, (obj) => {
            if (obj.me) return
            obj.reply({ content: `I'm sorry but you are not the intended user that may interact with this button.`, ephemeral: true })
        })
    }
}