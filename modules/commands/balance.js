/**
 * Main module
 * @Balance outputing artcoins data
 */
class Balance {
    constructor(Stacks) {
		this.stacks = Stacks;
    }
    async execute() {
        const { reply, code, emoji, avatar, commanifier, meta : { author, data }} = this.stacks;

        return reply(code.DISPLAY_BALANCE, {
            socket: [emoji(`artcoins`), commanifier(data.artcoins)],
            notch: true,
            thumbnail: avatar(author.id)
        })
    }
}


module.exports.help = {
    start: Balance,
    name: "balance",
    aliases: [`bal`, `money`, `credit`, `ball`, `ac`, `artcoin`, `artcoins`],
    description: `Checks your AC balance`,
    usage: `${require(`../../.data/environment.json`).prefix}bal`,
    group: "General",
    public: true,
    required_usermetadata: true,
    multi_user: true
}