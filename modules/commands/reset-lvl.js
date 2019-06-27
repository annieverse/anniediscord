const ranksManager = require('../../utils/ranksManager');
const sql = require("sqlite");
sql.open(".data/database.sqlite");

class resetLvl {
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
        const ranks = new ranksManager(bot, message)

        sql.get(`SELECT * FROM userdata WHERE userId = ${message.author.id}`)
            .then(async () => {
                message.guild.member(message.author.id).addRole(await ranks.ranksCheck(0).rank);
                sql.run(`UPDATE userdata SET currentexp = ${0} WHERE userId = ${message.author.id}`);
                sql.run(`UPDATE userdata SET maxexp = ${100} WHERE userId = ${message.author.id}`);
                sql.run(`UPDATE userdata SET nextexpcurve = ${150} WHERE userId = ${message.author.id}`);
                sql.run(`UPDATE userdata SET level = ${0} WHERE userId = ${message.author.id}`);

            })

        message.delete(2000);
        return message.channel.send(`👌`).then((msg) => {
            msg.delete(3000);
        })
    }
}

module.exports.help = {
    start: resetLvl,
    name:"reset-lvl",
    aliases: [">reset_lvl"],
    description: `resets your level`,
    usage: `${require(`../../.data/environment.json`).prefix}>reset_lvl`,
    group: "Admin",
    public: true,
    require_usermetadata: true,
    multi_user: true
}