const Discord = require("discord.js");
exports.run = async (bot,command, message, args) => {

const user = message.author;
function emoji(name) {
    return bot.emojis.find(e => e.name === name)
}

function pause(ms) {
  return new Promise(resolve => setTimeout(resolve,ms));
}


async function reset() {

    const sql = require('sqlite');
    sql.open('.data/database.sqlite');
    sql.run(`DELETE FROM userinventories WHERE userId = "${user.id}"`);
    await pause(500);
    sql.run(`INSERT INTO userinventories (userId) VALUES ("${user.id}")`);
    await pause(500);


    console.log(`${user.tag} inventory has been wiped out.`)
    return message.channel.send(`${emoji(`aausugoi`)} your inventory has been wiped out-`)
            .then(async msg => {
                await pause(3000);
                msg.delete();
    })
}

return message.member.roles.find(r => r.name === 'Creators Council') ? reset() : null

}

exports.help = {
  name: "_resetinventory",
        aliases:[]
}