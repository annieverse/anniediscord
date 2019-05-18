const Discord = require("discord.js");
const palette = require('../colorset.json');
var fs = require('fs');
var contents = fs.readFileSync("challengelist.json","utf8");
var content = require("../challengelist.json");


module.exports.run = async(bot,command, message,args)=>{

  function fileAliasesCheck(file) {
    const src = require(`./${file}`)
    return src.help.name;
  };

const env = require(`../utils/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

  const battlechoice = new Discord.RichEmbed()
    .setColor(palette.halloween)
    .setDescription("List of art challenges, please choose one.\n"+
                   "you can view their sub-category by typing >sub{category name}\n\n"+
                   "20 seconds to type the category, you wish the theme to be.\n\n"+
                   "-Monster\n\n"+
                   "-Challenges\n\n"+
                   "-Enviroment\n\n"+
                   "-Themes\n\n"+
                   "-Personification\n\n"+
                   "-Anime\n\n"+
                   "-Emotion/Mood\n\n"+
                   "-Time Period");
  
  
  message.channel.send(battlechoice);
  const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 20000 });
        //console.log(collector)
        collector.on('collect', message => {
          let argsUpperCased = message.content.toUpperCase();
          function getRndInteger(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
          }
          
          let randomNum = 0;
          
          if ("MONSTER".includes(argsUpperCased)){
            var category = content.MONSTER;
            randomNum = category.length;
          }else if ("CHALLENGES".includes(argsUpperCased)){
            var category = content.CHALLENGES;
            randomNum = category.length;
          }else if ("ENVIRONMENT".includes(argsUpperCased)){
            var category = content.ENVIRONMENT;
            randomNum = category.length;
          }else if ("THEMES".includes(argsUpperCased)){
            var category = content.THEMES;
            randomNum = category.length;
          }else if ("PERSONIFICATION".includes(argsUpperCased)){
            var category = content.PERSONIFICATION;
            randomNum = category.length;
          }else if ("ANIME".includes(argsUpperCased)){
            var category = content.ANIME;
            randomNum = category.length;
          }else if ("EMOTION/MOOD".includes(argsUpperCased)){
            var category = content.EMOTION_MOOD;
            randomNum = category.length;
          }else if ("TIME PERIOD".includes(argsUpperCased)){
            var category = content.TIME_PERIOD;
            randomNum = category.length;
          }
          
          let name = "name";
          let sub = "sub";
          
          let subItem = '';

          
          let y = getRndInteger(1,randomNum);
          console.log(y);
          subItem = category[y+1].sub;
          
          message.channel.send(`The chosen theme for this duel is...***${subItem}!***`);
        })
  
  
}//module.exports.run

module.exports.help = {
        name:"art.ch",
        aliases:[]
}