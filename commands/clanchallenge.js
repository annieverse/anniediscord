
const Discord = require("discord.js");
const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, command, message) => {

/*
  Lorn term down the road check docs
*/

if(env.dev && !env.administrator_id.includes(message.author.id))return;


  let user = message.mentions.users.first();
  
  const challengequestion = new Discord.RichEmbed()
  .setDescription(`${user} has issued a challenge, do you accept?`);
  
  message.channel.send(challengequestion);
  
  const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 20000 });
        //console.log(collector)
        collector.on('collect', message => {
                   
          message.channel.send(`The chosen theme for this duel is...***`);
        });
  
}//end of module.exports.run

module.exports.help = {
  name:"challenge",
  aliases: [],
  description: `choose a random theme for an art duel`,
  usage: `${prefix}challenge @clan`,
  group: "General",
  public: false,
}