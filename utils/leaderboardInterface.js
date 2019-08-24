const { Canvas } = require(`canvas-constructor`)
const { resolve, join } = require(`path`)
const { get } = require(`snekfetch`)
const imageUrlRegex = /\?size=2048$/g
const sql = require(`sqlite`)
sql.open(`.data/database.sqlite`)

Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-bold.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-black.ttf`)), `RobotoBlack`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-thin.ttf`)), `RobotoThin`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/Whitney.otf`)), `Whitney`)

//  Render the image
const render = async (stacks, metadata) => {
	const { db, palette, bot, emoji, commanifier, meta: { data, author } } = stacks

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
		xpgroup: [],
		acgroup: [],
		repgroup: [],
		artgroup: [],
		limit: 10,
		async pullingData() {
			for (let i = 0; i < 10; i++) {
				this.xpgroup.push({
					id: await dbmanager.indexRanking(`userdata`, `currentexp`, i, `userId`),
					xp: await dbmanager.indexRanking(`userdata`, `currentexp`, i, `currentexp`),
					lv: await dbmanager.indexRanking(`userdata`, `currentexp`, i, `level`)
				})
				this.acgroup.push({
					id: await dbmanager.indexRanking(`userinventories`, `artcoins`, i, `userId`),
					ac: await dbmanager.indexRanking(`userinventories`, `artcoins`, i, `artcoins`)
				})
				this.repgroup.push({
					id: await dbmanager.indexRanking(`userdata`, `reputations`, i, `userId`),
					rep: await dbmanager.indexRanking(`userdata`, `reputations`, i, `reputations`)
				})
				this.artgroup.push({
					id: await dbmanager.indexRanking(`userdata`, `liked_counts`, i, `userId`),
					liked_count: await dbmanager.indexRanking(`userdata`, `liked_counts`, i, `liked_counts`)
				})
			}
		},
		async user() {
			await this.pullingData()
			return {
				xpgroup: this.xpgroup,
				acgroup: this.acgroup,
				repgroup: this.repgroup,
				artgroup: this.artgroup,
				limit: this.limit,
				authorindex_xp: await dbmanager.authorIndexRanking(`userdata`, `currentexp`),
				authorindex_ac: await dbmanager.authorIndexRanking(`userinventories`, `artcoins`),
				authorindex_rep: await dbmanager.authorIndexRanking(`userdata`, `reputations`),
				authorindex_art: await dbmanager.authorIndexRanking(`userdata`, `liked_counts`)
			}
		}
	}
	const user = await ranking.user()


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
				name = bot.users.get(user[this.group][this.index].id).username
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
				.addText(this.nickname_formatter, size.x2 + 160, this.y)
			return this
		}


		//  Returns reputation points
		get reputation() {
			const reps = commanifier(user[this.group][this.index].rep)
			this.text_check
			canv.setTextAlign(`right`)
			canv.setTextFont(`15pt RobotoBlack`)
				.addText(`${reps} ★`, size.x - 50, this.y)
			return this
		}


		//  Highlight if user is in the top ten list
		get highlight() {
			if (user[this.group][this.index].id === author.id) {
				this.highlight_user = true
				canv.setColor(palette.golden)
					.addRect(size.x2, this.y - 35, size.x - size.x2, 60)
					.restore()
			}
			canv.restore()
			return this
		}


		//  Returns user liked post
		get liked() {
			const reps = commanifier(user[this.group][this.index].liked_count)
			this.text_check
			canv.setTextAlign(`right`)
			canv.setTextFont(`15pt RobotoBlack`)
				.addText(`${reps} ❤`, size.x - 50, this.y)
			return this
		}


		//  Returns user artcoins
		get artcoins() {
			this.text_check
			canv.setTextFont(`15pt RobotoBlack`)
				.setTextAlign(`right`)
				.addText(commanifier(user[this.group][this.index].ac), size.x - 50, this.y)
			return this
		}


		//  Return user level
		get level() {
			this.text_check
			canv.setTextAlign(`right`)
			canv.setTextFont(`15pt Robotoblack`)
				.addText(user[this.group][this.index].lv, size.x - 50, this.y)
			return this
		}


		//  Return current exp
		get exp() {
			canv.setTextAlign(`left`)
			canv.setTextFont(`12pt Whitney`)
			canv.addText(commanifier(user[this.group][this.index].xp) + ` XP`, size.x2 + 160, this.y + 20)
			return this
		}


		//  Return current ranking
		get position() {
			canv.setColor(palette.white)
			canv.setTextAlign(`left`)
			canv.setTextFont(`17pt RobotoBold`)
			canv.addText(`#${this.index + 1}`, size.x2 + 30, this.y)
			return this
		}


		//  Returns avatar
		async avatar() {
			let identify_user
			try {
				identify_user = bot.users.get(user[this.group][this.index].id).displayAvatarURL.replace(imageUrlRegex, `?size=256`)
			} catch (err) {
				identify_user = bot.user.displayAvatarURL.replace(imageUrlRegex, `?size=256`)
			}
			const {
				body: avatar
			} = await get(identify_user)
			canv.addRoundImage(await avatar, size.x2 + 80, this.y - 30, 50, 50, 25)
			return this
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
			metadata.footer_components = [user.authorindex_xp + 1, commanifier(metadata.user.currentexp), `EXP`]

			for (let i = 0; i < user.xpgroup.length; i++) {
				canv.save()
					.save()

				await new Row(i, 65, `xpgroup`)
					.highlight
					.nickname
					.exp
					.level
					.position
					.avatar()

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
			for (let i = 0; i < user.acgroup.length; i++) {
				if(user.acgroup[i].id === id) {
					index = i
				}
			}
			this.deleteObjectFromArr(user.acgroup, user.acgroup[index])
			user.limit++
			user.acgroup.push({
				id: await dbmanager.indexRanking(`userinventories`, `artcoins`, user.limit, `userId`),
				ac: await dbmanager.indexRanking(`userinventories`, `artcoins`, user.limit, `artcoins`)
			})
		}

		//  Artcoins leaderboard
		async ac() {

			this.removeMemberFromListACgroup(`277266191540551680`)

			metadata.title = `${emoji(`artcoins`)} **| Artcoins Leaders**`
            
			if (user.authorindex_ac > (await dbmanager.authorIndexRanking(`userinventories`, `artcoins`, `277266191540551680`))) user.authorindex_ac-=2
			metadata.footer_components = [user.authorindex_ac + 1, commanifier(metadata.user.artcoins), emoji(`artcoins`)]

			for (let i = 0; i < user.acgroup.length; i++) {
				canv.save()
					.save()

				await new Row(i, 65, `acgroup`)
					.highlight
					.nickname
					.position
					.artcoins
					.avatar()

				canv.restore()
			}
		}


		//  Reputations leaderboard
		async rep() {
			metadata.title = `${emoji(`wowo`)} **| Popularity Leaders**`
			metadata.footer_components = [user.authorindex_rep + 1, commanifier(metadata.user.reputations), `☆`]

			for (let i = 0; i < user.repgroup.length; i++) {
				canv.save()
					.save()

				await new Row(i, 65, `repgroup`)
					.highlight
					.nickname
					.position
					.reputation
					.avatar()

				canv.restore()
			}
		}


		//  Artists leaderboard
		async arts() {
			metadata.title = `${emoji(`hapiicat`)} **| Artists Leaders**`
			metadata.footer_components = [user.authorindex_art + 1, commanifier(metadata.user.liked_counts), `♡`]

			for (let i = 0; i < user.artgroup.length; i++) {
				canv.save()
					.save()

				await new Row(i, 65, `artgroup`)
					.highlight
					.nickname
					.position
					.liked
					.avatar()

				canv.restore()
			}
		}


		//  Card background layer
		base() {
			canv.setShadowColor(`rgba(28, 28, 28, 1)`)
				.setShadowOffsetY(7)
				.setShadowBlur(15)
				.setColor(palette.darkmatte)

				.addRect(size.x2 + 15, size.y2 + 10, size.x - 45, size.y - 45)
				.createBeveledClip(size.x2, size.y2, size.x - 20, size.y - 20, 15)
				.setShadowBlur(0)
				.setShadowOffsetY(0)
				.setColor(palette.nightmode)
				.addRect(size.x2, size.y2, size.x, size.y)
				.addRect(size.x2 + 150, size.y2, size.x, size.y)
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
	metadata.img = canv.toBuffer()
	return metadata
}

module.exports = render