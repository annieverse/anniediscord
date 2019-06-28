/**
 * Main module
 * @ArtcoinsGenerator Admin command to add artcoins
 */
class ArtcoinsGenerator {
    constructor(Stacks) {
        this.stacks = Stacks;
    }

    //  Init
    async execute() {

        //  Pistachio stacks
        const { name, args, emoji, isAdmin, trueInt, reply, commanifier, code, db, meta: { author, data } } = this.stacks;

        //  Returns if user doesn't have admin authority
        if (!isAdmin) return reply(code.UNAUTHORIZED_ACCESS)

        //  Returns if user not specifying any parameters
        if (!args[0]) return reply(code.ADDAC.SHORT_GUIDE)

        //  Returns if user not specifying the value
        if (!args[1]) return reply(code.ADDAC.MISSING_VALUES)

        //  Returns if input is a negative value
        if (!trueInt(args[1])) return reply(code.ADDAC.NEGATIVE_VALUES)

        //  Storing new balance value
        const amount = trueInt(args[1])
        db(author.id).storeArtcoins(amount)

        //  Finishing message
        return reply(code.ADDAC.SUCCESSFUL, {
            socket: [
                name(author.id),
                emoji(`artcoins`),
                commanifier(data.artcoins),
                commanifier(amount)]
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