const Discord = require("discord.js");
const palette = require('../colorset.json');
const ranksManager = require('../utils/ranksManager.js');
const sql = require('sqlite');
sql.open('.data/database.sqlite');
const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, command, message, args, utils) => {


if(env.dev && !env.administrator_id.includes(message.author.id))return;

return console.log(`function disabled.`);

function get() {
  return sql.all(`SELECT userId, level FROM userdata`).then(async alldata => alldata);
}

let manager = new ranksManager(bot, message);
let data = await get();
let unknownIDs = 0;
let successfulIDs = 0;

message.channel.send(`transfering **${data.length}** ranks`);
for(let i in data) {
  try {

    let parsedrank_object = await manager.ranksCheck(data[i].level).rank;
    let parsedrank = manager.ranksCheck(data[i].level).title;
    let parsedname = bot.users.get(data[i].userId).tag;
    
      message.guild.member(data[i].userId).addRole(parsedrank_object);
      await utils.pause(1000);
      console.log(`${parsedname} with ${parsedrank} (lv ${data[i].level})`)    
      successfulIDs++
  }
  catch(e) {
    unknownIDs++
    console.log(`Error occured. Cannot read ID ${data[i].userId}`)
  }
}

message.channel.send(`y:${successfulIDs} n:${unknownIDs}`);

}
module.exports.help = {
	name: "_migrate",
  aliases: [],
  description: `migrates user data`,
  usage: `${prefix}_migrate`,
  group: "Admin",
  public: false,
}