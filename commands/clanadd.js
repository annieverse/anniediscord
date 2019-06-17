const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, command, message) => {

if(env.dev && !env.administrator_id.includes(message.author.id))return;

}//end of module.exports.run

module.exports.help = {
  name:"createclan",
  aliases: [],
  description: `create a clan`,
  usage: `${prefix}createclan`,
  group: "General",
  public: false,
}
