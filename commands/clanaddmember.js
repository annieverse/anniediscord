const Discord = require('discord.js');
const botconfig = require(`../botconfig.json`);
const palette = require(`../colorset.json`);
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot,command, message,args)=>{

  function fileAliasesCheck(file) {
    const src = require(`./${file}`)
    return src.help.name;
  };

  let bicon = bot.user.displayAvatarURL;
  let admEmbed = new Discord.RichEmbed();
    admEmbed.setColor(palette.red)
    admEmbed.setDescription(`You don't have authorization to use this command.`)
    admEmbed.setFooter(`Anime Artist United | Admin Help Section`, bicon)
  if(!message.member.hasPermission("ADMINISTRATOR")|| !message.author.id === "277266191540551680")return message.channel.send(admEmbed);
  
  let clanMember = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
  let clanName = "";
  
  const clanSetUp = new Discord.RichEmbed()
    .setColor(palette.halloween)
    .setDescription("Thank you for @ this user but a few things are requirred to complete this process:"
                   +"\nClan name"
                   +"\nPlease type the Clan Name.");
  const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 20000 });
        //console.log(collector)
        collector.on('collect', message => {
          let messageArray = message.content.split(" ");
          clanName = messageArray.join();
          
          console.log("clanMember: "+clanMember);
          console.log("clanName: "+clanName);
          
          sql.get(`SELECT * FROM clandata`).then(async clanrow => {
            if (!clanrow){
              sql.run(`INSERT INTO clandata (userId, clanname, admin, clancoins, clanpoints, dual, dualwith, winner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                      [clanMember.id, clanName, false, 0, 0, null, null, null]);
            }else{
              sql.run(`UPDATE clandata SET clanname = clanName WHERE userId = clanMember.id`);
              sql.run(`UPDATE clandata SET admin = false WHERE userId = clanMember.id`);
            }
            });
          message.channel.send(`New clan member named: ${clanMember} has Joined ***${clanName}*** as their newest fearless member!`);
          collector.off;
        });
  
  
  message.channel.send(clanSetUp);
  
}//end of module.exports.run

module.exports.help = {
        name:"addcmem",
        aliases:["addclanmember"]
}