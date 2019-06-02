const Discord = require("discord.js");
module.exports.run = async (bot, command, message, args, utils) => {

const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

const user = message.author;
function emoji(name) {
    return bot.emojis.find(e => e.name === name)
}


async function reset() {

    const sql = require('sqlite');
    sql.open('.data/database.sqlite');
    sql.run(`DELETE FROM userinventories WHERE userId = "${user.id}"`);
    await utils.pause(500);
    sql.run(`INSERT INTO userinventories (userId) VALUES ("${user.id}")`);
    await utils.pause(500);


    console.log(`${user.tag} inventory has been wiped out.`)
    return message.channel.send(`${emoji(`aausugoi`)} your inventory has been wiped out-`)
            .then(async msg => {
                await utils.pause(3000);
                msg.delete();
    })
}

return message.member.roles.find(r => r.name === 'Creators Council') ? reset() : null

}

exports.help = {
  name: "_resetinventory",
        aliases:[]
}