const database = require(`../utils/databaseManager`);
const cardMetadata = require(`../utils/cards-metadata`);
const { RichEmbed, MessageCollector } = require(`discord.js`);


module.exports.run = async (bot, command, message, args, utils) => {

	/**
	 * Crafting flow wrapper
	 * @Craft
	 */
	class Craft {
		constructor(components) {
			this.components = components;
		}

		//  Check if materials are sufficient. Returns boolean
		sufficientMaterials(data) {
			const usermeta = this.components.usermeta;
			for (let item in data) {
				if (usermeta[item] < data[item]) return false;
			}
			return true;
		}

		// custom pages for crafting interface
		async loadInterface() {

			const { emoji, palette, commanifier } = this.components.pistachio;

			//  Get required metadata from cardMetadata and returns as an object of array.
			const extractingMetadata = () => {
				let res = {
					name: [],
					img: [],
					materials: [],
					description: [],
					aliases: []
				};
				for (let key in cardMetadata) {
					const data = cardMetadata[key];

					res.name.push(data.fullname);
					res.img.push(data.url)
					res.materials.push(data.req_materials)
					res.description.push(data.description)
					res.aliases.push(data.alias)
				}
				return res;
			}


			//  Listing req materials with highlight(if requirement has met)
			const materialList = (obj) => {
				let res = ``;
				const items = Object.keys(obj)
				const values = Object.values(obj);
				for (let i = 0; i < items.length; i++) {
					let rowtext = `(${commanifier(usermeta[items[i]])} / ${commanifier(values[i])})\n`;
					res += usermeta[items[i]] < values[i] ? `- ${emoji(items[i])} ${rowtext}` :
						`- ${emoji(items[i])} [${rowtext}](https://discord.gg/Tjsck8F)`;
				}
				return res;
			}


			//  Storing each pages of embeds
			const registeringEmbeds = () => {
				const data = extractingMetadata();

				let res = [];
				for (let i = 0; i < data.name.length; i++) {

					const craftable = this.sufficientMaterials(data.materials[i])
					const label = usermeta[data.aliases[i]] ? `[Owned]` : craftable ? `[Craftable]` : ``;

					let embed = new RichEmbed()
						.setColor(craftable ? palette.lightgreen : palette.darkmatte)
						.setImage(data.img[i])
						.setDescription(`**${label}${data.name[i]} (★★★★★)**\n"${data.description[i]}"\n\nRequired materials :\n${materialList(data.materials[i])}`)

					//  Store card metadata
					embed.card_metadata = cardMetadata[data.aliases[i]];
					res[i] = embed;
				}
				return res;
			}

			const embedArray = await registeringEmbeds();
			let page = 0;

			message.channel.send(`\`Preparing craft interface . .\``)
				.then(async loading => {
					message.channel.send(embedArray[0])
						.then(async msg => {

							loading.delete();

							await msg.react('⏪')
							await msg.react('⏩')
							await msg.react(`🔨`)

							// Filters - These make sure the varibles are correct before running a part of code
							const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id;
							const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id; // We need two filters, one for forwards and one for backwards
							const selectItemFilter = (reaction, user) => reaction.emoji.name === '🔨' && user.id === message.author.id;


							const backwards = msg.createReactionCollector(backwardsFilter, {
								time: 120000
							});
							const forwards = msg.createReactionCollector(forwardsFilter, {
								time: 120000
							});
							const select = msg.createReactionCollector(selectItemFilter, {
								time: 120000
							});

							//	Left navigation
							backwards.on('collect', r => {
								r.remove(message.author.id);
								page--
								if (embedArray[page]) {
									msg.edit(embedArray[page])
								} else {
									page++
								}
							})

							//	Right navigation
							forwards.on('collect', r => {
								r.remove(message.author.id);
								page++
								if (embedArray[page]) {
									msg.edit(embedArray[page])
								} else {
									page--
								}
							})

							//  Crafting phase
							select.on(`collect`, r => {

								//  End collectors
								backwards.stop();
								forwards.stop();
								select.stop();
								msg.delete();

								this.user = usermeta;
								this.card = embedArray[page].card_metadata;
								return this.confirmation()
							})

							setTimeout(() => {
								msg.clearReactions();
							}, 120000)
						});
				})
		}

		//  Transaction flow
		async confirmation() {
			const { reply, code, palette, emoji } = this.components.pistachio;
			const { message } = this.components;

			//  Ask for confirmation before proceeding
			reply(code.CRAFT.CONFIRMATION, {
				socket: [emoji(this.card.alias), this.card.fullname],
				color: palette.golden
			}).then(async prompt => {

				const collector = new MessageCollector(message.channel,
					m => m.author.id === message.author.id, {
						max: 1,
						time: 30000,
					});
	
				collector.on(`collect`, async msg => {
					let input = msg.content.toLowerCase();
					msg.delete();
	
					//  Returns if transaction is unconfirmed
					if (!input.startsWith(`y`)) return reply(code.TRANSACTION.CANCELLED)
	
					//  Returns if user level is below the requirement
					if (this.user.level < 5) return reply(code.CRAFT.LVL_TOO_LOW);
	
					//  Returns if user already owned the card.
					if (this.user[this.card.alias]) return reply(code.CRAFT.DUPLICATES);
	
					//  Returns if user's materials aren't sufficent
					if (!this.sufficientMaterials(this.card.req_materials)) return reply(code.CRAFT.INSUFFICIENT_MATERIALS, {color: palette.red});
	
					//	Finishing
					await new database(message.author.id)
						.consumeMaterials(this.card.req_materials)
						.registerCard(this.card.alias)
					
					prompt.delete();
					return reply(code.CRAFT.SUCCESSFUL, {
						socket: [message.author.username, emoji(this.card.alias), this.card.fullname],
						color: palette.lightgreen
					})
				})
			})
		}

		//  Initialize
		async execute() {
			return this.loadInterface();
		}

	}


	//	This is an example how annie's classes structure would look like.
	//	Variables in below are just my sandbox.

	const usermeta = await new database(message.author.id).userMetadata;
	const pistachio = require(`../utils/Pistachio`)(bot, message)
	const components = { bot, message, args, utils, usermeta, pistachio }
	new Craft(components).execute();

}

module.exports.help = {
	name: "craftingInterface",
	aliases: [`craft`, `crafts`],
	description: `Opening crafting interface`,
	usage: `>craft`,
	group: "General",
	public: true,
}