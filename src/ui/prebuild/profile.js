const Cards = require(`../components/cards`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
const loadAsset = require(`../../utils/loadAsset`)
const commanifier = require(`../../utils/commanifier`)

class UI {
	/**
	 * Profile UI Builder.
	 * to access the buffer, please call `.toBuffer()` after running `this.build()`
	 * @param {User} [user={}] parsed user object from `./src/libs/user`
	 * @return {Canvas}
	 */
	constructor(user={}, width=320, height=420) {
		this.user = user
		this.width = width
		this.height = height
	}


	/**
	 *  This UI still uses abstraction canvas.
	 */
	async build() {
		let startPos_x = 10
		let startPos_y = 10
		let baseWidth = this.width - 20
		let baseHeight = this.height - 20

		let card = new Cards({
			width: this.width,
			height: this.height,
			theme: this.user.usedTheme
		})
		.createBase({cornerRadius: 25})

		//  Sticker
		if (this.user.usedSticker) card.canv.addImage(await loadAsset(`sticker_${this.user.usedSticker}`), startPos_x, startPos_y + 194, baseWidth, 206)

		//  Cover
		card.canv.setColor(this.user.rank.color)
			.addRect(startPos_x, startPos_y, baseWidth, 194)
			.addImage(await loadAsset(this.user.usedCover), startPos_x, startPos_y, baseWidth, 194)

		//  Avatar
		card.canv.setColor(this.user.premium ? card._resolveColor(`yellow`) :  card._resolveColor(card.color.main))
			.addCircle(startPos_x + 70, 200, 52) 
			.addRoundImage(await urlToBuffer(this.user.user.displayAvatarURL), startPos_x + 20, 150, 100, 100, 50)

		//  Badges
		const badges = this.user.inventory.raw.filter(key => (key.type === `BADGES`) && (key.in_use === 1))
		const symetric_xy = 18
		const diameter = Math.round(symetric_xy / 2)
		const y_badge = 208
		await setBadge(symetric_xy, diameter, y_badge)
		//we can fit 8 badges; if user has more display a plus or something
		async function setBadge(xy, diameter, pos_y) {
			for (var i=0; i<=Math.min(badges.length, 6); i++) {
				card.canv.addImage(await loadAsset(badges[i].alias), startPos_x + 128 + i*20, pos_y, xy, xy, diameter)
			}
			if (badges.length == 7) {
				card.canv.addImage(await loadAsset(badges[i].alias), startPos_x + 128 + 140, pos_y, xy, xy, diameter)
			} else if (badges.length > 7) {
				card.canv.addImage(await loadAsset(`plus`), startPos_x + 128 + 140, pos_y, xy, xy, diameter)
			}
		}

		//  Username
		card.canv.setColor(card.color.text)
			.setTextAlign(`center`)
			.setTextFont(`${this.resizeLongNickname(this.user.user.username)} RobotoBold`)
			.addText(this.user.user.username, startPos_x + 70, 272)

		//  Title
		card.canv.setColor(this.user.rank.color)
			.setTextFont(`5pt RobotoBold`)
			.addText(this.user.title, startPos_x + 70, 286)

		//  Verified/Blue Badge
		const verifiedStartingPoint = card.canv.measureText(this.user.user.username).width * 1.3 + 2
		if (this.user.verified) card.canv.addImage(await loadAsset(`verified_badge`), startPos_x + 70 + verifiedStartingPoint, 256, 16, 16)

		// Rank title
		card.canv.setColor(this.user.rank.color)
			.createBeveledClip(startPos_x + 150, startPos_y + 250, 130, 20, 20)
			.addRect(startPos_x + 150, startPos_y + 250, 130, 20)
			.setColor(card._resolveColor(`white`))
			.setTextFont(`8pt RobotoBold`) // role window - role name
			.addText(this.user.rank.name, startPos_x + 215, startPos_y + 264)
			.restore()

		//  Description
		card.canv.setColor(card.color.text)
			.setTextAlign(`left`)
			.setTextFont(`8pt Roboto`)

		if (this.user.main.bio.length > 0 && this.user.main.bio.length <= 51) {
			card.canv.addText(this.formatString(this.user.main.bio, 1).first, 40, 307)
				.addText(this.formatString(this.user.main.bio, 1).second, 40, 320)

		} else if (this.user.main.bio.length > 51 && this.user.main.bio.length <= 102) {
			card.canv.addText(this.formatString(this.user.main.bio, 2).first, 40, 307)
				.addText(this.formatString(this.user.main.bio, 2).second, 40, 320)
				.addText(this.formatString(this.user.main.bio, 2).third, 40, 333)

		} else if (this.user.main.bio.length > 102 && user.main.bio.length <= 154) {
			card.canv.addText(this.formatString(this.user.main.bio, 3).first, 40, 307)
				.addText(this.formatString(this.user.main.bio, 3).second, 40, 320)
				.addText(this.formatString(this.user.main.bio, 3).third, 40, 333)
				.addText(this.formatString(this.user.main.bio, 3).fourth, 40, 346)
		}

		//  HEART, LVL, REP
		card.canv.setTextAlign(`center`)
			.setColor(this.user.rank.color)
			.setTextFont(`20pt RobotoMedium`)
			.addText(commanifier(this.user.likecount), 70, 370)
			.addText(this.user.exp.level, 160, 370)
			.addText(commanifier(this.user.reputations.total_reps), 250, 370)

			.setColor(card.color.text)
			.setTextFont(`8pt Roboto`)
			.addText(`HEARTS`, 70, 390) // left point
			.addText(`LEVEL`, 160, 390) // middle point
			.addText(`FAME`, 250, 390) // right point

		return card.ready()
	}

	resizeLongNickname(name = ``) {
		return name.length <= 12 ? `14pt` : name.length <= 17 ? `11pt` : `9pt`
	}

	/**
	 * Formatting each paragraph.
	 * @string of user description.
	 * @numlines of paragraph.
	 */
	formatString(string, numlines) {
		var paraLength = Math.round((string.length) / numlines)
		var paragraphs = []
		var marker = paraLength
		for (var i = 0; i < numlines; i++) {
			//if the marker is right after a space, move marker back one character
			if (string.charAt(marker - 1) == ` `) {
				marker--
			}

			//if marker is in middle of word, try moving to the back of the word
			//but at most 5 characters
			for (var j=0; j<5;j++) {
				if (string.charAt(marker) != ` ` && string.charAt(marker) != ``) {
					marker = marker+j
				}
			}

			//if can't move to back of word, more to front instead
			while (string.charAt(marker) != ` ` && string.charAt(marker) != ``) {
				marker--
			}
			var nextPara = string.substring(0, marker)

			paragraphs.push(nextPara)
			string = string.substring((nextPara.length + 1), string.length)
		}
		if (string) {
			paragraphs.push(string)
		}
		return {
			first: paragraphs[0],
			second: paragraphs[1]?paragraphs[1]:``,
			third: paragraphs[2]?paragraphs[2]:``,
			fourth: paragraphs[3]?paragraphs[3]:``
		}
	}

}

module.exports = UI