

module.exports = (bot, message) => {

	const module = {}
	const format = require(`./formatManager`)
	const palette = require(`./colorset.json.js`)
	const { RichEmbed } = require(`discord.js`)
	const m = new format(message)

	/**
     * creates any amount of pages in a embed, when objects are given
     * NOT SURE IF THIS IS USED
     * naph lmk.
     * Yes its used, but this one is outdated and missing some codes.
     * The real one that we gonna use is currently in master branch.
     * @param message message object
     * @param pages array set
     * @returns A correctly formatted Embed
     */
	module.craftingpages = async (message, pages) => {

		const {
			RichEmbed
		} = require(`discord.js`)
		const {
			darkmatte
		} = require(`./colorset`)

		console.log(typeof (pages))
		const registeringEmbeds = () => {
			const keys = Object.keys(pages)
			const url = Object.values(pages)

			let res = []
			for (let i = 0; i < keys.length; i++) {
				let embed = new RichEmbed()
					.setColor(darkmatte)
					.setTitle(keys[i])
					.setImage(url[i])
				res[i] = embed
			}
			return res
		}

		const embedArray = await registeringEmbeds()
		let page = 1 // We will define what page we are on here, the default page will be 1. (You can change the default page)


		message.channel.send(embedArray[0]).then(msg => { // Now, we will send the embed and pass the new msg object
			msg.react(`⏪`).then(async () => { // We need to make sure we start the first two reactions, this is the first one
				msg.react(`⏩`) // This is the second one, it will run this one after the first one

				// Filters - These make sure the varibles are correct before running a part of code
				const backwardsFilter = (reaction, user) => reaction.emoji.name === `⏪` && user.id === message.author.id
				const forwardsFilter = (reaction, user) => reaction.emoji.name === `⏩` && user.id === message.author.id // We need two filters, one for forwards and one for backwards

				const backwards = msg.createReactionCollector(backwardsFilter, {}) // This creates the collector, which has the filter passed through it. The time is in milliseconds so you can change that for however you want the user to be able to react
				const forwards = msg.createReactionCollector(forwardsFilter, {}) // This is the second collector, collecting for the forwardsFilter

				// Next, we need to handle the collections
				backwards.on(`collect`, r => { // This runs when the backwards reaction is found
					r.remove(message.author.id)
					page--
					if (embedArray[page]) {
						msg.edit(embedArray[page])
					} // We want to make sure if they are on the first page, they can't go back a page // CHANGED so it goes to last page
					else {
						page++
					}
				})

				forwards.on(`collect`, r => { // This runs when the forwards reaction is found
					r.remove(message.author.id)
					page++
					if (embedArray[page]) {
						msg.edit(embedArray[page])
					} else {
						page--
					}
				})
			})
		})
	}// End of craftingpages

	/**
    * creates any amount of pages in a embed, when a(n) array, array of arrays, or a large string is given as the input.
    * @param message message object
    * @param pages array set, or large string
    * @param customembed the vairable used for the RichEmbed
    * @returns A correctly formatted Embed
    */
	module.pages = (message = {}, pages = ``, customembed = null) => {

		// if customembed is not defined, it will initialize new RichEmbed.
		let evembed = customembed || new RichEmbed().setColor(palette.darkmatte)

		let footerText
		let footerBoolean = undefined
		if (evembed.footer !== undefined) {footerText = evembed.footer.text;footerBoolean=null}
		let page = 1 // We will define what page we are on here, the default page will be 1. (You can change the default page)
		let sub_pages = 1 // We will define what sub page we are on here, the default sub page will be 1. (You can change the default sub pagem, Although it is recommended to leave it at 1)
		let evalMode = false

		const clean = (text = ``) => {
			if (typeof (text) === `string`)
				return text.replace(/`/g, `\`` + String.fromCharCode(8203)).replace(/@/g, `@` + String.fromCharCode(8203))
			else
				return text
		}

		function twoDimensialFowards() {
			if (sub_pages === pages[page - 1].length) {// We can use copy and paste since it is basically the same thing, although now it checks if the sub page is currently on the highest possible, so it can't go any higher. // CHANGED so it goe to first sub page
				sub_pages = 0
				if (page === pages.length) {
					page = 0 // We can use copy and paste since it is basically the same thing, although now it checks if the page is currently on the highest possible, so it can't go any higher. // CHANGED so it goe to first page
					page++ // If it can go forwards, push forwards the page number
				} else {
					page++ // If it can go forwards, push forwards the page number
				}
			}
			sub_pages++// If it can go forwards, push forwards the sub page number
			evembed.setDescription(pages[page - 1][sub_pages - 1]) // Just like setting the first one, reset the Description to the new page
			if (pages[page - 1].length > 1) {
				if (footerBoolean === undefined) {
					evembed.setFooter(`Page ${page}.${sub_pages} of ${pages.length} (${sub_pages}/${pages[page - 1].length})`) // This also sets the footer to view the current pagenumber
				} else {
					evembed.setFooter(`${footerText} | Page ${page}.${sub_pages} of ${pages.length} (${sub_pages}/${pages[page - 1].length})`) // This also sets the footer to view the current pagenumber

				}
			} else {
				if (footerBoolean === undefined) {
					evembed.setFooter(`Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber
				} else {
					evembed.setFooter(`${footerText} | Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber

				}
			}
		}

		function twoDimensialBackwards() {
			if (sub_pages === 1) { // We want to make sure if they are on the first sub page, they can't go back a sub page // CHANGED so it goes to last sub page
				if (page === 1) {
					page = pages.length + 1 // We want to make sure if they are on the first page, they can't go back a page // CHANGED so it goes to last page
					page-- // If it can go back, push back the page number
				} else {
					page-- // If it can go back, push back the page number
				}
				sub_pages = pages[page - 1].length + 1
			}
			sub_pages--// If it can go back, push back the sub page number
			evembed.setDescription(pages[page - 1][sub_pages - 1]) // Just like setting the first one, reset the Description to the new page
			if (pages[page - 1].length > 1) {
				if (footerBoolean === undefined) {
					evembed.setFooter(`Page ${page}.${sub_pages} of ${pages.length} (${sub_pages}/${pages[page - 1].length})`) // This also sets the footer to view the current pagenumber
				} else {
					evembed.setFooter(`${footerText} | Page ${page}.${sub_pages} of ${pages.length} (${sub_pages}/${pages[page - 1].length})`) // This also sets the footer to view the current pagenumber

				}
			} else {
				if (footerBoolean === undefined) {
					evembed.setFooter(`Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber
				} else {
					evembed.setFooter(`${footerText} | Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber

				}
			}
		}

		function oneDimensialFowards() {
			if (page === pages.length) page = 0 // We can use copy and paste since it is basically the same thing, although now it checks if the page is currently on the highest possible, so it can't go any higher. // CHANGED so it goe to first page
			page++ // If it can go forwards, push forwards the page number
			evembed.setDescription(pages[page - 1]) // Just like setting the first one, reset the Description to the new page
			if (footerBoolean === undefined) {
				evembed.setFooter(`Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber
			} else {
				evembed.setFooter(`${footerText} | Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber

			}
		}

		function oneDimensialBackwards() {
			if (page === 1) page = pages.length + 1 // We want to make sure if they are on the first page, they can't go back a page // CHANGED so it goes to last page
			page-- // If it can go back, push back the page number
			evembed.setDescription(pages[page - 1]) // Just like setting the first one, reset the Description to the new page
			if (footerBoolean === undefined) {
				evembed.setFooter(`Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber
			} else {
				evembed.setFooter(`${footerText} | Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber

			}
		}

		function evalFormatBackwards() {
			if (page === 1) page = pages.length + 1 // We want to make sure if they are on the first page, they can't go back a page // CHANGED so it goes to last page
			page-- // If it can go back, push back the page number
			evembed.setDescription(`**Output**\n\`\`\`autohotkey\n${clean(pages[page - 1])}\n\`\`\``) // Just like setting the first one, reset the Description to the new page
			if (footerBoolean === undefined) {
				evembed.setFooter(`Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber
			} else {
				evembed.setFooter(`${footerText} | Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber

			}
		}

		function evalFormatForwards() {
			if (page === pages.length) page = 0 // We can use copy and paste since it is basically the same thing, although now it checks if the page is currently on the highest possible, so it can't go any higher. // CHANGED so it goe to first page
			page++ // If it can go forwards, push forwards the page number
			evembed.setDescription(`**Output**\n\`\`\`autohotkey\n${clean(pages[page - 1])}\n\`\`\``) // Just like setting the first one, reset the Description to the new page
			if (footerBoolean === undefined) {
				evembed.setFooter(`Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber
			} else {
				evembed.setFooter(`${footerText} | Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber

			}
		}

		if (evembed === null) {
			evembed.setColor(0xffffff) // You can set your color here
		}

		if (footerBoolean === undefined) {
			if (typeof (pages) === `string`) {

				evalMode = true
				let devpages = []

				for (let index = 0; index < pages.length; index += 1) {
					devpages.push(pages.substr(0, 2000))
					pages = pages.slice(2000)
				}

				pages = devpages

				evembed.setFooter(`Page ${page} of ${pages.length}`) // This is the default value, showing the default page and the amount of pages in the array.
				evembed.setDescription(`**Output**\n\`\`\`autohotkey\n${clean(pages[page - 1])}\n\`\`\``) // This sets the description as the default page (we are subtracting 1 since arrays start at 0)

			} else if (pages[page - 1][sub_pages - 1].constructor === Array) { // Tests to see if the pages input is multidemensial
				if (pages[page - 1].length > 1) {
					evembed.setFooter(`Page ${page}.${sub_pages} of ${pages.length} (${sub_pages}/${pages[page - 1].length})`) // This also sets the footer to view the current pagenumber
				} else {
					evembed.setFooter(`Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber
				}
				evembed.setDescription(pages[page - 1][sub_pages - 1]) // This sets the description as the default page (we are subtracting 1 since arrays start at 0)
			} else {
				evembed.setFooter(`Page ${page} of ${pages.length}`)
				evembed.setDescription(pages[page - 1]) // This sets the description as the default page (we are subtracting 1 since arrays start at 0)
			}
		} else {
			if (typeof (pages) === `string`) {

				evalMode = true
				let devpages = []

				for (let index = 0; index < pages.length; index += 1) {
					devpages.push(pages.substr(0, 2000))
					pages = pages.slice(2000)
				}

				pages = devpages

				evembed.setFooter(`${footerText} | Page ${page} of ${pages.length}`) // This is the default value, showing the default page and the amount of pages in the array.
				evembed.setDescription(`**Output**\n\`\`\`autohotkey\n${clean(pages[page - 1])}\n\`\`\``) // This sets the description as the default page (we are subtracting 1 since arrays start at 0)

			} else if (pages[page - 1][sub_pages - 1].constructor === Array) { // Tests to see if the pages input is multidemensial
				if (pages[page - 1].length > 1) {
					evembed.setFooter(`${footerText} | Page ${page}.${sub_pages} of ${pages.length} (${sub_pages}/${pages[page - 1].length})`) // This also sets the footer to view the current pagenumber
				} else {
					evembed.setFooter(`${footerText} | Page ${page} of ${pages.length}`) // This also sets the footer to view the current pagenumber
				}
				evembed.setDescription(pages[page - 1][sub_pages - 1]) // This sets the description as the default page (we are subtracting 1 since arrays start at 0)
			} else {
				if (pages.length !== 1) evembed.setFooter(`${footerText} | Page ${page} of ${pages.length}`)
				evembed.setDescription(pages[page - 1]) // This sets the description as the default page (we are subtracting 1 since arrays start at 0)
			}
		}
		message.channel.send(evembed).then(async msg => { // Now, we will send the embed and pass the new msg object
			if (pages.length === 1) return
			msg.react(`⏪`).then(async () => { // We need to make sure we start the first two reactions, this is the first one

				msg.react(`⏩`) // This is the second one, it will run this one after the first one

				// Filters - These make sure the varibles are correct before running a part of code
				const backwardsFilter = (reaction, user) => reaction.emoji.name === `⏪` && user.id === message.author.id
				const forwardsFilter = (reaction, user) => reaction.emoji.name === `⏩` && user.id === message.author.id // We need two filters, one for forwards and one for backwards

				const backwards = msg.createReactionCollector(backwardsFilter, {}) // This creates the collector, which has the filter passed through it. The time is in milliseconds so you can change that for however you want the user to be able to react
				const forwards = msg.createReactionCollector(forwardsFilter, {}) // This is the second collector, collecting for the forwardsFilter

				// Next, we need to handle the collections
				backwards.on(`collect`, r => { // This runs when the backwards reaction is found
					r.remove(message.author.id)
					if (evalMode) {
						evalFormatBackwards()
					} else if (pages[page - 1][sub_pages - 1].constructor === Array) { // checks to see if the pages input is a two-dimensial array or not.
						twoDimensialBackwards()
					} else {
						oneDimensialBackwards()
					}
					msg.edit(evembed) // Then, we can push the edit to the message
				})

				forwards.on(`collect`, r => { // This runs when the forwards reaction is found
					r.remove(message.author.id)
					if (evalMode) {
						evalFormatForwards()
					} else if (pages[page - 1][sub_pages - 1].constructor === Array) { // checks to see if the pages input is a two-dimensial array or not.
						twoDimensialFowards()
					} else {
						oneDimensialFowards()
					}
					msg.edit(evembed) // Then, we can push the edit to the message
				})
			})
		})
	}// End of pagesDubArr

	/**
     * Splits array items into chunks of the specified size
     * @param {Array|String} items
     * @param {Number} chunkSize
     * @returns {Array}
     */
	module.chunk = (items, chunkSize) => {
		const result = []

		for (let i = 0; i < items.length; i += chunkSize) {
			result.push(items.slice(i, i + chunkSize))
		}

		return result
	}

	/**
     * Finds a user by id, or tag or plain name
     * @param {object} message message object
     * @param target the arg for the user (id, name, mention)
     * @returns {object} user object
     */
	module.userFinding = async (target) => {
		const userPattern = /^(?:<@!?)?([0-9]+)>?$/
		if (userPattern.test(target)) target = target.replace(userPattern, `$1`)
		let members = message.guild.members

		const filter = member => member.user.id === target ||
            member.displayName.toLowerCase() === target.toLowerCase() ||
            member.user.username.toLowerCase() === target.toLowerCase() ||
            member.user.tag.toLowerCase() === target.toLowerCase()

		return members.filter(filter).first()
	}, // End of userFinding

	module.rangeNumber = (min, max) => {
		return m.rangeNumber(min, max)
	}

	/** This will be the messagelog function
     *  @param socket is the optional key
     */
	module.systemMessage = (msg, socket = [], color = palette.darkmatte) => {
		for (let i = 0; i < socket.length; i++) {
			if (msg.indexOf(`{${i}}`) != -1) msg = msg.replace(`{${i}}`, socket[i])
		}
		return m.embedWrapper(color, msg)
	}


	module.sendEmbed = (msg = ``, color = palette.darkmatte) => {
		return m.embedWrapper(color, msg)
	}

	module.avatarURL = (id) => {
		return bot.users.get(id).avatarURL
	}


	module.nickname = (id) => {
		return message.guild.members.get(id).displayName
	}

	module.advSend = (...options) => {
		//console.log(options)
		return m.embedWrapperAdv(...options)
		//return m.embedWrapperAdv.apply(options);
	}

	module.commanized = (int = 0) => {
		return m.threeDigitsComa(int)
	}

	return module

}