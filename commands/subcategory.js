const Discord = require("discord.js");
const botconfig = require(`../botconfig.json`);
const palette = require(`../colorset.json`);
var fs = require('fs');
var contents = fs.readFileSync("challengelist.json","utf8");
var content = require("../challengelist.json");
const sql = require("sqlite");

module.exports.run = async(bot, command, message,args)=>{

const env = require(`../utils/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

  function fileAliasesCheck(file) {
    const src = require(`./${file}`)
    return src.help.name;
  };

  
  let argsUpperCased = (args.join(" ").trim()).toUpperCase();
  if (argsUpperCased.length === 0) return message.channel.send("Please provide a category");
  
  
  let name = "name";
  let sub = "sub";
  var length = 0;
 
  if ("MONSTER".includes(argsUpperCased)){
    var category = content.MONSTER;
    length = category.length;
  }else if ("CHALLENGES".includes(argsUpperCased)){
    var category = content.CHALLENGES;
    length = category.length;
  }else if ("ENVIRONMENT".includes(argsUpperCased)){
    var category = content.ENVIRONMENT;
    length = category.length;
  }else if ("THEMES".includes(argsUpperCased)){
    var category = content.THEMES;
    length = category.length;
  }else if ("PERSONIFICATION".includes(argsUpperCased)){
    var category = content.PERSONIFICATION;
    length = category.length;
  }else if ("ANIME".includes(argsUpperCased)){
    var category = content.ANIME;
    length = category.length;
  }else if ("EMOTION/MOOD".includes(argsUpperCased)){
    var category = content.EMOTION_MOOD;
    length = category.length;
  }else if ("TIME PERIOD".includes(argsUpperCased)){
    var category = content.TIME_PERIOD;
    length = category.length;
  }
  
  let itemName = category[0].name;
  let subItems = '';
  
  for(var y = 1; y< length; y++){
    if (category[y].sub != undefined){
        subItems += category[y].sub+`\n`;
    } 
  }
  
  let bicon = bot.user.displayAvatarURL;
  let embed1 = new Discord.RichEmbed();
  
  
  embed1.setColor(palette.black);
  embed1.setDescription("Category is ***"+`${itemName}*** :\n`+subItems);

  message.channel.send(embed1);
  
} //end of module.exports.run

module.exports.help = {
        name:"sub",
        aliases:[]
}