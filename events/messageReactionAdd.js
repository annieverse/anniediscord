const Discord = require("discord.js");
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports = async (bot, reaction, user) => {

  //  I changed the structure for readability. -naphnaphz.


  //  Centralized Object.
  let metadata = {
      art_channels: [
        "459892609838481408",
        "459893040753016872",
        "460439050445258752",
        "461926519976230922",
        "460615254553001994",
        "538806382779170826",
        "565308091424571422"
      ],
      featured_channel: bot.channels.get("581642059090362368"),
  }

  const rmsg = reaction.message;
  const member = await rmsg.guild.fetchMember(user);
  

  //  Core processes
  const main = async () => {
    let filtered_reaction = rmsg.reactions.filter(reaction => reaction.emoji.name == "⭐").first();


    //  Returns preview url if the user shared post from social media.
    //  Else, get attachment's url.
    const get_attachment = () => {
      return rmsg.attachments.first().url ?  rmsg.attachments.first().url : rmsg.embeds.proxyURL;
    }

    console.log(`hoi its here!` + filtered_reaction);

    if(filtered_reaction.count === 1){

      let attachment = get_attachment();

      //let fileSize = rmsg.attachments.first().filesize;
      //let fileSizelimit = 8000000;

      let embed = new Discord.RichEmbed()
        .setImage(attachment)
        .setAuthor(rmsg.author.tag, rmsg.author.avatarURL)
        .setColor(palette.darkmatte)
        .setTimestamp()
        .setFooter(rmsg.id);

        /*  //Pan Version: 4 Messages (ID / Embed / LB / LB)
         *
         *  favoritechannel.send(`Record number: ${rmsg.id}`).then(await favoritechannel.send(embed)).then(favoritechannel.send(`_ _`).then(favoritechannel.send(`_ _`)));
         *  favoritechannel.send(`${rmsg.author}`).then(msg=>msg.delete());
         */

        //Fwubbles Version: 1 Embed Message (ID in footer)
        metadata.featured_channel.send(embed);
        //metadata.featured_channel.send(`${rmsg.author}`).then(msg=>msg.delete());      
    }

  }


  //  Initialize
  const run = async () => {

    //  Returns if user is bot.
    if(user.bot)return;


    //  Make sure its not bots id
    if(rmsg.author.id =='514688969355821077')return;


    //  Returns if the react is not a star or the channel is not listed in arts channels.
    //  change rmsg.channel.id == "530223957534703636" for the art channels
    if(reaction.emoji.name !== "⭐" && !metadata.art_channels.includes(rmsg.channel.id))return;

    main();

  }

  run();
}