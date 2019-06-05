const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, command, message) => {

if(env.dev && !env.administrator_id.includes(message.author.id))return;

  
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