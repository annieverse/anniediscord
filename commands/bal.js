module.exports.run = async (Stacks) => {
    /**
     * Main currency module
     * @Balance outputing artcoins data
     */
    class Balance {
        get execute() {
            return Stacks.msg.channel
                .send(`**${Stacks.meta.owner}'s Balance**`)
                .then(() => {
                    Stacks.utils.send(`${Stacks.utils.emoji(`artcoins`)} ${Stacks.utils.commanized(Stacks.meta.data.artcoins)} Artcoins`);
            })
        }
    }

    new Balance().execute;
}

module.exports.help = {
    name: "balance",
    aliases: [`bal`, `money`, `credit`, `ball`, `ac`, `artcoin`, `artcoins`],
    description: `Checks your AC balance`,
    usage: `>bal`,
    group: "General",
    public: true,
}