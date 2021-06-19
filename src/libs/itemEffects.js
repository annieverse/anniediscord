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
        /**
         * Instance identifier
         * @type {string}
         */
        this.instanceId = `ITEM_EFFECT_${message.guild.id}:${message.author.id}`
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
            `ADD_EXP`,
            `SUBTRACT_EXP`,
            `EXP_BUFF`,
            `ARTCOINS_BUFF`,
        ]
    }

    /**
     *  ----------------------------
     *  DEFINED FLOW FOR EACH BUFF EFFECT
     *  ---------------------------
     */
    
    /**
     * Giving out role
     * @param {string|object} roleIds Pool of role ids
     * return {void}
     */
    addRole(roleIds) {
        //  Skip addition if user already has the role
        if (this.message.member.roles.cache.has(roleId)) return
        this.message.member.roles.add(roleIds)
        .catch(e => this.client.logger.warn(`${this.instanceId} <ADD_ROLE_FAIL> ${e.stack}`))
    }

    /**
     * Extract/revoke out role
     * @param {string|object} roleIds Pool of role ids
     * return {void}
     */
    removeRole(roleIds) {
        //  Skip addition if user already has the role
        if (this.message.member.roles.cache.has(roleId)) return
        this.message.member.roles.remove(roleIds)
        .catch(e => this.client.logger.warn(`${this.instanceId} <REMOVE_ROLE_FAIL> ${e.stack}`))
    }

    /**
     * Adding specific item to user's inventory.
     */
}
module.exports = itemEffects
