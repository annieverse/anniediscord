const {
	Canvas
} = require(`canvas-constructor`)
const {
	resolve,
	join
} = require(`path`)
const animeManager = require(`../../utils/fetchAnimeSite`)
const SqliteClient = require(`better-sqlite3`)
const sql = new SqliteClient(`.data/database.sqlite`)

Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-bold.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-black.ttf`)), `RobotoBlack`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-thin.ttf`)), `RobotoThin`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/Whitney.otf`)), `Whitney`)

//  Render the image
const render = async (stacks, metadata) => {
	const {
		db,
		palette,
		bot,
		emoji,
		commanifier,
		meta: {
			data,
			author
		},
		avatar
	} = stacks

	let textleaderboard = ``

	//  Canvas metadata
	const size = {
		x: 400,
		y: 700,
		x2: 10,
		y2: 15,
	}


	//  Pull required data.
	const dbmanager = db(author.id)
	metadata.user = data

	const ranking = {
		group: [],
		limit: 9,
		async pullingXp() {
			for (let i = 0; i < 10; i++) {
				this.group.push({
					id: await dbmanager.indexRanking(`userdata`, `currentexp`, i, `userId`),
					xp: await dbmanager.indexRanking(`userdata`, `currentexp`, i, `currentexp`),
					lv: (await dbmanager.xpFormula(await dbmanager.indexRanking(`userdata`, `currentexp`, i, `currentexp`))).level
				})
			}
		},
		async pullingAc() {
			for (let i = 0; i < 10; i++) {
				this.group.push({
					id: await dbmanager.indexRankingAC(`item_inventory`, `quantity`, i, `user_id`),
					ac: await dbmanager.indexRankingAC(`item_inventory`, `quantity`, i, `quantity`)
				})
			}
		},
		async pullingCandies() {
			for (let i = 0; i < 10; i++) {
				this.group.push({
					id: await dbmanager.indexRankingCandies(`item_inventory`, `quantity`, i, `user_id`),
					cdy: await dbmanager.indexRankingCandies(`item_inventory`, `quantity`, i, `quantity`)
				})
			}
		},
		async pullingRep() {
			for (let i = 0; i < 10; i++) {
				this.group.push({
					id: await dbmanager.indexRanking(`userdata`, `reputations`, i, `userId`),
					rep: await dbmanager.indexRanking(`userdata`, `reputations`, i, `reputations`)
				})
			}
		},
		async pullingArt() {
			for (let i = 0; i < 10; i++) {
				this.group.push({
					id: await dbmanager.indexRanking(`userdata`, `liked_counts`, i, `userId`),
					liked_count: await dbmanager.indexRanking(`userdata`, `liked_counts`, i, `liked_counts`)
				})
			}
		},
		async pullingAnime() {
			var array = []
			var users = await sql.all(`SELECT * FROM userdata WHERE anime_link <> ""`)
			var api = new animeManager()
			for (var i = 0; i < users.length; i++) {
				var num = await api.getNumOfAnime(users[i].anime_link)
				if (num != 0) {
					array.push({
						id: users[i].userId,
						anime: num
					})
				}
			}
			array.sort((a, b) => (a.anime > b.anime ? -1 : (b.anime > a.anime ? 1 : 0)))
			this.group = array
		},
		async user(selected_group) {
			var u = {
				limit: this.limit
			}
			if (selected_group == `xp`) {
				await this.pullingXp()
				u.group = this.group
				u.authorindex = await dbmanager.authorIndexRanking(`userdata`, `currentexp`)
				return u
			}
			if (selected_group == `ac`) {
				await this.pullingAc()
				u.group = this.group
				u.authorindex = await dbmanager.authorIndexRankingAC(`item_inventory`, `quantity`)
				return u
			}
			if (selected_group == `halloween`) {
				await this.pullingCandies()
				u.group = this.group
				u.authorindex = await dbmanager.authorIndexRankingCandies(`item_inventory`, `quantity`)
				return u
			}
			if (selected_group == `rep`) {
				await this.pullingRep()
				u.group = this.group
				u.authorindex = await dbmanager.authorIndexRanking(`userdata`, `reputations`)
				return u
			}
			if (selected_group == `arts`) {
				await this.pullingArt()
				u.group = this.group
				u.authorindex = await dbmanager.authorIndexRanking(`userdata`, `liked_counts`)
				return u
			}
			if (selected_group == `weeb`) {
				await this.pullingAnime()
				u.group = this.group
				u.authorindex = this.group.findIndex((data) => data.id == metadata.user.userId)
				return u
			}

		}
	}
	const user = await ranking.user(metadata.selected_group)

	let canv = new Canvas(size.x, size.y)

	//  Bundled functions for each row rendering task.
	class Row {
		constructor(index, distancey, group) {
			this.index = index
			this.y = distancey * (this.index + 1)
			this.group = group
		}


		//  Adapt the text to match with the background
		get text_check() {
			return this.highlight_user ? canv.setColor(palette.white) : canv.setColor(palette.golden)
		}


		//  Make sure the nickname length is not greater than 10 characters
		get nickname_formatter() {
			let name
			try {
				name = bot.users.cache.get(user.group[this.index].id).username
			} catch (err) {
				name = `User Left`
			}
			return name.length >= 10 ? `${name.substring(0, 9)}..` : name
		}


		//  Return nickname
		get nickname() {
			canv.setTextAlign(`left`)
			canv.setColor(palette.white)
			canv.setTextFont(`12pt RobotoBlack`)
				.printText(this.nickname_formatter, size.x2 + 160, this.y)
			return this
		}


		//  Returns reputation points
		get reputation() {
			const reps = commanifier(user.group[this.index].rep)
			this.text_check
			canv.setTextAlign(`right`)
			canv.setTextFont(`15pt RobotoBlack`)
				.printText(`${reps} ★`, size.x - 50, this.y)
			return this
		}


		//  Highlight if user is in the top ten list
		get highlight() {
			if (user.group[this.index].id === author.id) {
				this.highlight_user = true
				canv.setColor(palette.golden)
					.printRectangle(size.x2, this.y - 35, size.x - size.x2, 60)
					.restore()
			}
			canv.restore()
			return this
		}


		//  Returns user liked post
		get liked() {
			const reps = commanifier(user.group[this.index].liked_count)
			this.text_check
			canv.setTextAlign(`right`)
			canv.setTextFont(`15pt RobotoBlack`)
				.printText(`${reps} ❤`, size.x - 50, this.y)
			return this
		}

		//  Returns user watched anime
		get anime() {
			const reps = commanifier(user.group[this.index].anime)
			this.text_check
			canv.setTextAlign(`right`)
			canv.setTextFont(`15pt RobotoBlack`)
				.printText(`${reps}`, size.x - 50, this.y)
			return this
		}


		//  Returns user artcoins
		get artcoins() {
			this.text_check
			canv.setTextFont(`15pt RobotoBlack`)
				.setTextAlign(`right`)
				.printText(commanifier(user.group[this.index].ac), size.x - 50, this.y)
			return this
		}


		//  Returns user candies
		get candies() {
			this.text_check
			canv.setTextFont(`15pt RobotoBlack`)
				.setTextAlign(`right`)
				.printText(commanifier(user.group[this.index].cdy), size.x - 50, this.y)
			return this
		}


		//  Return user level
		get level() {
			this.text_check
			canv.setTextAlign(`right`)
			canv.setTextFont(`15pt Robotoblack`)
				.printText(user.group[this.index].lv, size.x - 50, this.y)
			return this
		}


		//  Return current exp
		get exp() {
			canv.setTextAlign(`left`)
			canv.setTextFont(`12pt Whitney`)
			canv.printText(commanifier(user.group[this.index].xp) + ` XP`, size.x2 + 160, this.y + 20)
			return this
		}


		//  Return current ranking
		get position() {
			canv.setColor(palette.white)
			canv.setTextAlign(`left`)
			canv.setTextFont(`17pt RobotoBold`)
			canv.printText(`#${this.index + 1}`, size.x2 + 30, this.y)
			return this
		}


		//  Returns avatar
		async avatar() {
			const userAvatar = await avatar(user.group[this.index].id, true, `?size = 256`)
			canv.printCircularImage(userAvatar, size.x2 + 80, this.y - 30, 50, 50, 25)
			return this
		}

	}

	// Bundled functions for each row rendering task for text based
	class TextOptRow {
		constructor(index, distancey, group) {
			this.index = index
			this.y = distancey * (this.index + 1)
			this.group = group
			this.text = ``
		}


		//  Adapt the text to match with the background
		get text_check_top() {
			if (this.highlight_user) {
				if (this.index == user.limit) {
					return `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`
				} else {
					return `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`
				}
			}
			return ``
		}

		get text_check_bottom() {
			if (this.highlight_user) {
				if (this.index == user.limit) {
					return `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`
				} else {
					return `\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`
				}
			}
			return ``
		}

		//  Make sure the nickname length is not greater than 10 characters
		get nickname_formatter() {
			let name
			try {
				name = bot.users.cache.get(user.group[this.index].id).username
			} catch (err) {
				name = `User Left`
			}
			return name
		}


		//  Return nickname
		get nickname() {
			return this.nickname_formatter
		}


		//  Returns reputation points
		get reputation() {
			const reps = commanifier(user.group[this.index].rep)
			return `${reps} ★`
		}


		//  Highlight if user is in the top ten list
		get highlight() {
			if (user.group[this.index].id === author.id) {
				this.highlight_user = true
				return `**`
			}
			return ``
		}


		//  Returns user liked post
		get liked() {
			const reps = commanifier(user.group[this.index].liked_count)
			return `Reps \u3016${reps} ❤\u3016`
		}

		//  Returns user watched anime
		get anime() {
			const reps = commanifier(user.group[this.index].anime)
			return `Anime Count \u3016${reps}\u3017`
		}


		//  Returns user artcoins
		get artcoins() {
			return `AC \u3016${commanifier(user.group[this.index].ac)}\u3017`
		}


		//  Returns user candies
		get candies() {
			return `Candies \u3016${commanifier(user.group[this.index].cdy)}\u3017`
		}


		//  Return user level
		get level() {
			return `LV \u3016${user.group[this.index].lv}\u3017`
		}


		//  Return current exp
		get exp() {
			return `EXP \u3016${commanifier(user.group[this.index].xp)}\u3017`
		}


		//  Return current ranking
		get position() {
			return `#${this.index + 1}`
		}
	}

	//  Bundled functions for leaderboard interface.
	class Leaderboard {

		constructor(group) {
			this.group = group
		}

		//  Level leaderboard
		async xp() {
			metadata.title = `${emoji(`aauBell`)} **| Level Leaders**`
			metadata.footer_components = [user.authorindex + 1, commanifier(metadata.user.currentexp), `EXP`]

			for (let i = 0; i < user.group.length; i++) {
				canv.save()
					.save()

				await new Row(i, 65, `group`)
					.highlight
					.nickname
					.exp
					.level
					.position
					.avatar()

				let row = await new TextOptRow(i, 65, `group`)
				i < 9 ?
					textleaderboard += `${row.text_check_top}${row.position}  ${row.level} ${row.highlight}${row.nickname}${row.highlight}\n\t${row.exp}${row.text_check_bottom}\n\n` :
					textleaderboard += `${row.text_check_top}${row.position} ${row.level} ${row.highlight}${row.nickname}${row.highlight}\n\t${row.exp}${row.text_check_bottom}`

				canv.restore()
			}
		}

		deleteObjectFromArr(arr, obj) {
			var index = arr.indexOf(obj)
			if (index > -1) {
				arr.splice(index, 1)
			}
		}

		async removeMemberFromListACgroup(id) {
			let index
			for (let i = 0; i < user.group.length; i++) {
				if (user.group[i].id === id) {
					index = i
				}
			}
			this.deleteObjectFromArr(user.group, user.group[index])
			user.limit++
			user.group.push({
				id: await dbmanager.indexRankingAC(`item_inventory`, `quantity`, user.limit, `user_id`),
				ac: await dbmanager.indexRankingAC(`item_inventory`, `quantity`, user.limit, `quantity`)
			})
		}

		//  Artcoins leaderboard
		async ac() {
			metadata.title = `${emoji(`artcoins`)} **| Artcoins Leaders**`
			if ((await dbmanager.authorIndexRankingAC(`item_inventory`, `quantity`, `277266191540551680`)) < 10) this.removeMemberFromListACgroup(`277266191540551680`)
			if (user.authorindex > (await dbmanager.authorIndexRankingAC(`item_inventory`, `quantity`, `277266191540551680`))) user.authorindex -= 1
			metadata.footer_components = [user.authorindex + 1, commanifier(metadata.user.artcoins), emoji(`artcoins`)]

			for (let i = 0; i < user.group.length; i++) {
				canv.save()
					.save()

				await new Row(i, 65, `acgroup`)
					.highlight
					.nickname
					.position
					.artcoins
					.avatar()

				let row = await new TextOptRow(i, 65, `acgroup`)
				i < 9 ?
					textleaderboard += `${row.text_check_top}${row.position}  ${row.highlight}${row.nickname}${row.highlight}\n\t${row.artcoins}${row.text_check_bottom}\n\n` :
					textleaderboard += `${row.text_check_top}${row.position} ${row.highlight}${row.nickname}${row.highlight}\n\t${row.artcoins}${row.text_check_bottom}`


				canv.restore()
			}
		}


		//  Halloween Candies leaderboard
		async halloween() {

			metadata.title = `${emoji(`AnnieShock`)} **| Halloween Candies Leaders**`
			metadata.footer_components = [user.authorindex + 1, commanifier(metadata.user.candies), emoji(`candies`)]

			for (let i = 0; i < user.group.length; i++) {
				canv.save()
					.save()

				await new Row(i, 65, `cdygroup`)
					.highlight
					.nickname
					.position
					.candies
					.avatar()

				let row = await new TextOptRow(i, 65, `cdygroup`)
				i < 9 ?
					textleaderboard += `${row.text_check_top}${row.position}  ${row.highlight}${row.nickname}${row.highlight}\n\t${row.candies}${row.text_check_bottom}\n\n` :
					textleaderboard += `${row.text_check_top}${row.position} ${row.highlight}${row.nickname}${row.highlight}\n\t${row.candies}${row.text_check_bottom}`

				canv.restore()
			}
		}


		//  Reputations leaderboard
		async rep() {
			metadata.title = `${emoji(`AnnieYay`)} **| Popularity Leaders**`
			metadata.footer_components = [user.authorindex + 1, commanifier(metadata.user.reputations), `☆`]

			for (let i = 0; i < user.group.length; i++) {
				canv.save()
					.save()

				await new Row(i, 65, `repgroup`)
					.highlight
					.nickname
					.position
					.reputation
					.avatar()

				let row = await new TextOptRow(i, 65, `repgroup`)
				i < 9 ?
					textleaderboard += `${row.text_check_top}${row.position}  ${row.highlight}${row.nickname}${row.highlight}\n\t${row.reputation}${row.text_check_bottom}\n\n` :
					textleaderboard += `${row.text_check_top}${row.position} ${row.highlight}${row.nickname}${row.highlight}\n\t${row.reputation}${row.text_check_bottom}`

				canv.restore()
			}
		}


		//  Artists leaderboard
		async arts() {
			metadata.title = `${emoji(`AnnieYay`)} **| Artists Leaders**`
			metadata.footer_components = [user.authorindex + 1, commanifier(metadata.user.liked_counts), `♡`]

			for (let i = 0; i < user.group.length; i++) {
				canv.save()
					.save()

				await new Row(i, 65, `artgroup`)
					.highlight
					.nickname
					.position
					.liked
					.avatar()

				let row = await new TextOptRow(i, 65, `artgroup`)
				i < 9 ?
					textleaderboard += `${row.text_check_top}${row.position}  ${row.highlight}${row.nickname}${row.highlight}\n\t${row.liked}${row.text_check_bottom}\n\n` :
					textleaderboard += `${row.text_check_top}${row.position} ${row.highlight}${row.nickname}${row.highlight}\n\t${row.liked}${row.text_check_bottom}`

				canv.restore()
			}
		}

		//  Weeb leaderboard
		async weeb() {
			metadata.title = `${emoji(`culture`)} **| Weeb Leaders**`
			metadata.footer_components = [user.authorindex + 1, commanifier(user.authorindex > -1 ? user.group[user.authorindex].anime : 0), `completed anime`]

			for (let i = 0; i < Math.min(user.group.length, 10); i++) {
				canv.save()
					.save()

				await new Row(i, 65, `group`)
					.highlight
					.nickname
					.position
					.anime
					.avatar()

				let row = await new TextOptRow(i, 65, `group`)
				i < 9 ?
					textleaderboard += `${row.text_check_top}${row.position}  ${row.highlight}${row.nickname}${row.highlight}\n\t${row.anime}${row.text_check_bottom}\n\n` :
					textleaderboard += `${row.text_check_top}${row.position} ${row.highlight}${row.nickname}${row.highlight}\n\t${row.anime}${row.text_check_bottom}`

				canv.restore()
			}
		}


		//  Card background layer
		base() {
			canv.setShadowColor(`rgba(28, 28, 28, 1)`)
				.setShadowOffsetY(7)
				.setShadowBlur(15)
				.setColor(palette.darkmatte)

				.printRectangle(size.x2 + 15, size.y2 + 10, size.x - 45, size.y - 45)
				.createRoundedClip(size.x2, size.y2, size.x - 20, size.y - 20, 15)
				.setShadowBlur(0)
				.setShadowOffsetY(0)
				.setColor(palette.nightmode)
				.printRectangle(size.x2, size.y2, size.x, size.y)
				.printRectangle(size.x2 + 150, size.y2, size.x, size.y)
				.restore()
				.setColor(palette.white)
				.setTextFont(`16pt RobotoBold`)
		}


		//  Method selector
		get setup() {
			this.base()
			return this[this.group]()
		}

	}


	await new Leaderboard(metadata.selected_group).setup
	metadata.textOption = textleaderboard
	metadata.img = canv.toBuffer()
	return metadata
}

module.exports = render