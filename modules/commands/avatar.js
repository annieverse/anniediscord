/**
 * Main module
 * @Avatar showing user avatar
 */
class Avatar {
	constructor(Stacks) {
		this.author = Stacks.meta.author;
		this.data = Stacks.meta.data;
		this.utils = Stacks.utils;
		this.message = Stacks.message;
		this.reactions = [
			`${this.utils.emoji(`HeartHug`)}`,
			"Amazing!",
			"I wuv it ❤",
			"Awesome art!",
			"Magnificent~",
			"#2k19 #topselfie",
			"Beautiful!!",
			"Avatar of the day!"
		];
		this.randomReactions = this.reactions[Math.floor(Math.random() * this.reactions.length)];
	}

	async execute() {
		this.message.react('📸')
		return this.utils.avatarWrapper(this.utils.avatarURL(this.author.id), `${this.utils.nickname(this.author.id)} (★ ${this.utils.commanized(this.data.reputations)})`)
			.then(() => {
				this.message.channel.send(this.randomReactions);
			})
	}
}



module.exports.help = {
	start: Avatar,
	name: "avatar",
	aliases: ['ava', 'pfp'],
	description: `Grabs your's or a specified user's avatar and displays it`,
	usage: `>avatar [user]<optional>`,
	group: "Fun",
	public: true,
	required_usermetadata: true
}