const env = require(`../.data/environment.json`);
const ranksManager = require('../utils/ranksManager');
const formatManager = require('../utils/formatManager');
const palette = require('../colorset.json');
const Discord = require("discord.js");
const moment = require('moment')
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports = (bot, message) => {

  if(message.author.bot) return;
  if(message.channel.type ==='dm')return;

  const manager = new ranksManager(bot, message)
  const format = new formatManager(message)


  if(!env.dev) {
    artChannelsFilter();
    eventChannelFilter();
    portfolioRequest();  
  }


  //  Returns true if message has an attachment.
  function attachmentCheck() {
    try {
      return message.attachments.first().id ? true : null
    } catch (e) {
      return false
    }
  }


  //  Registering custom  portfolio.
  function portfolioRequest() {
    if (message.content.includes(`#myportfolio`) && attachmentCheck()) {
      let user = {
        img: message.attachments.first().url,
        id: message.author.id,
        tag: message.author.tag,
        loc: message.channel.name,
        date: Date.now()
      };
      message.react(`✅`);
      sql.run(`INSERT INTO userartworks (userId, url, timestamp, location) VALUES (?, ?, ?, ?)`, [user.id, user.img, user.date, user.loc])
      return console.log(`${user.tag} has submitted "${user.img}" through #myportfolio in ${user.loc}.`)
    }
  }


  //  Register submitted image in art channels
  //  As portfolio.
  function artChannelsFilter() {

    const artchannels = [
      "459892609838481408",
      "459893040753016872",
      "460439050445258752",
      "461926519976230922",
      "460615254553001994",
      "538806382779170826",
      "565308091424571422",
    ];

    if (artchannels.includes(message.channel.id) && attachmentCheck() && !message.content.includes(`#myportfolio`)) {
      let img = message.attachments.first();
      message.react('⭐')
      sql.run(`INSERT INTO userartworks (userId, url, timestamp, location) VALUES (?, ?, ?, ?)`, [message.author.id, img.url, Date.now(), message.channel.name])
      return console.log(`${message.author.tag} has submitted "${img.filename}" in ${message.channel.name}.`)
    }
  }


  //  Check if message is event-submission.
  function eventChannelFilter() {
    let submissionchannel = bot.channels.get('460615254553001994');
    let eventchannel = bot.channels.get('460615157056405505');
    if (message.channel.id === submissionchannel.id && attachmentCheck()) {
      let role = manager.getRoles('Event Participant');
      let user = message.guild.member(message.author.id);
      user.removeRole(role)

      let embed = new Discord.RichEmbed()
        .setColor(palette.golden)
        .setTimestamp(Date.now())
        .setDescription(`**${message.author.username}** has submitted some work! <:AnnieHype:523196958882529280>`)
      return eventchannel.send(embed);
    }
  }


  let prefix = env.prefix;
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0].toLowerCase();
  let args = messageArray.slice(1);
  let command = cmd.slice(prefix.length);
  let commandfile = bot.commands.get(cmd.slice(prefix.length)) || bot.commands.get(bot.aliases.get(cmd.slice(prefix.length)));
  let utils = require(`../utils/functions.js`);
  if (!message.content.startsWith(prefix)) return;
  if (commandfile) commandfile.run(bot, command, message, args,utils);
}