const Discord = require('discord.js');
const palette = require('../colorset.json');
const formatManager = require('../utils/formatManager.js');

module.exports.run = async(bot,command,message,args)=>{

const env = require(`../utils/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

const format = new formatManager(message);
return ["bot", "bot-games", "cmds"].includes(message.channel.name) ? initFlipCoin()
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)


async function initFlipCoin() {
  function doRandHT() {
    var rand = ['The coin landed on **Heads**!','The coin landed on **Tails**!'];

    return rand[Math.floor(Math.random()*rand.length)];
  }

   const embed = new Discord.RichEmbed()
    .setTitle(`**Coinflip Result**`)
    .setDescription(doRandHT())
    .setColor(palette.darkmatte)

  return message.channel.send(embed);
}
}
module.exports.help={
    name:"flipcoin",
        aliases:[]
}