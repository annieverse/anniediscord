const Discord = require("discord.js");
const palette = require(`../colorset.json`);
const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, command, message, args, utils) => {

if(env.dev && !env.administrator_id.includes(message.author.id))return;

  function fileAliasesCheck(file) {
    const src = require(`./${file}`)
    return src.help.name;
  };
  
  message.channel.send("This command is not yet created and/or finished quite yet");

}//end of module.exports.run

module.exports.help = {
  name:"cclantoken",
  aliases: [],
  description: `converts AC into AC`,
  usage: `${prefix}cclantoken <amount>`,
  group: "General",
  public: false,
}