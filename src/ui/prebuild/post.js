const Cards = require(`../components/cards`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
const moment = require(`moment`)
const probe = require(`probe-image-size`)

class UI {
	/**
	 * Post UI Builder.
	 * to access the buffer, please call `.toBuffer()` after running `this.build()`
	 * @param {User} [user={}] parsed user object from `./src/libs/user`
	 * @legacy
	 * @return {Canvas}
	 */
	constructor(user={}) {
		this.user = user
		this.width = 320
		this.height = 430
		this.startPos_x = 10
		this.startPos_y = 10
		this.baseWidth = this.width - 20
		this.baseHeight = this.height - 20
		this.post = this.user.posts[0]
		this.caption = `My newest artwork!`
		this.card = new Cards({
			width: this.width,
			height: this.height,
			theme: this.user.usedTheme.alias
		})
	}

	async build() {
		//  Base card
        this.card.createBase({cornerRadius: 25})

		//  Post's description/caption
        this.card.canv.setColor(this.card.color.text)
        .setTextAlign(`left`)
        .setTextFont(`10pt roboto`)
		if (this.post.caption) this.caption = this.post.caption.replace(/<[^>]*>?/gm, ``)
		if (this.caption.length > 0 && this.caption.length <= 50) {
			if (this.formatString(this.caption, 1).second) {
				this.card.canv.addText(this.formatString(this.caption, 1).first, 70, 377)
					.addText(this.formatString(this.caption, 1).second, 70, 390)
			} 
			else {
				this.card.canv.addText(this.formatString(this.caption, 1).first, 70, 377)
			}
		} 
		else if (this.caption.length > 50 && this.caption.length <= 100) {
			if (this.formatString(this.caption, 2).third) {
				this.card.canv.addText(this.formatString(this.caption, 2).first, 70, 70)
					.addText(this.formatString(this.caption, 2).second, 70, 85)
					.addText(this.formatString(this.caption, 2).third, 70, 100)
			} else {
				this.card.canv.addText(this.formatString(this.caption, 2).first, 70, 85)
					.addText(this.formatString(this.caption, 2).second, 70, 100)
			}
		} 
		else if (this.caption.length > 100) {
			this.card.canv.addText(this.formatString(this.caption, 3).first, 70, 70)
				.addText(this.formatString(this.caption, 3).second, 70, 85)
				.addText(this.formatString(this.caption, 3).third+`...`, 70, 100)
		}

		//  Floating avatar
        this.card.canv.addRoundImage(await urlToBuffer(this.user.user.displayAvatarURL()), 30, 340, 30, 30, 15)

        //  Title Bar
        this.card.canv.setColor(this.card.color.text)
        .setTextAlign(`left`)
        .setTextFont(`12pt roboto-bold`)
        .addText(this.user.user.username, 70, 360)
        .setTextAlign(`right`)
        .setTextFont(`9pt roboto-light`)
        .addText(moment(this.user.recentPostLocalTimestamp).fromNow(), this.baseWidth-15, 358)

		//  Displayed image/artwork of the post
		this.card.canv.save()
        	.createBeveledClip(this.startPos_x, this.startPos_y, this.baseWidth, this.baseHeight/1.3, 25)
			.setColor(this.card.color.separator)
			.addRect(this.startPos_x, this.startPos_y, this.baseWidth, this.baseHeight/1.3)
		let proberes = await probe(this.post.url)
		let imageWidth = proberes.width
		let imageHeight = proberes.height
		let photo = await urlToBuffer(this.post.url)

		//  If image's width is over than its height (landscape orientation), downscale to closest height fit.
		if (imageWidth > imageHeight) {
			const x = this.startPos_x - ((imageWidth * this.baseHeight / imageHeight) - this.baseWidth) / 2
			const y = 0
			const dx = imageWidth * this.baseHeight / imageHeight
			const dy = this.baseHeight
			const resolution = 1
			this.card.canv.addImage(photo, x, y, dx, dy, resolution)

		//  Or if the image has higher heights than its width (portrait orientation), downscale to closest width fit.
		} else {
			const x = this.startPos_x
			const y = 0
			const dx = this.baseWidth
			const dy = imageHeight * this.baseWidth / imageWidth
			const resolution = 1
			this.card.canv.addImage(photo, x, y, dx, dy, resolution)
		}


		return this.card.ready()
	}

	/**
	 * Fetching discord's img url with probe framework.
	 * @param {number} [amountOfTries=10] The maximum index of urls to be fetched from.
	 * @returns {object}
	 */
	async fetchingImageMetadata(amountOfTries=10) {
		let res = null
		for (let i=0; i<amountOfTries; i++) {
			try {
				res = await probe(this.user.posts[i].url)
				this.post = this.user.posts[i]
				break
			}
			catch(e) { continue }
		}
		return res
	}

	/**
	 * Formatting each paragraph.
	 * @param {string} [string=``] Beautifully indented text.
	 * @param {number} [numlines=0] The text will be divided into specified total of line(2 = 2 lines of text.)
	 * @returns {string}
	 */
	formatString(string=``, numlines=0) {
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