const databaseManager = require(`../../utils/databaseManager`);
/**
 * Main module
 * @ArtcoinsGenerator Admin command to add artcoins
 */
class ArtcoinsGenerator {
    constructor(Stacks) {
        this.stacks = Stacks;
        this.author = Stacks.meta.author;
        this.data = Stacks.meta.data;
        this.utils = Stacks.utils;
        this.message = Stacks.message;
        this.args = Stacks.args;
    }


    async execute() {
        const { name, isAdmin, reply, code:{ ADDAC, UNAUTHORIZED_ACCESS }, commanifier } = this.stacks.pistachio;

        if (!isAdmin) return reply(UNAUTHORIZED_ACCESS);
        if (!this.args[1]) return reply(ADDAC.SHORT_GUIDE)

        const amount = parseInt(this.args[1]);
        new databaseManager(this.author.id).storeArtcoins(amount);

        return reply(ADDAC.SUCCESSFULL, {
            socket: [name(this.author.id)]
        })
    }
}


module.exports.help = {
    start: ArtcoinsGenerator,
    name: "artcoins-generator",
    aliases: [`addac`, `addacs`, `addartcoin`],
    description: `Add artcoins to specific user.`,
    usage: `${require(`../../.data/environment.json`).prefix}addac @user <amount>`,
    group: "Admin",
    public: true,
    required_usermetadata: true,
    multi_user: true
}