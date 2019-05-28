const Discord = require("discord.js");
const palette = require(`../colorset.json`);
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

    

    if(x.count===1){
      // Do Code Here
      let attachment = rmsg.attachments.first().url;

      //let fileSize = rmsg.attachments.first().filesize;
      //let fileSizelimit = 8000000;

      let embed = new Discord.RichEmbed()
        .setImage(attachment)
        .setAuthor(rmsg.author.tag, rmsg.author.avatarURL)
        .setColor(palette.darkmatte)
        .setFooter(rmsg.id);

        /*  //Pan Version: 4 Messages (ID / Embed / LB / LB)
         *
         *  favoritechannel.send(`Record number: ${rmsg.id}`).then(await favoritechannel.send(embed)).then(favoritechannel.send(`_ _`).then(favoritechannel.send(`_ _`)));
         *  favoritechannel.send(`${rmsg.author}`).then(msg=>msg.delete());
         */

        //Fwubbles Version: 1 Embed Message (ID in footer)
        favoritechannel.send(embed);
        favoritechannel.send(`${rmsg.author}`).then(msg=>msg.delete());      
    }
  }
  
}