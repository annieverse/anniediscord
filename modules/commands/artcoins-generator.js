const databaseManager = require(`../../utils/databaseManager`);
/**
 * Main module
 * @ArtcoinsGenerator Admin command to add artcoins
 */
class ArtcoinsGenerator {
    constructor(Stacks) {
        this.author = Stacks.meta.author;
        this.data = Stacks.meta.data;
        this.utils = Stacks.utils;
        this.message = Stacks.message;
        this.args = Stacks.args;
        this.palette = Stacks.palette;
        this.required_roles = this.message.member.roles.find(r => (r.name === 'Grand Master') || (r.name === 'Tomato Fox'));
    }


    async execute() {
        if (!this.required_roles) return;
        if (!this.args[1]) return;

        const amount = parseInt(this.args[1]);
        new databaseManager(this.author.id).storeArtcoins(amount);

        return this.utils
            .sendEmbed(`**${this.utils.name(this.author.id)}** has received ${this.utils.emoji(`artcoins`)}**${this.utils.commanized(amount)}**.`)
    }
}


module.exports.help = {
    start: ArtcoinsGenerator,
    name: "artcoins-generator",
    aliases: [`addac`, `addacs`, `addartcoin`],
    description: `Add artcoins to specific user.`,
    usage: `>addac @user <amount>`,
    group: "Admin",
    public: true,
    required_usermetadata: true,
    multi_user: true
}