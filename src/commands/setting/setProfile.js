const Command = require(`../../libs/commands`)
/**
 * Edit and customize your profile decorations such as covers, stickers, badges, etc.
 * @author klerikdust
 */
class SetProfile extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        this.profileDecorations = [`Stickers`, `Covers`, `Badges`]
        this.actions = [`equip`, `unequip`]
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji }) {
        await this.requestUserMetadata(2)

        //  Handle if user doesn't specify the target item to be edit
        if (!this.args[0]) return reply (this.locale.SETPROFILE.GUIDE)
        const items = this.user.inventory.raw.filter(key => (key.type_name.toUpperCase() === this.itemType) || (key.type_name.toUpperCase() === (this.itemType + `S`)))
        //  Handle if item/item type doesn't exists in user's inventory.
        if (!items.length) return reply (this.locale.SETPROFILE.INVALID_ITEM, {color: `red`, socket: {emoji: emoji(`AnnieCry`)} })
        //  Handle if the target item is not in profile decorations category.
        if (!this.profileDecorations.includes(items[0].type_name)) return reply(this.locale.SETPROFILE.NON_PROFILEDECORATION, {color: `red`})
        //  Handle if user trying to use deprecated `setprofile covers` action
        if (items[0].type_id === 1) return reply(this.locale.SETPROFILE.DEPRECATE_COVER_ACTION, {
            color: `golden`,
            socket: {
                emoji: emoji(`warn`),
                prefix: this.bot.prefix
            }
        })

        const equippedItems = items.filter(key => key.in_use === 1)
        const unequippedItems = items.filter(key => key.in_use === 0)
        const currentlyEquippedItem = equippedItems[0]
        this.setSequence(5)

        //  Display the used item, and the available items to be used.
        reply(`
                ${equippedItems.length > 0 ? this.locale.SETPROFILE.EQUIPPED_ITEMS : this.locale.SETPROFILE.NO_EQUIPPED_ITEMS}
                ${unequippedItems.length > 0 ? `\n${this.locale.SETPROFILE.UNEQUIPPED_ITEMS}\n${this.prettifyList(unequippedItems)}\n` : ``}${unequippedItems.length > 0 ? this.locale.SETPROFILE.EQUIPPING_GUIDE+`\n` : ``}${equippedItems.length > 0 ? this.locale.SETPROFILE.UNEQUIPPING_GUIDE: ``}`, {
            color: `golden`,
            socket: {
                item: [equippedItems.map(key => `[${key.item_id}] ${key.name}`).join(`, `)],
                type: this.itemType.toLowerCase(),
                unequippedItemList: this.prettifyList(unequippedItems)
            }
        })
        .then(displayedItem => {
            this.sequence.on(`collect`, async msg => {
                let input = msg.content.toLowerCase()
                let parameters = input.split(` `)

                /** --------------------
                 *  Sequence Cancellations
                 *  --------------------
                 */
                if (this.cancelParameters.includes(input)) {
                    reply(this.locale.ACTION_CANCELLED)
                    return this.endSequence()
                }

                const actionType = parameters[0]
                //  Handle if action type is invalid
                if (!this.actions.includes(actionType)) return reply(this.locale.SETPROFILE.INVALID_ACTION, {color: `red`})
                //  Handle if user tries to equip while not having any available items of the given type.
                if ((unequippedItems.length < 1) && (actionType === this.actions[0])) return reply(this.locale.SETPROFILE.EQUIPPING_NOTHING, {color: `red`, socket: {emoji: emoji(`AnnieDead`)} })
                //  Handle if user tries to unequip while not equipping anything.
                if ((equippedItems.length < 1) && (actionType === this.actions[1])) return reply(this.locale.SETPROFILE.UNEQUIPPING_NOTHING, {color: `red`, socket: {emoji: emoji(`AnniePogg`)} })
                //  Handle if user doesn't specify the second arg/keyword for target item
                if (parameters.length < 2) return reply(this.locale.SETPROFILE.MISSING_TARGET_ITEM, {color: `red`})

                const targetItemKeyword = parameters.slice(1).join(` `)
                const targetItem = items.filter(key => 
                    (key.name.toLowerCase() === targetItemKeyword) 
                    || (key.item_id === parseInt(targetItemKeyword)) 
                    || (key.alias === targetItemKeyword))

                //  Handle if target item is unavailable in user's inventory
                if (!targetItem.length) return reply (this.locale.SETPROFILE.INVALID_ITEM, {color: `red`})
                //  Unequip previos item if the item's max_use is `1`
                if (currentlyEquippedItem && (actionType === `equip`)) {
                    if (currentlyEquippedItem.type_max_use <= 1) await this.unequip(currentlyEquippedItem.item_id)
                }
                //  Update new item
                await this[actionType](targetItem[0].item_id)

                displayedItem.delete()
                reply(this.locale.SETPROFILE.SUCCESSFUL, {
                    color: `lightgreen`,
                    socket: {
                        item: targetItem[0].name,
                        itemType: targetItem[0].type_name.toLowerCase(),
                        actionType: actionType + `ped`
                    }
                })
                return this.endSequence()
            })
        })
    }

    /**
     * Set user item's in_use value to `1`
     * param {number} [itemId] target item to be set.
     * returns {Database:QueryResult}
     */
    async equip(itemId) {
        return this.bot.db.useItem(itemId, this.user.master.id, this.message.guild.id)
    }

    /**
     * Set user item's in_use value to `0`
     * param {number} [itemId] target item to be set.
     * returns {Database:QueryResult}
     */
    async unequip(itemId) {
        return this.bot.db.unuseItem(itemId, this.user.master.id, this.message.guild.id)
    }

    /**
     * Extract item's type from user's first arg.
     * type {string}
     */
    get itemType() {
        return this.args[0].toUpperCase()
    }

    /**
     * Properly arrange returned list from `user.inventory.raw`
     * @param {array} [list=[]] this.user.inventory.raw
     * @returns {string}
     */
    prettifyList(list) {
        let str = ``
        for (let i = 0; i<list.length; i++) {
            const item = list[i]
            str += `[${item.item_id}] ${item.name}${list.length === (list.length-1) ? `` : `\n`}`
        }
        return str
    }
}


module.exports.help = {
    start: SetProfile,
    name: `setProfile`, 
    aliases: [`setprof`, `setp`, `editprofile`, `editprof`, `editp`, `setprofile`], 
    description: `Edit and customize your profile decorations such as covers, stickers, badges, etc.`,
    usage: `setprofile`,
    group: `Setting`,
    permissionLevel: 0,
    multiUser: false,
    invisible: true
}