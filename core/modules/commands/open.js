const GUI = require(`../../utils/halloweenGachaInterfaceManager`)
const updateData = require(`../../utils/halloweenGachaContainerStoring`)
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
    get roll_type() {
        return this.stacks.command.startsWith(`multi-open`) ? 10 : 1
    }


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
        let rates = (await this.db.halloweenBoxDropRates).map(v => v.drop_rate)

        //	get loot by defined rate
        let get_loots = async (probs) => await this.db.lootGroupByRateForHalloween(closestUpper(rates, probs), `halloween_rewards_pool`)

        for (let i = 0; i < limit; i++) {
            //let arbitrary_num = Math.random() * 100
            let arbitrary_num = Math.random()
            let firstRes = await get_loots(arbitrary_num)
            let res = firstRes[Math.floor(Math.random() * firstRes.length)]
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


    async halloweenBox() {
        const { message, name, reply, code: { HALLOWEEN_GACHA }, choice, emoji } = this.stacks

        //	Returns if user doesn't have any halloween box
        if (!this.data.halloween_box) return reply(HALLOWEEN_GACHA.ZERO_TICKET)

        //	Returns if user trying to do multi-roll with owned less than 10 tickets
        if (this.data.halloween_box < this.roll_type) return reply(HALLOWEEN_GACHA.INSUFFICIENT_TICKET, { socket: [`boxes`] })

        //	Returns if user state still in cooldown
        if (Cooldown.has(this.author.id)) return reply(HALLOWEEN_GACHA.COOLING_DOWN)


        message.delete()
        //	Opening text
        reply(emoji(`aaueyebrows`) + choice(HALLOWEEN_GACHA.OPENING_WORDS), {
            socket: [name(this.author.id)],
            notch: true,
            imageGif: `https://cdn.discordapp.com/attachments/614737097454125056/632048843483119617/halloween_box_animated.gif`
        })


            .then(async opening => {
                Cooldown.add(this.author.id)


                setTimeout(async () => {
                    //	Get roll metadata
                    let rollContainer = await this.roll(this.roll_type)

                    //	Get buffer interface
                    let renderResult = await new GUI(this.stacks, rollContainer).render


                    //	Parse backend and store inventory items
                    await new updateData(this.stacks, rollContainer).run()

                    opening.delete()
                    //	Render result
                    reply(`**${name(this.author.id)} used ${this.roll_type} halloween boxes!**`, {
                        image: renderResult,
                        prebuffer: true,
                        simplified: true,
                    })

                    //	Unlock cooldown
                    setTimeout(() => {
                        Cooldown.delete(this.author.id)
                    }, 2000)
                }, 2000)

            })
    }

    async halloweenBag() {
        const { message, name, reply, bot: { db }, code: { HALLOWEEN_GACHA }, choice, emoji } = this.stacks

        let amountOfCandies = Math.random() <= .01 ? 25 : Math.floor(Math.random() * 5)
        //	Returns if user doesn't have any halloween bags
        if (!this.data.halloween_bag) return reply(HALLOWEEN_GACHA.ZERO_TICKET)

        //	Returns if user trying to do multi-open with owned less than 10 bags
        if (this.data.halloween_bag < this.roll_type) return reply(HALLOWEEN_GACHA.INSUFFICIENT_TICKET, { socket: [`bags`] })

        //	Returns if user state still in cooldown
        if (Cooldown.has(this.author.id)) return reply(HALLOWEEN_GACHA.COOLING_DOWN)

        message.delete()
        //	Opening text
        reply(emoji(`aaueyebrows`) + choice(HALLOWEEN_GACHA.OPENING_WORDS), {
            socket: [name(this.author.id)],
            notch: true,
            imageGif: `https://cdn.discordapp.com/attachments/614737097454125056/632048843483119617/halloween_box_animated.gif`
        })


            .then(async opening => {
                Cooldown.add(this.author.id)

                // Add candies to user
                db.storeCandies(amountOfCandies)

                // Remove bags
                db.withdrawHalloweenBag(this.roll_type)

                opening.delete()
                setTimeout(async () => {

                    //	Render result
                    reply(`**${name(this.author.id)} Opened ${this.roll_type} halloween bags!**\nFor a total of: **${amountOfCandies * this.roll_type}** candies`, {
                        simplified: true,
                    })

                    //	Unlock cooldown
                    setTimeout(() => {
                        Cooldown.delete(this.author.id)
                    }, 2000)
                }, 2000)

            })
    }

    async halloweenChest() {
        const { message, name, reply,bot:{db}, code: { HALLOWEEN_GACHA }, choice, emoji } = this.stacks

        let amountOfCandies = Math.random() <= .01 ? 100 : Math.floor(Math.random() * 20)

        //	Returns if user doesn't have any halloween chests
        if (!this.data.halloween_chest) return reply(HALLOWEEN_GACHA.ZERO_TICKET)

        //	Returns if user trying to do multi-open with owned less than 10 chests
        if (this.data.halloween_chest < this.roll_type) return reply(HALLOWEEN_GACHA.INSUFFICIENT_TICKET, { socket: [`chests`] })

        //	Returns if user state still in cooldown
        if (Cooldown.has(this.author.id)) return reply(HALLOWEEN_GACHA.COOLING_DOWN)

        message.delete()
        //	Opening text
        reply(emoji(`aaueyebrows`) + choice(HALLOWEEN_GACHA.OPENING_WORDS), {
            socket: [name(this.author.id)],
            notch: true,
            imageGif: `https://cdn.discordapp.com/attachments/614737097454125056/632048843483119617/halloween_box_animated.gif`
        })


            .then(async opening => {
                Cooldown.add(this.author.id)


                setTimeout(async () => {

                    // Add candies to user
                    db.storeCandies(amountOfCandies)

                    // Remove chests
                    db.withdrawHalloweenChest(this.roll_type)

                    opening.delete()

                    //	Render result
                    reply(`**${name(this.author.id)} Opened ${this.roll_type} halloween bags!**\nFor a total of: **${amountOfCandies * this.roll_type}** candies`, {
                        simplified: true,
                    })

                    //	Unlock cooldown
                    setTimeout(() => {
                        Cooldown.delete(this.author.id)
                    }, 2000)
                }, 2000)

            })
    }
	/**
	 * 	Initializer
	 */
    async execute() {
        const { args, reply, code: { HALLOWEEN_GACHA }, gachaField, isGachaField } = this.stacks

        //	Returns if current channel is not in gacha-allowed list
        if (!isGachaField) return reply(HALLOWEEN_GACHA.UNALLOWED_ACCESS, { socket: [gachaField] })

        switch (args[0]) {
            case `bag`:
                this.halloweenBag()
                break
            case `chest`:
                this.halloweenChest()
                break
            default:
                this.halloweenBox()
                break
        }
    }
}

module.exports.help = {
    start: HalloweenBox,
    name: `open`,
    aliases: [`open`, `multi-open`],
    description: `opens a Halloween box.`,
    usage: `open hb`,
    group: `shop-related`,
    public: false,
    required_usermetadata: true,
    multi_user: false
}