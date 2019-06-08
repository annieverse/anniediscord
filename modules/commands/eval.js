const Discord = require('discord.js');
const sql = require("sqlite");
sql.open(".data/database.sqlite");


module.exports.run = async (bot, command, message, args, utils) => {




const argsx = message.content.split(" ").slice(1);
let evembed = new Discord.RichEmbed();
const usercon = message.author.displayAvatarURL;

evembed.setColor(palette.red)
evembed.setDescription(`Uhm sorry, you don't have authorization to access it.`)
evembed.setFooter(`${message.author.username} | Developer Mode`, usercon)
if(!message.member.roles.find(r => r.name === 'Developer Team'))return message.channel.send(evembed)


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
      utils.evalpages(message, evaltest,evembed);
      //evembed.setDescription(`**Output**\n\`\`\`autohotkey\n${clean(evaled)}\n\`\`\``)
      //message.channel.send(evembed);

    } catch (err) {

      
      evembed.setColor(palette.darkmatte)
      utils.evalpages(message, err,evembed);
      //evembed.setDescription(`**Output**\n\`\`\`autohotkey\n${clean(err)}\n\`\`\``)
      //message.channel.send(evembed);

    }
};

module.exports.help = {
  name: "eval",
  aliases: [],
  description: `evalutes a line of code`,
  usage: `>eval <what you want to test>`,
  group: "Admin",
  public: true,
}