const {
	Canvas
} = require("canvas-constructor");
const {
	resolve,
	join
} = require("path");
const {
	Attachment
} = require("discord.js");
const Discord = require("discord.js");
const databaseManager = require('../../utils/databaseManager.js');
const formatManager = require('../../utils/formatManager');
const profileManager = require('../../utils/profileManager');
const cards_metadata = require('../../utils/cards-metadata.json');
const userRecently = new Set();


const sql = require('sqlite');
sql.open('.data/database.sqlite');

Canvas.registerFont(resolve(join(__dirname, "../../fonts/roboto-medium.ttf")), "RobotoMedium");
Canvas.registerFont(resolve(join(__dirname, "../../fonts/roboto-bold.ttf")), "RobotoBold");
Canvas.registerFont(resolve(join(__dirname, "../../fonts/roboto-thin.ttf")), "RobotoThin");
Canvas.registerFont(resolve(join(__dirname, "../../fonts/Whitney.otf")), "Whitney");

class gacha {
	constructor(Stacks) {
		this.author = Stacks.meta.author;
		this.data = Stacks.meta.data;
		this.utils = Stacks.utils;
		this.message = Stacks.message;
		this.args = Stacks.args;
		this.palette = Stacks.palette;
		this.stacks = Stacks;
	}

