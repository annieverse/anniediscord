const Discord = require("discord.js");
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports = async (bot, reaction, user) => {

  let favoritechannel = bot.channels.get("581642059090362368"); // channel the image is sent to

  const rmsg = reaction.message;
  const member = await rmsg.guild.fetchMember(user);
  
  if(user.bot)return;

  const artChannels = [
    "459892609838481408",
    "459893040753016872",
    "460439050445258752",
    "461926519976230922",
    "460615254553001994",
    "538806382779170826",
    "565308091424571422"];

  if (reaction.emoji.name == "⭐" && artChannels.includes(rmsg.channel.id)) { // change rmsg.channel.id == "530223957534703636" for the art channels
    let x = rmsg.reactions.filter(reaction => reaction.emoji.name == "⭐").first();
    if (rmsg.author.id =='514688969355821077')return;//make sure its not bots id

    if(x.count===3){
      // Do Code Here
      let attachment = rmsg.attachments.first().url;
      let fileSize = rmsg.attachments.first().filesize;
      let fileSizelimit = 8000000;
      if (fileSize>fileSizelimit){
        favoritechannel.send(attachment);
      }else{
        favoritechannel.send(attachment)
      }
      
      
    }
  }
  
}