
const Discord = require("discord.js");
const botconfig = require(`../botconfig.json`);
const palette = require(`../colorset.json`);

module.exports.run = async(bot,command, message,args)=>{

  function fileAliasesCheck(file) {
    const src = require(`./${file}`)
    return src.help.name;
  };

  let user = message.mentions.users.first();
  
  const challengequestion = new Discord.RichEmbed()
  .setDescription(`${user} has issued a challenge, do you accept?`);
  
  message.channel.send(challengequestion);
  
  const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 20000 });
        //console.log(collector)
        collector.on('collect', message => {
          let argsUpperCased = message.content.toUpperCase;
          
          if (argsUpperCased === "YES"){
            
          }else if (argsUpperCased === "NO"){
                      
          }
                   
          message.channel.send(`The chosen theme for this duel is...***`);
        });
  
}//end of module.exports.run

module.exports.help = {
        name:"challenge",
        aliases:[]
}