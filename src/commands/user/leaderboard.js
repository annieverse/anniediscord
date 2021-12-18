const GUI = require(`../../ui/prebuild/leaderboard`)
const User = require(`../../libs/user`)
const commanifier = require(`../../utils/commanifier`)
/**
 * Displays your server leaderboard!
 * @author klerikdust
 */
module.exports = {
	name: `leaderboard`,
	aliases: [`rank`, `leaderboard`, `rank`, `ranking`, `lb`, `leaderboards`],
	description: `Displaying your server leaderboard!`,
	usage: `leaderboard`,
	permissionLevel: 0,
	/**
	 * First element of the child array determines the leaderboard category name.
	 * @type {array}
	 */
	keywords: [
		[`exp`, `exp`, `xp`, `lvl`, `level`],
		[`artcoins`, `artcoins`, `ac`, `artcoin`, `balance`, `bal`],
		[`fame`, `fames`, `rep`, `reputation`, `reputations`, `reps`],
		[`artists`, `hearts`, `arts`, `artist`, `art`, `artwork`],
		[`halloween`, `candies`, `hallowee`, `candies`, `cdy`, `spooky`, `spook`]
	],
	/**
	 * Aggregate available keywords in `this.keywords`.
	 * @return {object}
	 */
	wholeKeywords() {
		let arr = []
		for (let i = 0; i < this.keywords.length; i++) {
			arr.push(...this.keywords[i])
		}
		return arr
	},
	async execute(client, reply, message, arg, locale) {
		//  Returns a guide if no parameter was specified.
		if (!arg) return reply.send(locale.LEADERBOARD.GUIDE, {
			header: `Hi, ${message.author.username}!`,
			image: `banner_leaderboard`,
			socket: {
				prefix: client.prefix,
				emoji: await client.getEmoji(`692428597570306218`)
			}
		})
		//  Returns if parameter is invalid.
		if (!this.wholeKeywords().includes(arg.toLowerCase())) return reply.send(locale.LEADERBOARD.INVALID_CATEGORY, {
			socket: {
				emoji: await client.getEmoji(`692428969667985458`)
			}
		})
		//  Store key of selected group
		const selectedGroupParent = this.keywords.filter(v => v.includes(arg.toLowerCase()))[0]
		const selectedGroup = selectedGroupParent[0]
		const selectedGroupIdentifier = selectedGroupParent[1]
		return reply.send(locale.COMMAND.FETCHING, {
				socket: {
					command: `${selectedGroup} leaderboard`,
					emoji: await client.getEmoji(`790994076257353779`),
					user: message.author.id
				},
				simplified: true
			})
			.then(async load => {
				//  Fetch points data and eliminates zero values if present.
				let lbData = (await client.db.indexRanking(selectedGroup, message.guild.id)).filter(node => node.points > 0)
				let validUsers = []
				//  Fetching uncached users
				for (let i = 0; i < lbData.length; i++) {
					//  Make sure to limit the iterations once hit the limit
					if (validUsers.length >= 10) break
					const node = lbData[i]
					//  It will check on the members cache first, if not available, then fetch. 
					try {
						const target = await message.guild.members.fetch(node.id)
						if (target.id) validUsers.push(node)
					} catch (e) {
						e
					}
				}
				//  Handle if no returned leaderboard data
				if (!validUsers.length) {
					load.delete()
					return reply.send(locale.LEADERBOARD.NO_DATA, {
						color: `golden`,
						socket: {
							category: selectedGroup.charAt(0).toUpperCase() + selectedGroup.slice(1),
							emoji: await client.getEmoji(`751024231189315625`)
						}
					})
				}
				const userData = await (new User(client, message)).requestMetadata(message.author, 2)
				const img = await new GUI(userData, validUsers, client).build()
				load.delete()
				await reply.send(`:trophy: **| ${selectedGroup.charAt(0).toUpperCase() + selectedGroup.slice(1)} Leaders**\n${message.guild.name}'s Ranking`, {
					prebuffer: true,
					image: img.toBuffer(),
					simplified: true
				})
				const author = validUsers.filter(key => key.id === message.author.id)[0]
				const footer = author ? locale.LEADERBOARD.AUTHOR_RANK : locale.LEADERBOARD.UNRANKED
				reply.send(footer, {
					simplified: true,
					socket: {
						rank: validUsers.indexOf(author) + 1,
						points: author ? commanifier(author.points) : 0,
						emoji: selectedGroupIdentifier,
					}
				})
			})
	}
}