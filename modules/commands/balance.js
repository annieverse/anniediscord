/**
 * Main module
 * @Balance outputing artcoins data
 */

 class Balance {
    async execute(Stacks) {
        return Stacks.utils.send(`**${Stacks.meta.owner}'s Balance:**
        \n${Stacks.utils.emoji(`artcoins`)} ${Stacks.utils.commanized(Stacks.meta.data.artcoins)} Artcoins`);
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
}