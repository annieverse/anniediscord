
const Discord = require("discord.js");
const botconfig = require(`../botconfig.json`);
const palette = require(`../colorset.json`);



module.exports.run = async(bot,command, message,args)=>{

    
  function fileAliasesCheck(file) {
    const src = require(`./${file}`);
    return src.help.name;
  };

  let user = message.mentions.users.first();
  
  if (args.length === 0){
      message.channel.send(`Please specify, ether ${botconfig.prefix}clanadmin +1 @clan to award a point, or ${botconfig.prefix}clanadmin winner @clan`);
  }
  
  if (args[0] === "+1"){
    message.channel.send("+1");
  }else if (args[0] === "winner"){
    message.channel.send(`Congratulations to @clan, Your clan has received amount of <amount>`);
  }
  
}//end of module.exports.run

module.exports.help = {
        name:"clanadmin",
        aliases:[]
}