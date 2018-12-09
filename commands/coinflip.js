const Discord = require('discord.js');
const palette = require('../colorset.json');

module.exports.run = async(bot,command,message,args)=>{
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
module.exports.help={
    name:"flipcoin",
        aliases:[]
}