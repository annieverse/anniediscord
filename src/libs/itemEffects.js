/**
 * @typedef {object} ItemManipulation
 * @property {string} itemId
 * @property {string} [amount=0]
 */

/**
 * @typedef {object} DurationalItem
 * @property {string} name
 * @property {number} multiplier
 * @property {number} duration
 */

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
        /**
         * List of available buffs. Map by id.
         * @type {object}
         */
        this.buffReferences = {
            1: `addRole`,
            2: `removeRole`,
            3: `addItem`,
            4: `removeItem`,
            5: `durationalExpBuff`,
            6: `durationalArtcoinsBuff`
        }
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
     * Base function for item manipulations.
     * @param {number} itemId
     * @param {number} amount
     * @param {string} operation
     * @private
     * @return {void}
     */
    _itemUpdate(itemId, amount, operation) {
        this.client.db.updateInventory({
            operation: operation,
            itemId: itemId,
            value: amount,
            userId: this.message.author.id,
            guildId: this.message.guild.id
        })
    }
    
    /**
     * Adding specific item to user's inventory.
     * @param {ItemManipulation} data
     * @return {void}
     */
    addItem(data) {
        if (typeof data !== `object`) data = JSON.parse(data)
        this._itemUpdate(data.itemId, data.amount, `+`)
    }

    /**
     * Removing specific item from user's inventory.
     * @param {ItemManipulation} data
     * @return {void}
     */
    removeItem(data) {
        if (typeof data !== `object`) data = JSON.parse(data)
        this._itemUpdate(data.itemId, data.amount, `-`)
    }

    /**
     * Adding a specified amount of exp.
     * @param {number} exp
     * @return {void}
     */
    addExp(exp) {
        if (typeof exp !== `number`) exp = parseInt(exp)
        this.client.experienceLibs(this.message, this.message.guild, this.message.channel).execute()
    }

    /**
     * Subtracting a specified amount of exp.
     * @param {number} exp
     * @return {void}
     */
    removeExp(exp) {
        if (typeof exp !== `number`) exp = parseInt(exp)
        //  Directly subtract from DB since we don't need to update rank/level-up message.
        this.client.db.subtractUserExp(exp, this.message.author.id, this.message.guild.id)
    }

    /**
     * Base function for durational item.
     * @param {string} buffType
     * @param {string} name
     * @param {number} multiplier
     * @param {number} duration
     * @private
     * @return {void}
     */ 
    _durationalBuff(buffType, name, multiplier, duration) {
        buffType = buffType.toUpperCase()
        const key = `${buffType}_BUFF:${this.message.guild.id}@${this.message.author.id}`
        const field = multiplier + `_` + key
        const expireAt = new Date().getTime() + (duration * 1000)
        this.client.db.redis.hset(key, multiplier, duration)
        this.client.db.registerUserDurationalBuff(buffType, name, multiplier, duration, this.message.author.id, this.message.guild.id)
        this.client.cronManager.add(field, new Date(expireAt), async () => {
            //  Flush from cache and sqlite
            this.client.db.redis.hdel(key, field)
            this.client.db.removeUserDurationalBuff(buffType, multiplier, this.message.author.id, this.message.guild.id)
            //  Attempt to notice the user about expiration
            this.client.responseLibs(this.message).send(`Your **'${name}'** buff has expired! ${await this.client.getEmoji(`AnnieHeartPeek`)}`, {
                field: this.message.author,
                footer: `${this.message.guild.name}'s System Notification`
            })
            .catch(e => e)
        })
    }
    
    /**
     * Registering new exp buff for specific user.
     * @param {DurationalItem} data
     * @return {void}
     */
    durationalExpBuff(data) {
        if (typeof data !== `object`) data = JSON.parse(data)
        this._durationalBuff(`EXP`, data.name, data.multiplier, data.duration)
    }

    /**
     * Registering new artcoins buff for specific user.
     * @param {DurationalItem} data
     * @return {void}
     */
    durationalArtcoinsBuff(data) {
        if (typeof data !== `object`) data = JSON.parse(data)
        this._durationalBuff(`ARTCOINS`, data.name, data.multiplier, data.duration)
    }
}
module.exports = itemEffects
