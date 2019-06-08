const Discord = require("discord.js");
var content = require("../../utils/challengelist.json");


module.exports.run = async (...ArrayStacks) => {

  
  let argsUpperCased = (args.join(" ").trim()).toUpperCase();
  if (argsUpperCased.length === 0) return message.channel.send("Please provide a category");
  
  
  var length = 0;
  let category;
 
  if ("MONSTER".includes(argsUpperCased)){
    category = content.MONSTER;
    length = category.length;
  }else if ("CHALLENGES".includes(argsUpperCased)){
    category = content.CHALLENGES;
    length = category.length;
  }else if ("ENVIRONMENT".includes(argsUpperCased)){
    category = content.ENVIRONMENT;
    length = category.length;
  }else if ("THEMES".includes(argsUpperCased)){
    category = content.THEMES;
    length = category.length;
  }else if ("PERSONIFICATION".includes(argsUpperCased)){
    category = content.PERSONIFICATION;
    length = category.length;
  }else if ("ANIME".includes(argsUpperCased)){
    category = content.ANIME;
    length = category.length;
  }else if ("EMOTION/MOOD".includes(argsUpperCased)){
    category = content.EMOTION_MOOD;
    length = category.length;
  }else if ("TIME PERIOD".includes(argsUpperCased)){
    category = content.TIME_PERIOD;
    length = category.length;
  }
  
  let itemName = category[0].name;
  let subItems = '';
  
  for(var y = 1; y< length; y++){
    if (category[y].sub != undefined){
        subItems += category[y].sub+`\n`;
    } 
  }
  
  let embed1 = new Discord.RichEmbed();
  
  
  embed1.setColor(palette.black);
  embed1.setDescription("Category is ***"+`${itemName}*** :\n`+subItems);

  message.channel.send(embed1);
  
} //end of module.exports.run

module.exports.help = {
  name:"sub",
  aliases: [],
  description: `Shows the themes for a category`,
  usage: `>sub <category>`,
  group: "General",
  public: false,
}