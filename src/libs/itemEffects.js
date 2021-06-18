/**
 * Applying buff for selected item.
 * @abstract
 */
class itemEffects {
    /**
     * @param {Client} client Current bot/client instance.
     * @param {Message} message Current message instance that invoked the class.
     */
    constructor(client, message) {
        /**
         * Current client instance.
         * @type {client}
         */
        this.client = client
        /**
         * Current message instance.
         * @type {Message}
         */
        this.message = message
    }
    
    /**
     * List of available buffs.
     * @type {object}
     */
    get availableBuffs() {
        return [
            `ADD_ROLE`,
            `REMOVE_ROLE`,
            `ADD_ITEM`,
            `REMOVE_ITEM`,
            `EXP_BUFF`,
            `ARTCOINS_BUFF`,
        ]
    }
}
module.exports = itemEffects
