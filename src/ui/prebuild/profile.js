const Cards = require(`../components/cards`)
const Color = require(`color`)
const loadAsset = require(`../../utils/loadAsset`)
const formatK = require(`../../utils/formatK`)
const symbolParser = require(`../../utils/symbolParser`)
const {
	resolveImage
} = require(`canvas-constructor`)

class UI {
	/**
	 * Profile UI Builder.
	 * to access the buffer, please call `.toBuffer()` after running `this.build()`
	 * @param {User} [user={}] parsed user object from `./src/libs/user`
	 * @param {object} [bot] current client's instance object
	 * @param {object} [testResolution] manipulating card's width and height for testing/previewing purpose.
	 * @legacy
	 * @return {Canvas}
	 */
	constructor(user = {}, bot = {}, testResolution = {}) {
		/**
		 * User's meta
		 * @type {user}
		 */
		this.user = user

		/**
		 * Card's width
		 * @type {number}
		 */
		this.width = testResolution.width || 320

		/**
		 * Card's height
		 * @type {number}
		 */
		this.height = testResolution.height || 430

		/**
		 * Current client's instance
		 * @type {client}
		 */
		this.bot = bot
	}

	/**
	 * Rendering card
	 * @return {canvas}
	 */
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
			.createBase({
				cornerRadius: 25
			})
		//  Sticker
		if (this.user.usedSticker) card.canv.printImage(await resolveImage(await loadAsset(`sticker_${this.user.usedSticker.alias}`)), startPos_x, startPos_y + 194, baseWidth, 206)
		//  Cover
		await card.addBackgroundLayer(this.user.usedCover.alias, {
			isSelfUpload: this.user.usedCover.isSelfUpload,
			minHeight: 197
		})
		card.canv.setColor(card.color.base)
			.printRectangle(0, 197, this.width, this.height)
		//  Avatar
		card.canv.setColor(card.color.base)
			.printCircle(startPos_x + 70, 200, 52)
			.printCircularImage(await resolveImage(this.user.master.displayAvatarURL({
				format: `png`,
				dynamic: false
			})), startPos_x + 70, 200, 50, 50, 25)
		//  Badges
		const badges = this.user.inventory.raw.filter(key => key.type_id === 2)
		for (let i = 0; i < badges.length; i++) {
			//  Limit displayed badges to specified amount
			if (i > 4) break
			card.canv.printImage(await resolveImage(await loadAsset(badges[i].alias)), this.width - 55 - i * 32, 215, 26, 26)
		}
		//  Username
		card.canv.setColor(card.color.text)
			.setTextAlign(`center`)
			.setTextFont(`${this.resizeLongNickname(this.user.master.username)} roboto-bold`)
			.printText(this.user.master.username, startPos_x + 70, 272)

		//  User's Title
		card.canv.setColor(adjustedPrimaryColorContrast)
			.setTextFont(`7pt roboto`)
			.printText(this.user.title.toUpperCase().split(``).join(` `), startPos_x + 70, 289)

		//  Verified/Blue Badge if any
		// const verifiedStartingPoint = card.canv.measureText(this.user.master.username).width * 1.3 + 2
		// if (this.user.main.verified) card.canv.printImage(await resolveImage(await loadAsset(`verified_badge`)), startPos_x + 60 + verifiedStartingPoint, 256, 16, 16)

		// Rank Bar
		card.canv.save()
			.setColor(adjustedPrimaryColorContrast)
			.createRoundedClip(startPos_x + 150, startPos_y + 250, 130, 20, 20)
			.printRectangle(startPos_x + 150, startPos_y + 250, 130, 20)
			.setColor(card._resolveColor(`white`))
			.setTextFont(`8pt roboto-bold`)
			.printText(symbolParser(this.user.rank.name), startPos_x + 215, startPos_y + 264)
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
			card.canv.printText(this.formatString(bio, 1).first, descriptionMarginLeft, descriptionMarginTop)
				.printText(this.formatString(bio, 1).second, descriptionMarginLeft, descriptionMarginTop + (descriptionMarginBetweenParagraph * 1))

		} else if (bio.length > 51 && bio.length <= 102) {
			card.canv.printText(this.formatString(bio, 2).first, descriptionMarginLeft, descriptionMarginTop)
				.printText(this.formatString(bio, 2).second, descriptionMarginLeft, descriptionMarginTop + (descriptionMarginBetweenParagraph * 1))
				.printText(this.formatString(bio, 2).third, descriptionMarginLeft, descriptionMarginTop + (descriptionMarginBetweenParagraph * 2))

		} else if (bio.length > 102 && bio.length <= 154) {
			card.canv.printText(this.formatString(bio, 3).first, descriptionMarginLeft, descriptionMarginTop)
				.printText(this.formatString(bio, 3).second, descriptionMarginLeft, descriptionMarginTop + (descriptionMarginBetweenParagraph * 1))
				.printText(this.formatString(bio, 3).third, descriptionMarginLeft, descriptionMarginTop + (descriptionMarginBetweenParagraph * 2))
				.printText(this.formatString(bio, 3).fourth, descriptionMarginLeft, descriptionMarginTop + (descriptionMarginBetweenParagraph * 3))
		}

		//  Footer Components [Heart, Level, Fame/Reputation Points]
		card.canv.setTextAlign(`center`)
			.setColor(adjustedPrimaryColorContrast)
			.setTextFont(`17pt roboto`)
			.printText(formatK(this.user.inventory.artcoins), 70, 370)
			.printText(this.user.exp.level, 160, 370)
			.printText(formatK(this.user.reputations.total_reps), 250, 370)

			.setColor(card.color.text)
			.setTextFont(`7pt roboto`)
			.printText(`ARTCOINS`, 70, 390)
			.printText(`LEVEL`, 160, 390)
			.printText(`FAME`, 250, 390)

		return card.ready()
	}

	/**
	 * Resizing font size based on name length
	 * @param {string} name
	 * @return {string}
	 */
	resizeLongNickname(name = ``) {
		return name.length <= 12 ? `14pt` : name.length <= 17 ? `11pt` : `9pt`
	}

	/**
	 * Formatting each paragraph.
	 * @param {string} string of user description.
	 * @param {number} numlines of paragraph.
	 * @return {object}
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
			for (var j = 0; j < 5; j++) {
				if (string.charAt(marker) != ` ` && string.charAt(marker) != ``) {
					marker = marker + j
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
			second: paragraphs[1] ? paragraphs[1] : ``,
			third: paragraphs[2] ? paragraphs[2] : ``,
			fourth: paragraphs[3] ? paragraphs[3] : ``
		}
	}
}

module.exports = UI