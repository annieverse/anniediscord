var content = require(`../../utils/challengelist.json`)
class artChallenge {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async execute() {
		const {reply, collector} = this.stacks
		let timer = 60

		reply(`List of art challenges, please choose one.\n` +
        `you can view their sub-category by typing >sub{category name}\n\n` +
        `{0} seconds to type the category, you wish the theme to be.\n\n` +
        `-Monster\n\n` +
        `-Challenges\n\n` +
        `-Enviroment\n\n` +
        `-Themes\n\n` +
        `-Personification\n\n` +
        `-Anime\n\n` +
        `-Emotion/Mood\n\n` +
		`-Time Period`,{socket:[timer]})
		collector.on(`collect`, async (msg) => {
			let argsUpperCased = msg.content.toUpperCase()
			let randomNum = 0
			let category
			let subItem = ``

			function getRndInteger(min, max) {
				return Math.floor(Math.random() * (max - min)) + min
			}
			switch (argsUpperCased) {
				case `MONSTER`:
					category = content.MONSTER
					randomNum = category.length
					break
				case `ENVIRONMENT`:
					category = content.ENVIRONMENT
					randomNum = category.length
					break
				case `THEMES`:
					category = content.THEMES
					randomNum = category.length
					break
				case `PERSONIFICATION`:
					category = content.PERSONIFICATION
					randomNum = category.length
					break
				case `ANIME`:
					category = content.ANIME
					randomNum = category.length
					break
				case `EMOTION/MOOD`:
					category = content.EMOTION_MOOD
					randomNum = category.length
					break
				case `TIME PERIOD`:
					category = content.TIME_PERIOD
					randomNum = category.length
					break
				default:
					break
			}

			let y = getRndInteger(1, randomNum)
			subItem = category[y].sub

			reply(`The chosen theme for this duel is...**{0}!**`,{socket:[subItem]})
			collector.stop()
		})
	}
}

module.exports.help = {
	start: artChallenge,
	name:`artch`,
	aliases: [`art.ch`],
	description: `Selects a random theme for an art duel`,
	usage: `art.ch`,
	group: `General`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}