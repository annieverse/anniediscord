const GUI = require(`../../utils/gachaInterfaceManager`)
const updateData = require(`../../utils/gachaContainerStoring`)
const Cooldown = new Set()

class HalloweenBox {
    constructor(Stacks) {
        this.author = Stacks.meta.author
        this.data = Stacks.meta.data
        this.db = Stacks.db(this.author.id)
        this.stacks = Stacks
    }

	/**
	 * 	Get current roll type. Returns integer
	 */
    /*get roll_type() {
        return this.stacks.command.startsWith(`multi-roll`) ? 10 : 1
    }*/


	/**
	 * 	Randomize items from lucky tickets pool with arbitrary percentage.
	 * 	@param {Integer} limit roll counts
	 */
    async roll(limit) {
        const { world, emoji, reply, code: { SYS_NOTIFICATION }, relabel, closestUpper, pause } = this.stacks

        //	Roll's centralized metadata
        let metadata = {
            item: [],
            rate: [],
            rarity: [],
            type: [],
            alias: [],
            roll_type: limit
        }

        //	Get rates for each possible loot without duplicates			
        let rates = (await this.db.luckyTicketDropRates).map(v => v.drop_rate)

        //	get loot by defined rate
        let get_loots = async (probs) => await this.db.lootGroupByRate(closestUpper(rates, probs))

        //	Sort array result by ascending
        rates.sort((a, b) => { return a - b })

        for (let i = 0; i < limit; i++) {
            let arbitrary_num = Math.random() * 100
            let res = await get_loots(arbitrary_num)

            //	Fire up world chat if user has pulled 5 star item.
            if (res.rarity === 5) reply(SYS_NOTIFICATION.FIVESTAR_PULL, {
                socket: [this.author, emoji(relabel(res.item_alias)), res.item_name],
                field: world,
                simplified: true
            })

            //	Store metadata
            metadata.item.push(res.item_name)
            metadata.rate.push(res.drop_rate)
            metadata.rarity.push(res.rarity)
            metadata.type.push(res.type)
            metadata.alias.push(res.item_alias)
            await pause(100)

        }

        return metadata
    }


	/**
	 * 	Initializer
	 */
    async execute() {
        const { message, name, reply, code: { GACHA }, choice, emoji, gachaField, isGachaField } = this.stacks

        //	Returns if current channel is not in gacha-allowed list
        if (!isGachaField) return reply(GACHA.UNALLOWED_ACCESS, { socket: [gachaField] })

        //	Returns if user doesn't have any lucky ticket
        if (!this.data.halloween_box) return reply(GACHA.ZERO_TICKET)

        //	Returns if user trying to do multi-roll with owned less than 10 tickets
        if (this.data.halloween_box < this.roll_type) return reply(GACHA.INSUFFICIENT_TICKET)

        //	Returns if user state still in cooldown
        if (Cooldown.has(this.author.id)) return reply(GACHA.COOLING_DOWN)


        message.delete()
        //	Opening text
        reply(emoji(`aaueyebrows`) + choice(GACHA.OPENING_WORDS), {
            socket: [name(this.author.id)],
            simplified: true
        })


            .then(async opening => {
                Cooldown.add(this.author.id)

                //	Get roll metadata
                let rollContainer = await this.roll(this.roll_type)

                //	Get buffer interface
                let renderResult = await new GUI(this.stacks, rollContainer).render

                //	Parse backend and store inventory items
                await new updateData(this.stacks, rollContainer).run()

                opening.delete()
                //	Render result
                reply(`**${name(this.author.id)} used ${this.roll_type} Lucky Tickets!**`, {
                    image: renderResult,
                    prebuffer: true,
                    simplified: true,
                })

                //	Unlock cooldown
                setTimeout(() => {
                    Cooldown.delete(this.author.id)
                }, 2000)
            })
    }
}

module.exports.help = {
    start: HalloweenBox,
    name: `open`,
    aliases: [`open`],
    description: `opens a Halloween box.`,
    usage: `open hb`,
    group: `shop-related`,
    public: false,
    required_usermetadata: true,
    multi_user: false
}