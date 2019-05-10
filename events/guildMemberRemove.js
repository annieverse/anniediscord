const Discord = require("discord.js");
const formatManager = require('../utils/formatManager');

module.exports = (bot,member) => {
  // "I've tweaked the interface for server stats. -naphnaphz / 12.01.18"
  let members = member.guild.memberCount;
  let botSize = member.guild.members.filter(a => a.user.bot).size;
  let userSize = members - botSize;
  const configFormat = new formatManager();

  let memberCountUpdate = bot.channels.get(`518245560239652867`);
  memberCountUpdate.setName(`${configFormat.threeDigitsComa(userSize)} members!`);
}