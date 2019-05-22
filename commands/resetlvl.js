const ranksManager = require('../utils/ranksManager');
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot, command, message)=>{

const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

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
    module.exports.help = {
        name:"reset_lvl",
        aliases:[]
    }