const Discord = require('discord.js');
const formatManager = require('../../utils/formatManager.js');

class Coinflip {
  constructor(Stacks) {
    this.utils = Stacks.utils;
    this.message = Stacks.message;
    this.args = Stacks.args;
    this.palette = Stacks.palette;
    this.stacks = Stacks;
  }

  async execute() {
    let message = this.message;
    let palette = this.stacks.palette;
    const format = new formatManager(message);
    return ["bot", "bot-games", "cmds", "sandbox"].includes(message.channel.name) ? initFlipCoin()
      : format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)


    async function initFlipCoin() {
      function doRandHT() {
        var rand = ['The coin landed on **Heads**!', 'The coin landed on **Tails**!'];

        return rand[Math.floor(Math.random() * rand.length)];
      }

      const embed = new Discord.RichEmbed()
        .setTitle(`**Coinflip Result**`)
        .setDescription(doRandHT())
        .setColor(palette.darkmatte)

      return message.channel.send(embed);
    }
  }
}
module.exports.help={
  start: Coinflip,
  name:"coinflip",
  aliases: ["cf"],
  description: `filps a coin for heads or tails`,
  usage: `>filpcoin`,
  group: "Fun",
  public: true,
  require_usermetadata: false,
  multi_user: false
}