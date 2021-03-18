const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/gacha`)
const closestBelow = require(`../../utils/closestBelow`)
/**
 * Opens a Lucky Ticket and wins various exclusive rewards!
 * @author klerikdust
 */
class Gacha extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)

        /**
         * The received loots will be stored in this array
         * @type {array} 
         */
        this.loots = []

        /**
         * The maximum threeshold of opening gacha will be limited to range in this array.
         * @type {array} 
         */
        this.amountToOpenRanges = [1, 10]
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, name, trueInt, commanifier, choice }) {
    	await this.requestUserMetadata(2)
    	this.amountToOpen = this.args[0] ? trueInt(this.args[0]) : 1
        this.tools = { reply, emoji, name, trueInt, commanifier, choice } 
        //  Handle if amount to be opened is out of defined range.
        if (!this.amountToOpenRanges.includes(this.amountToOpen)) return reply(this.locale.GACHA.AMOUNT_OUTOFRANGE, {
            socket: {emoji: await emoji(`781504248868634627`)}
        })
        //  Direct roll if user already has the tickets.
        if (this.user.inventory.lucky_ticket >= this.amountToOpen) return this.startsRoll()

        /**
         * --------------------
         * STARTS PURCHASE CHAINING
         * --------------------
         * @author klerikdust
         * Q: What's the reason of adding this?
         * A: I've seen a lot of people, especially the newbie ones are often
         * having trouble of how to purchase the stuff to participate in the gacha. Browsing through the shop
         * usually kind of overwhelming them, which might intimidates them to look further.
         * My hope after implementing this so-called-purchase-chaining model is, we'll able to gauge new user's interest
         * to play with our gacha with small effort (no need to get through the buy command first)
         * and enjoy the rest of the content.
         */
        this.insufficientTicketWarning = await reply(this.locale.GACHA.INSUFFICIENT_TICKET, {
		   socket: {emoji: await emoji(`751020535865016420`), prefix: this.bot.prefix},
           color: `red`
        })
        const gachaItem = await this.bot.db.getItem(71)
        const payment = await this.bot.db.getPriceOf(71)
        const paymentItem = await this.bot.db.getItem(payment.item_price_id)
        const userCurrentCurrency = this.user.inventory[paymentItem.alias]
        const amountToPay = payment.price*this.amountToOpen

        //  Handle if user doesn't have enough artcoins to buy tickets
        if (userCurrentCurrency < amountToPay) return reply(this.locale.GACHA.SUGGEST_TO_GRIND, {
            simplified: true,
            socket: {emoji: await emoji(`692428927620087850`)}
        })

        /**
         * --------------------
         * 1.) GIVE PURCHASE OFFER TO USER
         * --------------------
         */
        this.suggestToBuy = await reply(this.locale.GACHA.SUGGEST_TO_BUY, {
            simplified: true,
            socket: {emoji: await emoji(`lucky_ticket`)}
        })
		await this.addConfirmationButton(`suggestToBuy`, this.suggestToBuy)
        this.confirmationButtons.get(`suggestToBuy`).on(`collect`, async r1 => {
			//  Handle cancellation
			if (this.isCancelled(r1)) return reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await emoji(`781954016271138857`)}
			})
            this.suggestToBuy.delete()
            this.insufficientTicketWarning.delete()

            /**
             * --------------------
             * 2.) CHECKOUT TRANSACTION
             * --------------------
             */
            this.checkout = await reply(this.locale.BUY.CHECKOUT_PREVIEW, {
                socket: {
                    total: `${await emoji(paymentItem.alias)}${commanifier(amountToPay)}`,
                    item: `[${this.amountToOpen}x] ${gachaItem.name}`,
                    itemType: gachaItem.type_name
                },
                color: `golden`,
            })

            await this.addConfirmationButton(`checkout`, this.checkout)
            this.confirmationButtons.get(`checkout`).on(`collect`, async r2 => {
                //  Handle cancellation
                if (this.isCancelled(r2)) return reply(this.locale.ACTION_CANCELLED, {
                    socket: {emoji: await emoji(`781954016271138857`)}
                })
                this.checkout.delete()
                //  Deduct balance & deliver lucky tickets
                await this.bot.db.updateInventory({itemId: paymentItem.item_id, value: amountToPay, operation: `-`, userId: this.user.master.id, guildId: this.message.guild.id})
                await this.bot.db.updateInventory({itemId: 71, value: this.amountToOpen, operation: `+`, userId: this.user.master.id, guildId: this.message.guild.id})
                reply(this.locale.BUY.SUCCESSFUL, {
                    color: `lightgreen`,
                    socket: {
                        item: `${await emoji(gachaItem.alias)} [${gachaItem.type_name}] ${commanifier(this.amountToOpen)}x ${gachaItem.name}`,
                        emoji: await emoji(`751016612248682546`)
                    }
                })

                /**
                 * --------------------
                 * 3.) ASK USER IF THEY WANT TO STRAIGHT OPEN IT OR NOT.
                 * --------------------
                 */
                this.askToOpenGacha = await reply(this.locale.GACHA.ASK_TO_OPEN, {simplified: true})
                await this.addConfirmationButton(`askToOpenGacha`, this.askToOpenGacha)
                this.confirmationButtons.get(`askToOpenGacha`).on(`collect`, async r3 => {
                        //  Handle cancellation
                        if (this.isCancelled(r3)) return reply(this.locale.ACTION_CANCELLED, {
                            socket: {emoji: await emoji(`781954016271138857`)}
                        })
                        this.askToOpenGacha.delete()
                        this.startsRoll()
                })
            })
        })
    }

    async startsRoll() {
        const rewardsPool = await this.bot.db.getGachaRewardsPool()
        //  Handle if no rewards are available to be pulled from gacha.
        if (!rewardsPool.length) return this.tools.reply(this.locale.GACHA.UNAVAILABLE_REWARDS, {socket: {emoji: this.tools.emoji(`AnnieCry`)} })
        this.fetching = await this.tools.reply(this.tools.choice(this.locale.GACHA.OPENING_WORDS), {
            simplified: true,
            socket: {
                user: this.tools.name(this.user.master.id),
                emoji: await this.tools.emoji(`781504248868634627`)
            }
        })
        //  Registering loot
        for (let i=0; i<this.amountToOpen; i++) {
            const loot = this.getLoot(rewardsPool)
            this.loots.push(loot)
        }

        //  Subtract user's lucky tickets
        await this.bot.db.updateInventory({itemId: 71, value: this.amountToOpen, operation: `-`, userId: this.user.master.id, guildId: this.message.guild.id})
        //  Storing received loots into user's inventory
        for (let i=0; i<this.loots.length; i++) {
            const item = this.loots[i]
            await this.bot.db.updateInventory({itemId: item.item_id, value: item.quantity, operation: `+`, userId: this.user.master.id, guildId: this.message.guild.id})
        }

        //  Displaying result
        await this.tools.reply(this.locale.COMMAND.TITLE, {
            prebuffer: true,
            image: await new GUI(this.loots, this.drawCounts).build(),
            simplified: true,
            socket: {
                command: `has opened ${this.drawCounts} Lucky Tickets!`,
                user: this.tools.name(this.user.master.id),
                emoji: await this.tools.emoji(`lucky_ticket`)
            }
        })
        this.fetching.delete()
        await this.tools.reply(await this.displayDetailedLoots(this.tools.emoji), {simplified: true})   
    }

    /**
     * Aggregate and prettify this.loots into a readable list.
     * @returns {string}
     */
    async displayDetailedLoots() {
        let str = ``
        let items = this.loots.map(item => item.name)
        let uniqueItems = [...new Set(items)]
        for (let i=0; i<uniqueItems.length; i++) {
            const item = this.loots.filter(item => item.name === uniqueItems[i])
            const amount = item.map(item => item.quantity)
            const receivedAmount = amount.reduce((acc, current) => acc + current)
            str += `${await this.tools.emoji(item[0].alias)} **[${item[0].type_name}] ${receivedAmount}x ${uniqueItems[i]}**\n`
        }
        return str
    }

    /**
     * Get possible item from given rewards pool (returned result from `Database.getGachaRewardsPool()`).
     * Uses basic RNG by weight.
     * @param {array} [rewardsPool=[]] returned array from `Database.getGachaRewardsPool()`
     * @returns {object}
     */
    getLoot(rewardsPool=[]) {
        const fn = `[Gacha.getLoot()]`
        const totalProbability = rewardsPool.reduce((total, item) => total + item.weight, 0)
        const weightsPool = rewardsPool.map(item => item.weight)
        let rng = Math.random() * totalProbability
        //  Handle if rng is hitting infinity
        if (rng === `-infinity`) {
            this.logger.error(`${fn} variable 'rng' has reached -infinite. Now it will fallback rng's value to 100.`)
            rng = 100
        }
        const fitInRanges = closestBelow(weightsPool, rng)
        const item = rewardsPool.filter(item => item.weight === fitInRanges)
        //  Variable 'result' will determine if there are multiple items in the same weight
        //  then randomize the array. Otherwise, returns the first index.
        const result = item.length > 1 ? item[Math.floor(Math.random () * item.length)] : item[0]
        return result
    }

    /**
     * Determine user's gacha counts
     * type {number}
     */
    get drawCounts() {
        return !this.args[0] || this.args[0] == 1 ? 1 : 10
    }

}

module.exports.help = {
	start: Gacha,
	name: `gacha`,
	aliases: [`gch`,`gacha`, `reroll`],
	description: `Opens a Lucky Ticket and wins various rewards such as card collection and cosmetic items!`,
	usage: `gacha <Amount>`,
	group: `User`,
	permissionLevel: 0,
	multiUser: false
}