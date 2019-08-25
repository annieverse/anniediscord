const Discord = require(`discord.js`)
const databaseManager = require(`../../utils/databaseManager`)
const formatManager = require(`../../utils/formatManager`)
const env = require(`../../../.data/environment`)
const moment = require(`moment`)

/**
 * Main module
 * @Limitedshop opening and closing limited time shop
 */
class Limitedshop {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async execute() {
		const {bot, reply, message, command, isAdmin, isDev, palette, emoji, code: {UNAUTHORIZED_ACCESS}} = this.stacks
		if (!isDev && !isAdmin) return reply(UNAUTHORIZED_ACCESS)

		const args = message.content.substring(command.length + env.prefix.length + 1).split(` `)
		const format = new formatManager(message)
		const events = {
			'halloween': {
				'emote': `ghost`,
				'currency': `candy`,
				'shopname': `Halloween Limited Shop`
			},
			'christmas': {
				'emote': `christmas_tree`,
				'currency': `artcoins`,//TODO
				'shopname': `Christmas Limited Shop`
			},
			'new-years': {
				'emote': `tada`,
				'currency': `artcoins`,
				'shopname': `New Years Limited Shop`
			},
			'valentines': {
				'emote': `hearts`,
				'currency': `artcoins`,
				'shopname': `Valentines Day Limited Shop`
			},
			'sping': {
				'emote': `tulip`,
				'currency': `artcoins`,
				'shopname': `Spring Limited Shop`
			},
			'easter': {
				'emote': `rabbit`,
				'currency': `artcoins`,
				'shopname': `Easter Limited Shop`
			},
			'annieversary': {
				'emote': `AnnieHype`,
				'currency': `artcoins`,
				'shopname': `Annieversary Limited Shop`
			},
			'summer': {
				'emote': `sunny`,
				'currency': `artcoins`,
				'shopname': `Summer Limited Shop`
			}
		}

		//TODO enable ONLY buy command in 614819522310045718
		//TODO possible delete messages after each buy command?
		/*
        * TODOs before opening shops
        * Upload and link shop banner for shop type with instructions >buy <category> <id>
        * Upload and define emotes and currencies in const events
        * Create column for currency in idk userdata?
        * Fill itemlist with shop items; use status for labels (e.g. halloween-sale); labels need to end with "sale"
        * Upload items to /core/images folder
        * Uncomment stuff in open so that it actually gets opened to the public
        * */
		const stock = async () => {
			bot.channels.get(`614819522310045718`).bulkDelete(10)
			let shoptype = (args.length >= 2) ? args[1] : getShopType()
			let shopdata = events[shoptype]
			let shopname = shopdata ? shopdata.shopname : shoptype.replace(/^\w/, c => c.toUpperCase()) + ` Limited Shop`
			let shopemote = shopdata ? emoji(shopdata.emote) : emoji(`AnnieHype`)
			let shopcurrency = shopdata ? shopdata.currency : `artcoins`
			//TODO emotes dont work REEEEEEEEEEEEEEEEE

			bot.channels.get(`614819522310045718`).setName(shoptype + `  shop`)
			const page = new Discord.RichEmbed()
				.setDescription(`The ` + shopname + ` is here! ` + shopemote)
				.setColor(palette.darkmatte)
				.attachFile(`core/images/shop-` + shoptype + `-cov.png`)
				.setImage(`https://i.ibb.co/pKLyV1b/discordaau-premiumcoverbanner.png`)//TODO placeholder
			const collection = new databaseManager(message.member.id)
			let numitems = getItems(await collection.classifyLdtItem(shoptype, undefined, undefined), page, emoji(shopcurrency))
			page.setFooter(`We have ` + numitems + ` limited items in store!`)
			bot.channels.get(`614819522310045718`).send(page)
		}
		const open = async () => {
			//make channel 614819522310045718 public to @everyone
			//TODO uncomment this when the time comes; be careful when using this
			//TODO because we want the limited shop to be a surprise!
			/*bot.channels.get(`614819522310045718`).overwritePermissions(
                bot.channels.get(`614819522310045718`).guild.defaultRole,
                { VIEW_CHANNEL: true }
                );*/

		}

		const close = async () => {
			//TODO make message "store closed bla" or ig we dont need this since we prune the shop before opening anyway
			//make channel 614819522310045718 private
			/*bot.channels.get(`614819522310045718`).overwritePermissions(
                bot.channels.get(`614819522310045718`).guild.defaultRole,
                { VIEW_CHANNEL: false }
            );*/
		}

		/*
        * If the stocker is too fukken lazy to specify the shop type
        * we will stock the shop for the upcoming event from the list below
            * Halloween: 31.10
            * Christmas: 24.12
            * New Years: 31.12/01.01
            * Valentines: 14.02
            * Spring: 20.03 - 20.06
            * Easter: 22.03 - 25.04 (first sunday following first full moon on or after March 21st)
            * Annieversary: 22.06 (or 23.06 idk)
            * Summer: 21.06 - 23.09
        * */
		const getShopType = () => {
			let month = moment().month()
			let day = moment().date()
			switch (month) {
			case 0:
				return `valentines`
			case 1:
				if (day <= 14) return `valentines`
				return `spring`
			case 2:
			case 3:
				return `spring`
			case 4:
				return `annieversary`
			case 5:
				if (day <= 22) return `annieversary`
				return `summer`
			case 6:
				return `summer`
			case 7:
			case 8:
			case 9:
			case 10:
				return `halloween`
			case 11:
				if (day <= 25) return `christmas`
				return `new-year`
			}
		}

		const getItems = (source, page, emoji) => {
			let categories = []

			for (var key in source) {
				if (!categories.includes(source[key].type)) {
					categories.push(source[key].type)
				}
				//format copy pasted from shop.js
				var tempDesc = ``
				let priceRange = format.threeDigitsComa(source[key].price)
				tempDesc += `${emoji} ${priceRange} - **${source[key].name}**\n\`${source[key].desc}\`\n\n`
				page.addField(source[key].type, tempDesc)
			}
			return source.length
		}

		const run = () => {
			const helpmsg = `To stock, open, or close the shop, type >ltdshop stock/open/close respectively`
			if (!args) return reply(helpmsg)

			if (args[0] == `stock`) {
				stock()
			} else if (args[0] == `open`) {
				open()
			} else if (args[0] == `close`) {
				close()
			} else {
				return reply(helpmsg)
			}
		}
		run()
	}
}

module.exports.help = {
	start: Limitedshop,
	name: `limitedshop`,
	aliases: [`ltdshop`, `lshop`, `ltd`, `limitedshop`, `limited`],
	description: `Opens or closes limited time shop`,
	usage: `${require(`../../../.data/environment.json`).prefix}ltdshop <open>/<close>`,
	group: `Shop-related`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}