const Cards = require(`../components/cards`)
const Color = require(`color`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
const loadAsset = require(`../../utils/loadAsset`)
const formatK = require(`../../utils/formatK`)

class UI {
	/**
	 * Profile UI Builder.
	 * to access the buffer, please call `.toBuffer()` after running `this.build()`
	 * @param {User} [user={}] parsed user object from `./src/libs/user`
	 * @legacy
	 * @return {Canvas}
	 */
	constructor(user={}) {
		this.user = user
		this.width = 320
		this.height = 430
	}

	async build() {
		let startPos_x = 10
		let startPos_y = 10
		let baseWidth = this.width - 20
		const adjustedPrimaryColorContrast = this.user.usedTheme.alias === `light` ? Color(this.user.rank.color).saturate(0.8).darken(0.4).hex() : this.user.rank.color

		let card = new Cards({
			width: this.width,
			height: this.height,
			theme: this.user.usedTheme.alias
		})
		.createBase({cornerRadius: 25})

		//  Sticker
		if (this.user.usedSticker) card.canv.addImage(await loadAsset(`sticker_${this.user.usedSticker.alias}`), startPos_x, startPos_y + 194, baseWidth, 206)

		//  Cover
		card.canv.setColor(adjustedPrimaryColorContrast)
			.addRect(startPos_x, startPos_y, baseWidth, 194)
			.addImage(await loadAsset(this.user.usedCover.alias), startPos_x, startPos_y, baseWidth, 194)

		//  Avatar
		card.canv.setColor(this.user.premium ? card._resolveColor(`yellow`) :  card._resolveColor(card.color.main))
			.addCircle(startPos_x + 70, 200, 52) 
			.addRoundImage(await urlToBuffer(this.user.user.displayAvatarURL), startPos_x + 20, 150, 100, 100, 50)

		//  Badges
		const inventory = this.user.inventory.raw
		const badges = inventory.filter(key => key.type_name === `Badges`)

		const symetric_xy = 18
		const diameter = Math.round(symetric_xy / 2)
		const y_badge = 208
		await setBadge(symetric_xy, diameter, y_badge)
		async function setBadge(xy, diameter, pos_y) {
			for (let i=0; i<badges.length; i++) {
				if (i >= 7) {
					card.canv.addImage(await loadAsset(`plus`), startPos_x + 128 + 140, pos_y, xy, xy, diameter)
					break
				}
				card.canv.addImage(await loadAsset(badges[i].alias), startPos_x + 128 + i*20, pos_y, xy, xy, diameter)
			}
		}

		//  Username
		card.canv.setColor(card.color.text)
			.setTextAlign(`center`)
			.setTextFont(`${this.resizeLongNickname(this.user.user.username)} roboto-bold`)
			.addText(this.user.user.username, startPos_x + 70, 272)

		//  User's Title
		card.canv.setColor(adjustedPrimaryColorContrast)
			.setTextFont(`7pt roboto`)
			.addText(this.user.title.toUpperCase().split(``).join(` `), startPos_x + 70, 289)

		//  Verified/Blue Badge if any
		const verifiedStartingPoint = card.canv.measureText(this.user.user.username).width * 1.3 + 2
		if (this.user.verified) card.canv.addImage(await loadAsset(`verified_badge`), startPos_x + 70 + verifiedStartingPoint, 256, 16, 16)

		// Rank Bar
		card.canv.save()
			.setColor(adjustedPrimaryColorContrast)
			.createBeveledClip(startPos_x + 150, startPos_y + 250, 130, 20, 20)
			.addRect(startPos_x + 150, startPos_y + 250, 130, 20)
			.setColor(card._resolveColor(`white`))
			.setTextFont(`8pt roboto-bold`)
			.addText(this.user.rank.name, startPos_x + 215, startPos_y + 264)
			.restore()

		//  Description
		const bio = this.user.main.bio
		const descriptionMarginLeft = 50
		const descriptionMarginTop = 310
		const descriptionMarginBetweenParagraph = 13
		card.canv.setColor(card.color.text)
			.setTextAlign(`left`)
			.setTextFont(`8pt roboto`)
		if (bio.length > 0 && bio.length <= 51) {
			card.canv.addText(this.formatString(bio, 1).first, descriptionMarginLeft, descriptionMarginTop)
				.addText(this.formatString(bio, 1).second, descriptionMarginLeft, descriptionMarginTop+(descriptionMarginBetweenParagraph*1))

		} else if (bio.length > 51 && bio.length <= 102) {
			card.canv.addText(this.formatString(bio, 2).first, descriptionMarginLeft, descriptionMarginTop)
				.addText(this.formatString(bio, 2).second, descriptionMarginLeft, descriptionMarginTop+(descriptionMarginBetweenParagraph*1))
				.addText(this.formatString(bio, 2).third, descriptionMarginLeft, descriptionMarginTop+(descriptionMarginBetweenParagraph*2))

		} else if (bio.length > 102 && bio.length <= 154) {
			card.canv.addText(this.formatString(bio, 3).first, descriptionMarginLeft, descriptionMarginTop)
				.addText(this.formatString(bio, 3).second, descriptionMarginLeft, descriptionMarginTop+(descriptionMarginBetweenParagraph*1))
				.addText(this.formatString(bio, 3).third, descriptionMarginLeft, descriptionMarginTop+(descriptionMarginBetweenParagraph*2))
				.addText(this.formatString(bio, 3).fourth, descriptionMarginLeft, descriptionMarginTop+(descriptionMarginBetweenParagraph*3))
		}

		//  Footer Components [Heart, Level, Fame/Reputation Points]
		card.canv.setTextAlign(`center`)
			.setColor(adjustedPrimaryColorContrast)
			.setTextFont(`17pt roboto`)
			.addText(formatK(this.user.inventory.artcoins), 70, 370)
			.addText(this.user.exp.level, 160, 370)
			.addText(formatK(this.user.reputations.total_reps), 250, 370)

			.setColor(card.color.text)
			.setTextFont(`7pt roboto`)
			.addText(`ARTCOINS`, 70, 390)
			.addText(`LEVEL`, 160, 390) 
			.addText(`FAME`, 250, 390) 

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