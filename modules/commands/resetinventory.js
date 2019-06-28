class resetInventory {
    constructor(Stacks) {
        this.author = Stacks.meta.author;
        this.data = Stacks.meta.data;
        this.utils = Stacks.utils;
        this.message = Stacks.message;
        this.args = Stacks.args;
        this.stacks = Stacks;
    }

    async execute() {
        let message = this.message;
        let bot = this.stacks.bot;
        const user = message.author;



        async function reset() {

            const sql = require('sqlite');
            sql.open('.data/database.sqlite');
            sql.run(`DELETE FROM userinventories WHERE userId = "${user.id}"`);
            await this.stacks.pause(500);
            sql.run(`INSERT INTO userinventories (userId) VALUES ("${user.id}")`);
            await this.stacks.pause(500);


            console.log(`${user.tag} inventory has been wiped out.`)
            return message.channel.send(`${utils.emoji(`aausugoi`, bot)} your inventory has been wiped out-`)
                .then(async msg => {
                    await this.stacks.pause(3000);
                    msg.delete();
                })
        }

        return message.member.roles.find(r => r.name === 'Creators Council') ? reset() : null
    }
}

module.exports.help = {
    start: resetInventory,
    name: "resetinventory",
    aliases: ["_resetinventory"],
    description: `resets your inventory`,
    usage: `${require(`../../.data/environment.json`).prefix}_resetinventory`,
    group: "Admin",
    public: true,
}