/*
 *This is only a template, easy to pull from when making a new command
 *
 */


const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, command, message, args, utils) => {

if(env.dev && !env.administrator_id.includes(message.author.id))return;


}//end of module.exports.run

module.exports.help = {
  name:"TemplateCommand",
  aliases: [],
  description: `No function just a place holder for commands`,
  usage: `${prefix}TemplateCommand`,
  group: "Admin",
  public: false,
}