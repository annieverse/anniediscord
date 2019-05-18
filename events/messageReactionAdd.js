const Discord = require("discord.js");
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports = async (bot, reaction, user) => {
  let roleSelectChannel = bot.channels.get("394028044752519169");
    const rmsg = reaction.message;
    const member = await rmsg.guild.fetchMember(user);
    function getRoles(r) {
      const guild = bot.guilds.get("394012320617070602");
      const role = guild.roles.find(n => n.name === r);
      return role;
    }
  
    function getEmoji(e){
      if (typeof e == "string"){
        return bot.emojis.find(emoji => emoji.name === e);
      }else{
        return e; 
      }
    }
  
  if(user.bot)return;
  
  if(reaction.emoji.name == "☑" && rmsg.channel.id == "530223957534703636"){//emoji, game select, region select, report channel
    let user_Id = rmsg.content.slice(16,35);
    console.log(`Report for: `+user_Id)
    sql.get(`SELECT * FROM reportlog WHERE userId=${user_Id}`).then(async reportlogrow => {
      if(!reportlogrow){
        sql.run(`INSERT INTO reportlog (userId, count) VALUES (?,?)`,
            [user_Id, 1]);
      }else{
        sql.run(`UPDATE reportlog SET count=${reportlogrow.count}+1 WHERE userId=${user_Id}`);
      }
    })
    rmsg.clearReactions();
  }
  
}