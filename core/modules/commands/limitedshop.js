const Discord = require(`discord.js`)
const databaseManager = require(`../../utils/databaseManager`)
const formatManager = require(`../../utils/formatManager`)
const env = require(`../../../.data/environment`)
const moment = require(`moment`)
const sql = require(`sqlite`)
sql.open(`.data/database.sqlite`)

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
				'currencyACvalue': 100,
				'shopname': `Halloween Limited Shop`
			},
			'christmas': {
				'emote': `christmas_tree`,
				'currency': `artcoins`,//TODO
				'currencyACvalue': 100,
				'shopname': `Christmas Limited Shop`
			},
			'new-years': {
				'emote': `tada`,
				'currency': `artcoins`,
				'currencyACvalue': 100,
				'shopname': `New Years Limited Shop`
			},
			'valentines': {
				'emote': `hearts`,
				'currency': `artcoins`,
				'currencyACvalue': 100,
				'shopname': `Valentines Day Limited Shop`
			},
			'sping': {
				'emote': `tulip`,
				'currency': `artcoins`,
				'currencyACvalue': 100,
				'shopname': `Spring Limited Shop`
			},
			'easter': {
				'emote': `rabbit`,
				'currency': `artcoins`,
				'currencyACvalue': 100,
				'shopname': `Easter Limited Shop`
			},
			'annieversary': {
				'emote': `AnnieHype`,
				'currency': `artcoins`,
				'currencyACvalue': 100,
				'shopname': `Annieversary Limited Shop`
			},
			'summer': {
				'emote': `sunny`,
				'currency': `artcoins`,
				'currencyACvalue': 100,
				'shopname': `Summer Limited Shop`
			}
		}

		//TODO enable ONLY buy command in 614819522310045718
		//TODO possible delete messages after each buy command?
		//TODO also delete messages that are not from bot and not >buy?
		/*
        * TODOs before opening shops
        * Upload and link shop banner for shop type with instructions >buy <category> <id>
        * Upload and define emotes and currencies in const events
        * Fill itemlist with shop items; use status for labels (e.g. halloween-sale); labels need to end with "sale"
        * Upload items to /core/images folder
        * Uncomment stuff in open so that it actually gets opened to the public
        * */
		let shoptype
		let shopdata
		let shopname
		let shopemote
		let shopcurrency

		const initShopData = () => {
			//if (bot.channels.get(`614819522310045718`).guild.defaultRole.VIEW_CHANNEL) {//channel open to public
			//TODO uncomment the other and remove this temp hack
			if (bot.channels.get(`614819522310045718`).name.split(`  `)[0]==`halloween`) {//channel open to public
				shoptype = (args.length >= 2) ? args[1] : bot.channels.get(`614819522310045718`).name.split(`  `)[0]
			} else {
				shoptype = (args.length >= 2) ? args[1] : getShopType()
			}
			shopdata = events[shoptype]
			shopname = shopdata ? shopdata.shopname : shoptype.replace(/^\w/, c => c.toUpperCase()) + ` Limited Shop`
			shopemote = shopdata ? emoji(shopdata.emote) : emoji(`AnnieHype`)
			shopcurrency = shopdata ? shopdata.currency : `artcoins`
		}

		/**
		 * Creates a column in userinventories for the special currency. Start value: 0
		 */
		const createCurr = async () => {
			sql.all(`SELECT ${shopcurrency} FROM userinventories`)
				.then(() => { //column already exists
					reply(`Currency ${shopcurrency} already exists`)
					stock()
				})
				.catch(() => { //column doesn't exist
					sql.all(`ALTER TABLE userinventories ADD ${shopcurrency} INTEGER DEFAULT 0`) //add column
						.then(() => { //on successfully created
							reply(`Created currency ${shopcurrency}`)
							stock()
						})
						.catch(() =>{
							reply(`Couldn't create currency ${shopcurrency}`)
						})
				}
				)

		}

		/**
		 * Gets the on-sale items from itemlist
		 * Renames the shop channel name properly
		 * Formats the shop with shop name, banner, etc, and all the sale items
		 */
		const stock = async () => {
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

		/**
		 * Sets the limited shop channel to public
		 */
		const open = async () => {
			//make channel 614819522310045718 public to @everyone
			//TODO uncomment this when the time comes; be careful when using this
			// because we want the limited shop to be a surprise!
			/*bot.channels.get(`614819522310045718`).overwritePermissions(
                bot.channels.get(`614819522310045718`).guild.defaultRole,
                { VIEW_CHANNEL: true }
                );*/

		}

		/**
		 * Converts any leftover special currency back into AC at a third of the value
		 * (That's a shitty conversion rate)
		 */
		const destroyCurr = async () => {
			//in the case that a special shop doesn't use special currency do nothing
			if (shopcurrency==`artcoins`) return
			sql.all(`SELECT * FROM userinventories WHERE ${shopcurrency} > 0`)
				.then((data) => {
					for (var i=0;i<data.length;i++) {
						let newac = data[i].artcoins + Math.floor(data[i][shopcurrency] * events[shoptype].currencyACvalue/3)
						sql.all(`UPDATE userinventories SET ${shopcurrency} = 0, artcoins = ${newac} WHERE userId = ${data[i].userId}`)
					}
				})
			//TODO do we even delete the whole column?

		}

		/**
		 * Closes the shop to the public
		 * Renames the shop channel name to closed shop
		 */
		const close = async () => {
			//TODO maybe on >ltdshop close set time for 1 week; notify everyone who still has special currency,
			// only close shop and convert currency after the week?
			//TODO make message "store closed bla" or ig we dont need this since we prune the shop before opening anyway
			//make channel 614819522310045718 private
			/*bot.channels.get(`614819522310045718`).overwritePermissions(
                bot.channels.get(`614819522310045718`).guild.defaultRole,
                { VIEW_CHANNEL: false }
            );*/
			destroyCurr()
			bot.channels.get(`614819522310045718`).setName(`closed  shop`)
		}

		/**
         * If the stocker is too fukken lazy to specify the shop type
         * we will stock the shop for the upcoming event from the list below (approximately)
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

		/**
		 * Helper method for stock()
		 * Formats stocked items
		 */
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

		/**
		 * Start method
		 */
		const run = () => {
			const helpmsg = `To stock, open, or close the shop, type >ltdshop stock/open/close respectively`
			if (!args) return reply(helpmsg)
			initShopData()
			if (args[0] == `stock`) {
				bot.channels.get(`614819522310045718`).bulkDelete(5)
				createCurr()
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
	usage: `${env.prefix}ltdshop <open>/<close>`,
	group: `Shop-related`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}