const ms = require(`ms`)
const { PermissionFlagsBits, roleMention } = require(`discord.js`)
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
    constructor(client, message, locale) {
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
         * Current user's locale
         * @type {JSON}
         */
        this.locale = locale
        /**
         * Instance identifier
         * @type {string}
         */
        this.instanceId = `ITEM_EFFECT_${message.guild.id}:${message.member.id}`
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
     * Displaying the buffs for target item.
     * @param {number} itemId
     * @return {string|null}
     */
    async displayItemBuffs(itemId) {
        const itemEffects = await this.client.db.shop.getItemEffects(itemId)
        let str = `The following buffs will be applied upon use::\n`
        if (!itemEffects.length) return null
        for (let i = 0; i < itemEffects.length; i++) {
            const effect = itemEffects[i]
            const raw = JSON.parse(effect.parameter)
            if ([1, 2].includes(effect.effect_ref_id)) {
                const transaction = effect.effect_ref_id === 1 ? `Receiving` : `Removed`
                let role = []
                raw.map(r => role.push(this.message.guild.roles.cache.get(r)))
                str += `╰☆～${transaction} **${role.join(` `)}** role\n`
            }
            if ([3, 4].includes(effect.effect_ref_id)) {
                const transaction = effect.effect_ref_id === 3 ? `Receiving` : `Removed`
                const item = await this.client.db.shop.getItem(raw.itemId)
                str += `╰☆～${transaction} ${raw.amount}pcs of **${item.name}**\n`
            }
            if ([5, 6].includes(effect.effect_ref_id)) {
                const boostType = effect.effect_ref_id === 5 ? `EXP` : `Artcoins`
                str += `╰☆～${raw.multiplier * 100}% ${boostType} boost for ${ms(raw.duration, { long: true })}\n`
            }
        }
        return str
    }

    /**
     * Applying item buffs if there's any.
     * @param {number} itemId
     * @return {void}
     */
    async applyItemEffects(itemId) {
        const itemEffects = await this.client.db.shop.getItemEffects(itemId)
        if (!itemEffects.length) return
        for (let i = 0; i < itemEffects.length; i++) {
            const effect = itemEffects[i]
            await this[this.buffReferences[effect.effect_ref_id]](effect.parameter)
        }
    }

    /**
     *  ----------------------------
     *  DEFINED FLOW FOR EACH BUFF EFFECT
     *  ---------------------------
     */

    /**
     * @deprecated 7/13/2024 Please remove all references or update to new style Please ask Pan for more information if needed
     * Giving out role
     * @param {object} roleIds
     * @return {void}
     */
    async addRole(roleId) {
        if (!this.message.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) return // Make sure bot has correct permissions to add role
        roleId = JSON.parse(roleId)
        const validroles = []
        for (const r of roleId) {
            //  Skip addition if user already has the role
                if (!this.message.member.roles.cache.has(r)) {
                const role = await this.message.guild.roles.fetch(r)
                if (!role) continue
                const roleValid = checkRole(role)
                if (!roleValid) continue
                validroles.push(role.id)
            }
        }
        function checkRole(role) {
            if (!role) return false
            // Double check if the role is allowed to be assigned to a user
            if (role.managed) return false
            if (!role.editable) return false
            return true
        }
        if (validroles.length === 0) return
        // Bulk add
        this.message.member.roles.add(validroles)
            .catch(e => this.client.logger.error(`${this.instanceId} <ADD_ROLE_FAIL> ${e.stack}`))
    }

    /**
     * @deprecated 7/13/2024 Please remove all references or update to new style Please ask Pan for more information if needed
     * Extract/revoke out role
     * @param {object} roleIds
     * @return {void}
     */
    removeRole(roleIds) {
        roleIds = JSON.parse(roleIds)
        //  Skip addition if user already has the role
        if (this.message.member.roles.cache.has(roleIds)) return
        this.message.member.roles.remove(roleIds)
            .catch(e => this.client.logger.error(`${this.instanceId} <REMOVE_ROLE_FAIL> ${e.stack}`))
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
        this.client.db.databaseUtils.updateInventory({
            operation: operation,
            itemId: itemId,
            value: amount,
            userId: this.message.member.id,
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
        this.client.experienceLibs(this.message, this.message.guild, this.message.channel, this.locale).execute()
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
    async _durationalBuff(buffType, name, multiplier, duration) {
        buffType = buffType.toUpperCase()
        const key = `${buffType}_BUFF:${this.message.guild.id}@${this.message.member.id}`
        this.client.db.redis.sAdd(key, multiplier)
        //  If there are multiple buffs that has same ref_id, multiplier and item name
        //  The oldest instance/entry will be updated with the newest duration.
        let isMultiInstance = false
        const userDurationalBuffs = await this.client.db.durationalBuffs.getSavedUserDurationalBuffs(this.message.member.id)
        if (userDurationalBuffs.filter(b => (b.name.toLowerCase() === name.toLowerCase())
            && (b.multiplier === multiplier)
            && (b.type === buffType)).length > 0) isMultiInstance = true
        this.client.db.durationalBuffs.registerUserDurationalBuff(buffType, name, multiplier, duration, this.message.member.id, this.message.guild.id)
        const cronTask = async () => {
            //  Flush from cache and sqlite
            this.client.db.redis.srem(key, multiplier)
            this.client.db.durationalBuffs.getUserDurationalBuffId(buffType, name, multiplier, this.message.member.id, this.message.guild.id)
                .then(id => {
                    this.client.db.durationalBuffs.removeUserDurationalBuff(id)
                })
            //  Attempt to notice the user about expiration
            this.client.responseLibs(this.message).send(`Your **'${name}'** buff has expired! ${await this.client.getEmoji(`AnnieHeartPeek`)}`, {
                field: this.message.member,
                footer: `${this.message.guild.name}'s System Notification`
            })
                .catch(e => e)
        }
        if (isMultiInstance) return this.client.cronManager.update(multiplier + `_` + key, new Date(Date.now() + duration), cronTask)
        return this.client.cronManager.add(multiplier + `_` + key, new Date(Date.now() + duration), cronTask, { start: true })
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
