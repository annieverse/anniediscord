const Transaction = require(`../../utils/transactionHandler`);
const Checkout = require(`../../utils/transactionCheckout`);
const preview = require(`../../utils/config/itemPreview`);

/**
 * Main module
 * @Buy as transaction initializer
 */
class Buy {
    constructor(Stacks) {
        this.stacks = Stacks;
        this.categories = ['ROLE', 'TICKET', 'SKIN', 'BADGE', 'COVER'];
    }

    /**
     * Initializer method
     * @Execute
     */
    async execute() {

        const { reply, args, name, message, code:{BUY}, meta: { author, data } } = this.stacks;

        //  Returns no parametered input
        if (!args[0]) return reply(BUY.SHORT_GUIDE)

        const key = args[0].toUpperCase();

        //  Returns if category is invalid
        if (!this.categories.includes(key)) return reply(BUY.INVALID_CATEGORY)

        //  Returns if item is invalid
        if (!args[1]) return reply(BUY.MISSING_ITEMNAME)

        let transactionComponents = {
            itemname: message.content.substring(message.content.indexOf(args[1])).toLowerCase(),
            type: args[0].charAt(0).toUpperCase() + args[0].slice(1) + `s`,
            message: message,
            author: author,
            usermetadata: data
        }
        const slotvalue = Object.keys(data.badges);

        let transaction = new Transaction(transactionComponents)
        let item = await transaction.pull;
        let badgesOnLimit = Object.values(await data.badges).indexOf(null) === -1
        let badgesHaveDuplicate = Object.values(await data.badges).includes(item.alias)


        //  Returns if item is not valid
        if (!item) return reply(BUY.INVALID_ITEM)

        let checkoutComponents = {
            itemdata: item,
            transaction: transaction,
            preview: preview[key] ? item.alias : null,
            stacks: this.stacks,
            msg: message,
            user: author
        }

        //  Returns if user lvl doesn't meet requirement to buy roles
        if (transactionComponents.type === `Roles` && data.level < 25) return reply(BUY.ROLES_LVL_TOO_LOW)
        
        //  Reject duplicate skin.
        if (transactionComponents.type === `Skins` && data.interfacemode === item.alias) return reply(BUY.DUPLICATE_SKIN)

        //  No available slots left
        if (transactionComponents.type === `Badges` && badgesOnLimit) return reply(BUY.BADGES_LIMIT)

        //  Reject duplicate badge alias
        if (transactionComponents.type === `Badges` && badgesHaveDuplicate) return reply(BUY.DUPLICATE_BADGE)

        //  Reject duplicate cover alias.
        if (transactionComponents.type === `Covers` && data.cover === item.alias) return reply(BUY.DUPLICATE_COVER)

        //  Returns if balance is insufficent
        if (data[item.price_type] < item.price) return reply(BUY.INSUFFICIENT_BALANCE, {
            socket: [name(author.id), item.price_type]
        })

        return new Checkout(checkoutComponents).confirmation();
    }
}

module.exports.help = {
    start: Buy,
    name: "buy",
    aliases: [],
    description: `buy an item from the shop`,
    usage: `${require(`../../.data/environment.json`).prefix}buy <item>`,
    group: "Shop-related",
    public: true,
    required_usermetadata: true,
    multi_user : false
}