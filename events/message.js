const Discord = require('discord.js');
const sql = require("sqlite");
const config = require("../prefix.json");
sql.open(".data/database.sqlite");
const palette = require(`../colorset.json`);
const env = require(`../utils/environment.json`);

module.exports = (bot,message) => {

  if(message.author.bot)return;
/*
  if(message.content.startsWith('>') 
    && ["bot", "games", "cmds"].includes(message.channel.name)
    && !message.member.roles.find(r => r.name === 'Loyal white cat'))return message.channel.send('**Annie is currently under-maintenance. We apologize for the inconvenience this may bring.**');
*/
let prefix;
  if (env.dev === true){
    prefix = env.prefix;
  }else{
    prefix = config.prefix;
  }
      let messageArray = message.content.split(" ");
      let cmd = messageArray[0];
      let args = messageArray.slice(1);
      let command = cmd.slice(prefix.length);
      let commandfile = bot.commands.get(cmd.slice(prefix.length)) || bot.commands.get(bot.aliases.get(cmd.slice(prefix.length)));

      if (!message.content.startsWith(prefix))return;
      if (commandfile) commandfile.run(bot,command,message,args);
}