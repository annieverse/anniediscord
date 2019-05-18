const Discord = require("discord.js");
const palette = require(`../colorset.json`);
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot,command, message,args)=>{

const env = require(`../utils/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

  function fileAliasesCheck(file) {
    const src = require(`./${file}`)
    return src.help.name;
  };
  
  let bicon = bot.user.displayAvatarURL;
  let admEmbed = new Discord.RichEmbed();
    admEmbed.setColor(palette.red)
    admEmbed.setDescription(`You don't have authorization to use this command.`)
  //if(!message.member.hasPermission("ADMINISTRATOR")|| message.author.id === "277266191540551680")return message.channel.send(admEmbed);
  

  var clanName = "";
  var clanLeader = "";
  
  
  const clanSetUp = new Discord.RichEmbed()
    .setColor(palette.halloween)
    .setDescription("Thank you for creating a new clan but a few things are required to complete the process:"
                   +"\nClan name"
                   +"\nClan Leader"
                   +"\nPlease type the Clan Leader first, then the Clan Name.");
  
  
  message.channel.send(clanSetUp);
  
  
  
  const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 20000 });
        //console.log(collector)
        collector.on('collect', message => {
          clanLeader = message.guild.member(message.mentions.users.first());
          clanName = message.content.slice(23);
          
          console.log("clanName: "+`${clanName}`);
          console.log("clanLeader: "+`${clanLeader.id}`);
          
          sql.get(`SELECT * FROM clandata WHERE userId ="${clanLeader.id}"`).then(async clanrow => {
            if (!clanrow){
              sql.run(`INSERT INTO clandata (userId, clanname, admin, clancoins, clanpoints, dual, dualwith, winner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [clanLeader.id, clanName, true, 0, 0, null, null, null]);
              message.channel.send(`New clan created named: ***${clanName}*** with ${clanLeader} as their fearless leader!000`);
              collector.off;
            }else{
              sql.run(`UPDATE clandata SET clanname = ${clanrow.clanname.replace(clanrow.clanname,clanName)} WHERE userId = ${clanLeader.id}`);
              sql.run(`UPDATE clandata SET admin = "true" WHERE userId = ${clanLeader.id}`);
              message.channel.send(`New clan created named: ***${clanName}*** with ${clanLeader} as their fearless leader!111`);
              collector.off;
            }
          });
          
          //message.channel.send(`New clan created named: ***${clanName}*** with ${clanLeader} as their fearless leader!`);
          collector.off;
          });
  
}//end of module.exports.run

module.exports.help = {
        name:"addclan",
        aliases:[]
}