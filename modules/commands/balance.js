/**
 * Main module
 * @Balance outputing artcoins data
 */
class Balance {
    constructor(Stacks) {
		this.author = Stacks.meta.author;
		this.data = Stacks.meta.data;
		this.utils = Stacks.utils;
		this.message = Stacks.message;
    }
    async execute() {
        return this.message.channel.send(`**${this.utils.name(this.author.id)}'s Balance**`)
            .then(() => {
                this.utils.sendEmbed(`${this.utils.emoji(`artcoins`)} ${this.utils.commanized(this.data.artcoins)} Artcoins`)
            })
    }
}


module.exports.help = {
    start: Balance,
    name: "balance",
    aliases: [`bal`, `money`, `credit`, `ball`, `ac`, `artcoin`, `artcoins`],
    description: `Checks your AC balance`,
    usage: `>bal`,
    group: "General",
    public: true,
    required_usermetadata: true,
    multi_user: true
}