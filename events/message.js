const Discord = require('discord.js');
const sql = require("sqlite");
sql.open(".data/database.sqlite");
const palette = require(`../colorset.json`);
const botconfig = require('../botconfig.json');
const ranksManager = require('../utils/ranksManager');


module.exports = (bot,message) => {

  if(message.author.bot)return;

  /*
      *   @Embed Template function
      *   when im too lazy to declare rich embed, just write this.
  */

  function embedTemplate(color, content)
           {
              let embed = new Discord.RichEmbed()
                  .setColor(color)
                  .setDescription(content)

                  message.channel.send(embed)
          };



  /*
      *   @Embed Template function v2
      *   same as above, just added delay time before it sends.
  */

  function embedExecutionDelay(delayTime, color, content)
           {
                  setTimeout(function () {
                      embedTemplate(color, content);
                  }, delayTime);
          };





  let responseArr = [
      `Nice to meet you **${message.author.username}**.`,
      `awooooooo`,
      `Yes? my prefix is ${botconfig.prefix}`,
      `Hello there!`,
      `awooooooo`,
      `Do you need any help? please type **>help.**`,
      `awooooooo`,
      `Hello **${message.author.username}**! my prefix is \`${botconfig.prefix}\``,
      `awooooooo`,
      `Hewo **${message.author.username}**, don't forget to take your dailies!`
  ]


  let randomizedResponseArr = responseArr[Math.floor(Math.random () * responseArr.length)];


  if(message.content.startsWith('(╯°□°）╯︵ ┻━┻'))return message.channel.send('┬─┬ ノ( ゜-゜ノ)');
  if(message.content.startsWith('┬─┬ ノ( ゜-゜ノ)'))return message.channel.send('(╯°□°）╯︵ ┻━┻');
  if(message.channel.type ==='dm')return;

  let submissionchannel = bot.channels.get('460615254553001994');
  let eventchannel = bot.channels.get('460615157056405505');
  const manager = new ranksManager()
  if(message.channel.id === submissionchannel.id){
     let role = manager.getRoles('Event Participant');
     let user = message.guild.member(message.author.id);
     let bicon = bot.user.displayAvatarURL;
     user.removeRole(role)
    
     let embed = new Discord.RichEmbed()
     .setColor(palette.golden)
     .setTimestamp(Date.now())
     .setTitle(`Entry for Event`)
     .setDescription(`**${message.author.username}**, has submitted some work!`)
     .setFooter(`Anime Artist United | Entry Submitted`, bicon);
    eventchannel.send(embed);
     
  }

  const mentionInvoke = message.isMentioned(bot.user);
  if(mentionInvoke) {
      message.channel.startTyping();
      embedExecutionDelay(500, palette.halloween, randomizedResponseArr);
      return message.channel.stopTyping();
  }

      let prefix = botconfig.prefix;
      let messageArray = message.content.split(" ");
      let cmd = messageArray[0];
      let args = messageArray.slice(1);
      let command = cmd.slice(prefix.length);
      let commandfile = bot.commands.get(cmd.slice(prefix.length)) || bot.commands.get(bot.aliases.get(cmd.slice(prefix.length)));

      if (!message.content.startsWith(botconfig.prefix))return;
      if (commandfile) commandfile.run(bot,command,message,args);
}