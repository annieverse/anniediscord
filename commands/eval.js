const Discord = require('discord.js');
const palette = require('../colorset.json');
const cards = require('../utils/cards-metadata.json');
const ms = require('parse-ms');
const moment = require('moment');
const sql = require("sqlite");
sql.open(".data/database.sqlite");
let func = require(`../utils/functions.js`);

exports.run = async (bot,command, message, args) => {


const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

const argsx = message.content.split(" ").slice(1);
let evembed = new Discord.RichEmbed();
const usercon = message.author.displayAvatarURL;

evembed.setColor(palette.red)
evembed.setDescription(`Uhm sorry, you don't have authorization to access it.`)
evembed.setFooter(`${message.author.username} | Developer Mode`, usercon)
if(!message.member.roles.find(r => r.name === 'Developer Team'))return message.channel.send(evembed)


const clean = (text) => {
  if (typeof(text) === "string")
    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
  else
      return text;
}
    try {
      const code = argsx.join(" ");
      let evaled = eval(code);
      
      if (typeof evaled !== "string")
        evaled = require("util").inspect(evaled);

      
      let evaltest = evaled;
      //pages(message,evaltest);

      if(evaled.length >= 2000)
        evaled = evaled.slice(0, 1999);
      

      evembed.setColor(palette.halloween)
      func.evalpages(message, evaltest,evembed);
      //evembed.setDescription(`**Output**\n\`\`\`autohotkey\n${clean(evaled)}\n\`\`\``)
      //message.channel.send(evembed);

    } catch (err) {

      
      evembed.setColor(palette.darkmatte)
      func.evalpages(message, err,evembed);
      //evembed.setDescription(`**Output**\n\`\`\`autohotkey\n${clean(err)}\n\`\`\``)
      //message.channel.send(evembed);

    }
};

exports.help = {
  name: "eval",
        aliases:[]
}