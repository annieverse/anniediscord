const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, command, message, args, utils) => {


if(env.dev && !env.administrator_id.includes(message.author.id))return;

const user = message.author;



async function reset() {

    const sql = require('sqlite');
    sql.open('.data/database.sqlite');
    sql.run(`DELETE FROM userinventories WHERE userId = "${user.id}"`);
    await utils.pause(500);
    sql.run(`INSERT INTO userinventories (userId) VALUES ("${user.id}")`);
    await utils.pause(500);


    console.log(`${user.tag} inventory has been wiped out.`)
    return message.channel.send(`${utils.emoji(`aausugoi`,bot)} your inventory has been wiped out-`)
            .then(async msg => {
                await utils.pause(3000);
                msg.delete();
    })
}

return message.member.roles.find(r => r.name === 'Creators Council') ? reset() : null

}

module.exports.help = {
    name: "_resetinventory",
    aliases: [],
    description: `resets your inventory`,
    usage: `${prefix}_resetinventory`,
    group: "Admin",
    public: true,
}