	async execute() {
		let message = this.message;
		let bot = this.stacks.bot;
		let palette = this.stacks.palette;
		const format = new formatManager(message);
		const worldchnl = bot.channels.get(`459891664182312982`);

		/**
			2D Card visuals built from canvas-constructor.
			Planned to merge these functions for readability & maintainability
			@drawImg
		*/
		async function drawSingleImg(member, container) {
			const collection = new databaseManager(member.id);
			const configProfile = new profileManager();


			/**
			 * id = userid, cur = currentexp, max = maxexp,
			 * crv = expcurve, lvl = userlevel, ac = userartcoins,
			 * rep = userreputation, des = userdescription, ui = userinterfacemode
			 * clr = hex code of user's rank color.
			 */
			const userdata = await collection.userdata;
			const keys = collection.storingKey(userdata);
			const user = {
				id: userdata[keys[0]],
				cur: userdata[keys[1]],
				max: userdata[keys[2]],
				crv: userdata[keys[3]],
				lvl: userdata[keys[4]],
				ac: userdata[keys[5]],
				rep: userdata[keys[6]],
				des: userdata[keys[7]],
				ui: userdata[keys[8]],
				prt: userdata[keys[9]],
				rtg: userdata[keys[10]],
				rvw: userdata[keys[11]],
				cov: userdata[keys[12]],
				log: userdata[keys[13]],
			}

			let canvas_x = 210;
			let canvas_y = 260;
			let startPos_x = 15;
			let startPos_y = 15;
			let baseWidth = canvas_x - 40;
			let baseHeight = canvas_y - 50;

			let canv = new Canvas(canvas_x, canvas_y) // x y

			canv = canv.setColor(user.clr)

			async function visualQuantity(x, y, dx, dy, dm) {
				if (container.item[0].indexOf(`Fragments`) > -1) {
					return ([2, 5].includes(parseInt(container.item[0], 10))) ? canv.addImage(await configProfile.getAsset(`fragments1`), x, y, dx, dy, dm) :
						([10, 15, 20].includes(parseInt(container.item[0], 10))) ? canv.addImage(await configProfile.getAsset(`fragments2`), x, y, dx, dy, dm) :
							canv.addImage(await configProfile.getAsset(`fragments3`), x, y, dx, dy, dm)
				} else if (container.item[0].indexOf(`Artcoins`) > -1) {
					return canv.addImage(await configProfile.getAsset(`artcoins`), x + 5, y, dx - 15, dy - 15, dm - 15)
				} else if (container.item[0].indexOf(`Power Capsule`) > -1) {
					return ([5].includes(parseInt(container.item[0], 10))) ? canv.addImage(await configProfile.getAsset(`powercapsule3`), x, y, dx, dy, dm) :
						([2].includes(parseInt(container.item[0], 10))) ? canv.addImage(await configProfile.getAsset(`powercapsule2`), x, y, dx, dy, dm) :
							canv.addImage(await configProfile.getAsset(`powercapsule1`), x, y, dx, dy, dm)
				} else if (container.item[0].indexOf(`Magical Paper`) > -1) {
					return canv.addImage(await configProfile.getAsset(`magicalpaper1`), x + 5, y, dx - 15, dy - 15, dm - 15)
				} else if (container.item[0].indexOf(`Shard`) > -1) {
					return canv.addImage(await configProfile.getAsset(container.alias[0]), x, y, dx, dy, dm)
				} else return canv.addImage(await configProfile.getAsset(container.alias[0]), x, y, dx, dy, dm)
			}

			async function textDescription(x, y) {
				canv.setColor(palette.white)
					.setTextAlign(`center`)
					.setTextFont(`9pt Whitney`) // itemname
					.addText(container.item, x, y)

					.setTextFont(`9pt Whitney`) // itemrarity
					.addText(`☆`.repeat(container.rarity[0]), x, y + 15)
			}


			if (container.type[0] === `card`) {
				canv.save()
					.setShadowColor("rgba(28, 28, 28, 1)")
					.setShadowOffsetY(8)
					.setShadowBlur(6)
					.setColor(palette.darkmatte)
					.addRect(startPos_x + 14, startPos_y + 3, baseWidth - 20, baseHeight - 16) // (x, y, x2, y2)

					.restore()
					.setShadowBlur(0)
					.setShadowOffsetY(0)
					.addImage(await configProfile.getAsset(container.alias[0]), startPos_x + 4, startPos_y + 3, baseWidth - 6, baseHeight, Math.floor(baseHeight / 2))


				return canv.toBuffer();
			} else {
				canv.setShadowColor("rgba(28, 28, 28, 1)")
					.setShadowOffsetY(8)
					.setShadowBlur(6)
					.setColor(palette.darkmatte)
					.addRect(startPos_x + 4, startPos_y + 3, baseWidth - 6, baseHeight - 12) // (x, y, x2, y2)
					.createBeveledClip(startPos_x, startPos_y, baseWidth, baseHeight, 4)
					.setColor(palette.nightmode)
					.addRect(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
					.setShadowBlur(0)
					.setShadowOffsetY(0)

				await visualQuantity(55, 50, 100, 100, 50);
				await textDescription(100, 170);
				//await rarityCircle(baseWidth, startPos_y+20)
				await utils.pause(1500);
				return canv.toBuffer()
			}
		}

		async function drawMultipleImg(member, container) {
			const collection = new databaseManager(member.id);
			const configProfile = new profileManager();


			/**
			 * id = userid, cur = currentexp, max = maxexp,
			 * crv = expcurve, lvl = userlevel, ac = userartcoins,
			 * rep = userreputation, des = userdescription, ui = userinterfacemode
			 * clr = hex code of user's rank color.
			 */
			const userdata = await collection.userdata;
			const keys = collection.storingKey(userdata);
			const user = {
				id: userdata[keys[0]],
				cur: userdata[keys[1]],
				max: userdata[keys[2]],
				crv: userdata[keys[3]],
				lvl: userdata[keys[4]],
				ac: userdata[keys[5]],
				rep: userdata[keys[6]],
				des: userdata[keys[7]],
				ui: userdata[keys[8]],
				prt: userdata[keys[9]],
				rtg: userdata[keys[10]],
				rvw: userdata[keys[11]],
				cov: userdata[keys[12]],
				log: userdata[keys[13]],
			}

			let canvas_x = 940;
			let canvas_y = 500;
			let startPos_x = 15;
			let startPos_y = 15;

			let canv = new Canvas(canvas_x, canvas_y) // x y

			canv = canv.setColor(user.clr)
				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

				.save() // checkpoint

			async function row(opt) {
				let card_dx = 170;
				let card_dy = 210;
				let card2card_distancex = (times) => startPos_x + ((card_dx * times) + (10 * times));
				let set_y = opt === `top` ? startPos_y : startPos_y + ((card_dy * 1) + (10 * 1));

				async function visualQuantity(x, y, dx, dy, dm, index) {
					let icon2icon_distancex = index < 1 || index === 5 ? x : index > 4 ? card2card_distancex(index - 5) + (index - 5 < 1 ? x : 40) : card2card_distancex(index) + 40;
					let icon2icon_set_y = opt === `top` ? y : set_y + 35;

					if (container.item[index].indexOf(`Fragments`) > -1) {
						return ([2, 5].includes(parseInt(container.item[index], 10))) ? canv.addImage(await configProfile.getAsset(`fragments1`), icon2icon_distancex, icon2icon_set_y, dx, dy, dm) :
							([10, 15, 20].includes(parseInt(container.item[index], 10))) ? canv.addImage(await configProfile.getAsset(`fragments2`), icon2icon_distancex, icon2icon_set_y, dx, dy, dm) :
								canv.addImage(await configProfile.getAsset(`fragments3`), icon2icon_distancex, icon2icon_set_y, dx, dy, dm)
					} else if (container.item[index].indexOf(`Artcoins`) > -1) {
						return canv.addImage(await configProfile.getAsset(`artcoins`), icon2icon_distancex + 5, icon2icon_set_y, dx - 15, dy - 15, dm - 30)
					} else if (container.item[index].indexOf(`Power Capsule`) > -1) {
						return ([5].includes(parseInt(container.item[index], 10))) ? canv.addImage(await configProfile.getAsset(`powercapsule3`), icon2icon_distancex - 10, icon2icon_set_y, dx + 10, dy + 10, dm + 10) :
							([2].includes(parseInt(container.item[index], 10))) ? canv.addImage(await configProfile.getAsset(`powercapsule2`), icon2icon_distancex - 10, icon2icon_set_y, dx + 10, dy + 10, dm + 10) :
								canv.addImage(await configProfile.getAsset(`powercapsule1`), icon2icon_distancex, icon2icon_set_y, dx, dy, dm)
					} else if (container.item[index].indexOf(`Magical Paper`) > -1) {
						return canv.addImage(await configProfile.getAsset(`magicalpaper1`), icon2icon_distancex, icon2icon_set_y, dx, dy, dm)
					} else return canv.addImage(await configProfile.getAsset(container.alias[index]), icon2icon_distancex, icon2icon_set_y, dx, dy, dm)
				}

				async function textDescription(x, y, index) {

					let text2text_distancex = index < 1 || index === 5 ? x : index > 4 ? card2card_distancex(index - 5) + (index - 5 < 1 ? x : 85) : card2card_distancex(index) + 85;
					let text2text_set_y = opt === `top` ? y : set_y + 155;

					canv.setColor(palette.white)
						.setTextAlign(`center`)
						.setTextFont(`11pt Whitney`) // itemname
						.addText(container.item[index], text2text_distancex, text2text_set_y)
						.addText(`☆`.repeat(container.rarity[index]), text2text_distancex, text2text_set_y + 20)
				}



				const indexrow = {
					"top": [0, 1, 2, 3, 4],
					"bottom": [5, 6, 7, 8, 9],
				};

				for (let i = 0; i < 5; i++) {
					indexrow[opt][i] > 0 ? canv.restore() : null;
					i > 0 ? canv.setColor(palette.darkmatte) : null;

					if (container.type[indexrow[opt][i]] === `card`) {

						canv.setShadowColor("rgba(28, 28, 28, 1)")
							.setShadowOffsetY(8)
							.setShadowBlur(6)
							.setColor(palette.darkmatte)
							.addRect(i < 1 ? startPos_x + 4 : card2card_distancex(i) + 10, set_y + 3, card_dx - 20, card_dy - 20) // (x, y, x2, y2)
							.setShadowBlur(0)
							.setShadowOffsetY(0)
							.addImage(await configProfile.getAsset(container.alias[indexrow[opt][i]]), i < 1 ? startPos_x + 4 : card2card_distancex(i) + 2, set_y + 3, card_dx - 6, card_dy, Math.floor(card_dy / 2))

					} else {
						canv.setShadowColor("rgba(28, 28, 28, 1)")
							.setShadowOffsetY(8)
							.setShadowBlur(6)
							.addRect(i < 1 ? startPos_x + 4 : card2card_distancex(i) + 4, set_y + 3, card_dx - 6, card_dy - 12) // (x, y, x2, y2)
							.createBeveledClip(i < 1 ? startPos_x : card2card_distancex(i), set_y, card_dx, card_dy, 4)
							.setColor(palette.nightmode)
							.addRect(i < 1 ? startPos_x : card2card_distancex(i), set_y, card_dx, card_dy) // (x, y, x2, y2)
							.setShadowOffsetY(0)
							.setShadowBlur(0)
						await visualQuantity(55, 50, 100, 100, 50, indexrow[opt][i]);
						await textDescription(100, 170, indexrow[opt][i]);
						//await rarityCircle(170, startPos_y+20, opt === `top` ? 0 : 5)
					}
				}
			}

			await row('top');
			await row('bottom');

			await utils.pause(1500);
			return canv.toBuffer();
		}



		/**
			Randomize items from lucky tickets pool with arbitrary percentage.
			@roll
		*/
		async function roll(times) {

			const closestUpper = (array, val) => {
				return Math.min.apply(null, array.filter(function (v) {
					return v > val
				}))
			}


			/**
		rate limit for each possible drop.			
		*/
			let rates = [];
			const get_caprates = () => {
				sql.all(`SELECT DISTINCT drop_rate FROM luckyticket_rewards_pool WHERE availability = 1`)
					.then(async data => {
						for (let i in data) {
							rates.push(data[i].drop_rate);
						}
					})
			};


			const get_loots = (probs) => {
				let fixedrate = closestUpper(rates, probs);
				return sql.get(`SELECT * FROM luckyticket_rewards_pool WHERE drop_rate = ${fixedrate} AND availability = 1 ORDER BY RANDOM() LIMIT 1`)
					.then(async data => data);
			}

			async function classify(limit) {

				let res_items = [],
					res_rates = [],
					res_rarities = [],
					res_types = [],
					res_aliases = [];
				rates.sort((a, b) => {
					return a - b
				});

				for (let i = 0; i < limit; i++) {
					let rate = Math.random() * 100;
					let parsed = await get_loots(rate);

					res_items.push(parsed.item_name)
					res_rates.push(parsed.drop_rate)
					res_rarities.push(parsed.rarity)
					res_types.push(parsed.type);
					res_aliases.push(parsed.item_alias)


					await utils.pause(100);

					if (parsed.rarity > 4) worldchnl.send(`${message.author} has pulled **(${`☆`.repeat(parsed.rarity)})${parsed.item_name}** from the lucky ticket! :tada:`)
					console.log(`${message.author.tag} pulled ${res_items[i]}[${res_rarities[i]}] on float : ${rate}`)
				}
				return {
					item: res_items,
					rate: res_rates,
					rarity: res_rarities,
					type: res_types,
					alias: res_aliases
				}
			}

			get_caprates();
			await utils.pause(500);
			return classify(times)
		}



		/**
			Returns a boolean.
			@roll_attempts
		*/
		function roll_attempts() {
			return sql.get(`SELECT lucky_ticket FROM userinventories WHERE userId = ${message.author.id}`)
				.then(async data => data.lucky_ticket === null || data.lucky_ticket < 1 ? false : true);
		}


		/**
			Returns an integer.
			@roll_type
		*/
		function roll_type() {
			return command.startsWith(`multi-roll`) ? 10 : 1;
		}


		/**
			Getting total of user's lucky tickets.
			@user_tickets
		*/
		function user_tickets() {
			return sql.get(`SELECT lucky_ticket FROM userinventories WHERE userId = ${message.author.id}`)
				.then(async data => data.lucky_ticket === null || data.lucky_ticket < 1 ? 0 : data.lucky_ticket);
		}


		// Request user's collection data.
		function cards_collection() {
			return sql.get(`SELECT * FROM collections WHERE userId = ${message.author.id}`)
				.then(async data => data);
		}


		// Returns true if user has rany_card.
		async function has_rany() {
			const data = await cards_collection();
			const ranny_card = data.rany_card;
			return ranny_card ? true : false;
		}


		//	Count total user's collected cards.
		async function total_collected_cards() {
			const data = await cards_collection();
			for (let key in data) {
				if (!data[key]) delete data[key];
			}
			return Object.keys(data).length;
		}


		/**
			Parsing gathered items from roll() object.
			@backend
		*/
		async function backend(container) {

			/**
				Filtering raw items from given container 
				until its ready to be stored inside @user database.
				@classify
			*/
			const classify = () => {
				/**
				Removing numbers from item alias to be used as item categorizing.
				@non_number_aliases
			*/
				let non_number_aliases = container.alias.map(el => el.replace(/[0-9]/g, ""))


				/**
				Summing up all the extracted numbers from same item category.
				@values_counting
			*/
				const values_counting = (codeitem) => {
					return container.alias
						.filter(pcs => pcs.indexOf(codeitem) > -1)
						.map(pcs => parseInt(pcs, 10))
						.reduce((total, pcs) => total + pcs);
				}


				/**
				Pushing elements from non_number_aliases and removing underscore
				from element that only has single word.
				@tagging
			*/
				const tagging = () => {
					let res = [];
					for (let i in non_number_aliases) {
						if (non_number_aliases[i].charAt(0) === "_") {
							res.push(non_number_aliases[i].replace("_", ""));
						} else {
							res.push(non_number_aliases[i]);
						}
					}
					return res;
				}


				/**
				Removing duplicates.
				@categorizing
			*/
				const categorizing = () => {
					let tagged = tagging();
					let res = tagged.filter((value, index) => tagged.indexOf(value) === index);
					return res;
				}


				/**
				Merging all the numbers to their corresponding category
				and finishing up the object.
				@merging
			*/
				const merging = () => {
					let category = categorizing()
					let objres = {};
					for (let i in category) {
						let values = values_counting(category[i])
						objres[category[i]] = values;
					}
					return objres;
				}



				return merging();
			}


			/**
				Subtracting tickets by result of roll_type().
				@substract_ticket
			*/
			const substract_ticket = (amount) => {
				sql.run(`UPDATE userinventories SET lucky_ticket = lucky_ticket - ${amount} WHERE userId = ${message.author.id}`)
			}

			/**
				Send parsed object made from classify's functions
				to user's database.
				@storing_items
			*/
			const storing_items = async () => {
				const parsed_container = classify();
				const total_cards = await total_collected_cards();
				const has_ranny = await has_rany();


				//	Rany's custom skill function.
				const rany_collector_fortune = (fragment) => {
					return fragment * (total_cards + 1);
				}


				//Check for card duplicates
				const duplicate_card = async (cardname) => {
					const card_data = await cards_collection();
					return card_data[cardname] > 0 ? true : false;
				}


				//	Run database queries.
				const storing = async (obj) => {
					for (let keyv in obj) {
						const tablediff = keyv.indexOf(`card`) > -1 ? `collections` : `userinventories`;
						sql.run(`UPDATE ${tablediff} 
						SET ${keyv} = CASE WHEN ${keyv} IS NULL 
										THEN ${parseInt(obj[keyv])} 
									ELSE ${keyv} + ${parseInt(obj[keyv])} 
									END 
						WHERE userId = ${message.author.id}`);

						await utils.pause(500);
						console.log(`${keyv}-${obj[keyv]} has been registered.`)
					}
				}


				//	Filtering container.
				const preprocessing = async () => {
					for (let key in parsed_container) {

						//	Returns multiplied fragments if user has rany_card.
						if (has_ranny && (key === `fragments`)) {
							const new_value = rany_collector_fortune(parsed_container[key]);
							parsed_container[key] = new_value;
							format.embedWrapper(palette.darkmatte, `*Rany's Collector Fortune Effect.*`)
						}

						//Check for card duplicates
						if (key.indexOf(`card`) > -1) {
							if (await duplicate_card(key)) {
								const convert_to_shard = key.replace(`card`, `shards`);

								//	Each card will be dismantled into 5 shards & 10k fragments.
								storing({
									[convert_to_shard]: 5 * parsed_container[key],
									fragments: 10000 * parsed_container[key],
								});

								format.embedWrapper(palette.darkmatte, `You owned duplicate of **${cards_metadata[key].fullname} card**.
				 		The new one will be dismantled into ${utils.emoji(convert_to_shard, bot)}**${5 * parsed_container[key]} ${convert_to_shard} & ${utils.emoji(`fragments`, bot)}${10000 * parsed_container[key]} Fragments.**`)
								delete parsed_container[key];
								continue;
							}
						}
					}
				}


				await preprocessing();
				storing(parsed_container);
			}

			storing_items();
			substract_ticket(roll_type())
		}



		/**
			Buffer & outputing canvas result to message event.
			@sending_rendered_image
		*/
		async function render_img(integertype) {

			const dynamic_opening_texts = () => {
				const group = [`${message.author.username} is opening their precious card`, `${message.author.username} seems really curious`,
				`${message.author.username}, may the RNG bless you`,
				`${message.author.username}, close your eyes`, `${message.author.username}, do you know what's lying behind this card?`, "i feel strange feelings", "wooowieeee",
					"flip flip flap!"
				];
				return group[Math.floor(Math.random() * group.length)];
			}


			message.delete();
			return message.channel.send(`<a:2eyebrows:548982071755014154> *${dynamic_opening_texts()}* ..`)
				.then(async opening => {
					userRecently.add(message.author.id);

					let container = await roll(integertype);
					const functype = integertype < 10 ? await drawSingleImg(message.author, container) : await drawMultipleImg(message.author, container);
					const embed = new Discord.RichEmbed()
						.setColor(palette.darkmatte)
						.setAuthor(`${message.author.username} used ${integertype} Lucky Tickets!`, message.author.displayAvatarURL)
						.attachFiles([new Attachment(functype, `pull.png`)])
						.setImage(`attachment://pull.png`);

					backend(container);
					message.channel.send(embed)
					opening.delete();

					setTimeout(() => {
						userRecently.delete(message.author.id);
					}, 2000)
				})
		}


		/**
			Core event.
			Handles all possible faults before begin the transaction.
			@processing
		*/
		async function processing() {
			const check_attempts = await roll_attempts();
			const user_curtickets = await user_tickets();


			/**
				Locked feature. Only accessible to creators council.
			*/
			//if(!message.member.roles.find(r => r.name === 'Creators Council'))return format.embedWrapper(palette.darkmatte, `This feature isn't available yet.`);

			if (![`gacha-house`, `sandbox`].includes(message.channel.name)) return format.embedWrapper(palette.red, `Please do your roll in ${bot.channels.get(`578518964439744512`).toString()}`);

			/**
				You can only roll with Lucky Ticket.
			*/
			if (!check_attempts) return format.embedWrapper(palette.red, `You don't have enough **Lucky Ticket**. Go buy one!!`)


			/**
				2 seconds cooldown for each roll.
			*/
			if (userRecently.has(message.author.id)) return format.embedWrapper(palette.crimson, `Your next roll still in cooldown.`);


			/**
				Multi roll only allowed when user has more than 10 lucky tickets.
			*/
			if (user_curtickets < roll_type()) return format.embedWrapper(palette.crimson, `You can't do multi roll with **less than 10 Lucky Tickets.**`)




			return render_img(roll_type());
		}

		processing();

	}
}

module.exports.help = {
	start: gacha,
	name: "gacharoll",
	aliases: ["multi-roll","roll"],
	description: `rolls a gacha ticket`,
	usage: `>roll`,
	group: "General",
	public: true,
	require_usermetadata: true,
	multi_user: true
}