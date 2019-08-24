const Discord = require(`discord.js`)
const moment = require(`moment`)
const palette = require(`./colorset.json.js`)
let embed = new Discord.RichEmbed()
let advEmbed = new Discord.RichEmbed()
let footeredEmbed = new Discord.RichEmbed()
/**
 * Misc utils.
 * {formatterUtils}
 */
class formatterUtils {

	/**
	 * Calling discord message listener.
	 * @param message of given message listener.
	 */
	constructor(message) {
		this.message = message
	}

	/**
	 * Display user's nickname in current guild.
	 * @param id of user id.
	 */
	nickname(id) {
		try {
			return this.message.guild.members.get(id).displayName
		} catch (e) {
			return `User unavailable. (ID: ${id})`
		}
	}

	/**
	 * Formatting each paragraph.
	 * @timestamp of given unix time.
	 */
	formatedTime(timestamp) {
		return moment(timestamp).format(`dddd, Do MMMM YYYY`)
	}


	/**
	 * Randomize number inside of given range.
	 * @poram min of minimum value.
	 * @param max of maximum value.
	 */
	rangeNumber(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min
	}


	/**
	 * Randomize index of an array.
	 * @param array of given array.
	 */
	randomize(array) {
		return array[Math.floor(Math.random() * array.length)]
	}


	/**
	 * Formatting number into K format.
	 * @num of given value
	 */
	formatK(num) {
		return num > 999999 ? (num / 1000000).toFixed(1) + `M` : num > 999 ? (num / 1000).toFixed(1) + `K` : num
	}


	/**
	 * Getting percentage.
	 * @portion of portion value;
	 * @total of whole percent
	 */
	getPercentage(portion, total) {
		return (Math.floor((portion * 100) / total)).toFixed()
	}


	/**
	 * Replace comma in a string of number.
	 * @number value
	 */
	threeDigitsComa(number = 0) {
		return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, `,`)
	}


	/**
	 * Adding ordinx behind the given number.
	 * @i of given number.
	 */
	ordinalSuffix(i) {
		var j = i % 10,
			k = i % 100
		if (j == 1 && k != 11) {
			return i + `st`
		}
		if (j == 2 && k != 12) {
			return i + `nd`
		}
		if (j == 3 && k != 13) {
			return i + `rd`
		}
		return i + `th`
	}

	/**
	 * Format first character of the string to be uppercased.
	 * @param string.
	 */
	capitalizeFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1)
	}


	avatarWrapper(url, author) {
		embed.setImage(url)
		embed.setAuthor(author, url)
		embed.setColor(palette.darkmatte)

		return this.message.channel.send(embed)
	}



	/**
	 * Wrapped simple discord message embed.
	 * @color of given hex code.
	 * @content of message content.
	 */
	embedWrapper(color, content, image = null) {
		embed.setColor(color)
		embed.setDescription(content)

		if (image) {
			embed.attachFile(new Discord.Attachment(image, `preview.jpg`))
			embed.setImage(`attachment://preview.jpg`)
		} else if (embed.file) {
			embed.image.url = null
			embed.file = null
		}
		return this.message.channel.send(embed)
	}


	/**
	 * Wrapped object base of discord message embed.
	 * @color of given hex code.
	 * @content of message content.
	 */
	embedBase(color, content) {
		embed.setColor(color)
		embed.setDescription(content)
		return embed
	}


	/**
	 * Dev footer discord message embed.
	 * @color of given hex code.
	 * @content of message content.
	 */
	embedWrapperDev(color, content) {
		footeredEmbed.setColor(color)
		footeredEmbed.setDescription(content)
		footeredEmbed.setFooter(`${this.message.author.username} | Developer Mode`, this.message.author.displayAvatarURL)
		return this.message.channel.send(footeredEmbed)
	}

	/**
	 * Advanced discord message embed.
	 */
	embedWrapperAdv(...options) {

		let footer
		options[4] ? footer= options[4].split(`,,`) : footer[0]=`No Footer Set`
		advEmbed.setColor(options[0] || palette.darkmatte)
		advEmbed.setDescription(options[1] || `I'm sorry, I dont know what to say. I am a blank Embed that has not been modified fully. . .`)
		advEmbed.setTitle(options[2] || `No Title`)
		advEmbed.setTimestamp(options[3] || Date.now())
		if (footer.length > 1) { advEmbed.setFooter(footer[0], footer[1]) } else if (footer.length == 1) { advEmbed.setFooter(footer[0]) } else { advEmbed.setFooter(footer[0])}
		return this.message.channel.send(advEmbed)
	}

	/**
	 * Marked down discord message embed.
	 * @color of given hex code.
	 * @content of message content.
	 */
	markdown(color, content) {
		embed.setColor(color)
		embed.setDescription(`\`\`\`json\n${content}\n\`\`\``)
		return this.message.channel.send(embed)
	}

}

module.exports = formatterUtils