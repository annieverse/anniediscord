const Transaction = require(`../../utils/TransactionHandler`);
const Checkout = require(`../../utils/TransactionCheckout`);

/**
 * Main module
 * @Buy as transaction initializer
 */
class Buy {
    constructor(Stacks) {
        this.author = Stacks.meta.author;
        this.data = Stacks.meta.data;
        this.utils = Stacks.utils;
        this.args = Stacks.args;
        this.message = Stacks.message;
        this.log = Stacks.log.BUY;
        this.reply = Stacks.utils.systemMessage;
        this.categories = ['ROLE', 'TICKET', 'SKIN', 'BADGE', 'COVER', 'PACKAGE'];
    }


    async execute() {

        if (!this.args[0]) return this.reply(
            this.log.ERR.MISSING_CATEGORY,
            [this.utils.name(this.author.id)]
        )

        let key = this.args[0].toUpperCase();

        // Purchase role
        if (key === this.categories[0]) {

            if (!this.args[1]) return this.reply(this.log.ERR.MISSING_ROLENAME)

            const target = this.message.content.substring(10);
            const trans = new Transaction(target, `Roles`);
            const item = await trans.pull;

            try {
                //  Returns if user level doesn't meet the requirement.
                if (this.data.level < 25) return this.reply(this.log.ERR.LVL_TOO_LOW);

                // Reject insufficent balance
                if (this.data.artcoins < parseInt(item.price)) return this.reply(this.log.ERR.INSUFFICIENT_BALANCE);

                // Balance has met the condition
                if (this.data.artcoins >= parseInt(item.price)) {
                    new Checkout(item, trans)
                }

            } catch (e) {
                return
            }
        }


        // Purchase ticket
        else if (key === this.categories[1]) {

            if (!this.args[1]) return
            const target = this.message.content.substring(12);
            const trans = new Transaction(target, `Tickets`, this.message, this.author);
            const item = await trans.pull;

            try {
                //  Insufficient balance
                if (this.data.artcoins < parseInt(item.price)) return

                //  Balance has met the condition
                if (this.data.artcoins >= parseInt(item.price)) {
                    console.log(`yay passed!`)
                    new Checkout(item, trans, this.message, this.author).run()
                }
            } catch (e) {
                return
            }
        }


        // Purchase skin
        else if (key === this.categories[2]) {

            if (!this.args[1]) return
            const target = this.message.content.substring(10);
            const trans = new Transaction(target, `Skins`);
            const item = await trans.pull;

            try {
                //  Reject duplicate alias.
                if (this.data.interfacemode === item.alias) return

                //  Insufficient balance.
                if (this.data[item.price_type] < parseInt(item.price)) return

                // Balance has met the condition.
                if (this.data[item.price_type] >= parseInt(item.price)) {
                    new Checkout(item, trans);
                }
            } catch (e) {
                return
            }

        }


        //  Purchase badge
        else if (key === this.categories[3]) {

            if (!this.args[1]) return
            const target = this.message.content.substring(11);
            const trans = new Transaction(target, `Badges`);
            const item = await trans.pull;

            // Badges-related variables
            const databaseManager = require(`../../utils/databaseManager`);
            const badgesdata = await new databaseManager(this.author.id).badges;
            const slotkey = Object.keys(badgesdata);
            const slotvalue = Object.values(badgesdata);

            try {

                //  No available slots left
                if (slotvalue.indexOf(null) === -1) return

                //  Reject duplicate alias
                if (slotvalue.includes(item.alias)) return

                //  Insufficient balance
                if (this.data.artcoins < parseInt(item.price)) return

                // Balance has met the condition
                if (this.data.artcoins >= parseInt(item.price)) {
                    new Checkout(item, trans, true)
                }
            } catch (e) {
                return
            }
        }


        // Purchase cover
        else if (key === this.categories[4]) {

            if (!this.args[1]) return
            const target = this.message.content.substring(11);
            const trans = new Transaction(target, `Covers`);
            const item = await trans.pull;

            try {

                //  Reject duplicate alias.
                if (this.data.cover === item.alias) return

                //  Insufficient balance.
                if (this.data[item.price_type] < parseInt(item.price)) return

                // Balance has met the condition.
                if (this.data[item.price_type] >= parseInt(item.price)) {
                    new Checkout(item, trans, true);
                }

            } catch (e) {
                return
            }
        }

        //argument is not listed as valid category
        else return this.reply(this.log.ERR.INVALID_CATEGORY);
    }
}

module.exports.help = {
    start: Buy,
    name: "buy",
    aliases: [],
    description: `buy an item from the shop`,
    usage: `>buy <item>`,
    group: "Shop-related",
    public: true,
    require_usermetadata: true,
    multi_user : false
}