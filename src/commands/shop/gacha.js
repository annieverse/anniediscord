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
        this.loots = []
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, name, trueInt, choice, bot:{db} }) {
    	await this.requestUserMetadata(2)

    	//  Handle if user doesn't have any lucky ticket to be opened.
    	if (!this.user.inventory.lucky_ticket) return reply(this.locale.GACHA.INSUFFICIENT_TICKET, {socket: {emoji: emoji(`AnnieDead`)}, color: `red`})
    	const amountToOpen = this.args[0] ? trueInt(this.args[0]) : 1 
    	//  Handle if amount be opened is invalid
    	if (!amountToOpen) return reply(this.locale.GACHA.INVALID_AMOUNT, {color: `red`, socket: {emoji: emoji(`AnnieCry`)} })
        //  Handle if amount to be opened is out of range (1/10)
        if (![1, 10].includes(amountToOpen)) return reply(this.locale.GACHA.AMOUNT_OUTOFRANGE, {color: `red`})
    	//  Handle if amount to be opened is higher than the owned ones
    	if (this.user.inventory.lucky_ticket < amountToOpen) return reply(this.locale.GACHA.INSUFFICIENT_TICKET, {
    		socket: {emoji: emoji(`AnnieDead`)},
            color: `red`
        })
    	const rewardsPool = await db.getGachaRewardsPool()
    	//  Handle if no rewards are available to be pulled from gacha.
    	if (!rewardsPool.length) return reply(this.locale.GACHA.UNAVAILABLE_REWARDS, {socket: {emoji: emoji(`AnnieCry`)} })
        this.fetching = await reply(choice(this.locale.GACHA.OPENING_WORDS), {
            simplified: true,
            socket: {
                user: name(this.user.id),
                emoji: emoji(`AnnieStabby`)
            }
        })
        //  Registering loot
        for (let i=0; i<amountToOpen; i++) {
            const loot = this.getLoot(rewardsPool)
            this.loots.push(loot)
        }

        //  Subtract user's lucky tickets
        await db.updateInventory({itemId: 71, value: amountToOpen, operation: `-`, userId: this.user.id, guildId: this.message.guild.id})
        //  Storing items into user's inventory
        for (let i=0; i<this.loots.length; i++) {
            const item = this.loots[i]
            await db.updateInventory({itemId: item.item_id, value: item.quantity, operation: `+`, userId: this.user.id, guildId: this.message.guild.id})
        }

        //  Displaying result
        await reply(this.locale.COMMAND.TITLE, {
            prebuffer: true,
            image: await new GUI(this.loots, this.drawCounts).build(),
            simplified: true,
            socket: {
                command: `has opened ${this.drawCounts} Lucky Tickets!`,
                user: name(this.user.id),
                emoji: emoji(`lucky_ticket`)
            }
        })
        this.fetching.delete()
        return reply(this.displayDetailedLoots(emoji), {simplified: true})
    }

    /**
     * Aggregate and prettify this.loots into a readable list.
     * @param {function} emojiParser refer to Pistachio.emoji()
     * @returns {string}
     */
    displayDetailedLoots(emojiParser) {
        let str = ``
        let items = this.loots.map(item => item.name)
        let uniqueItems = [...new Set(items)]
        for (let i=0; i<uniqueItems.length; i++) {
            const item = this.loots.filter(item => item.name === uniqueItems[i])
            const amount = item.map(item => item.quantity)
            const receivedAmount = amount.reduce((acc, current) => acc + current)
            str += `${emojiParser(item[0].alias)} **[${item[0].type_name}] ${receivedAmount}x ${uniqueItems[i]}**\n`
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
        return item[0]
    }

    /**
     * Determine user's gacha counts
     * type {number}
     */
    get drawCounts() {
        return !this.args[0] ? 1 : 10
    }

}

module.exports.help = {
	start: Gacha,
	name: `gacha`,
	aliases: [`multi-gacha`,`gacha`],
	description: `Opens a Lucky Ticket and wins various exclusive rewards such as covers, badges, gifts and even 5-star cards!`,
	usage: `gacha <Amount>`,
	group: `Shop`,
	permissionLevel: 0,
	multiUser: false
}