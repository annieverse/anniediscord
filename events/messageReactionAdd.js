const Discord = require("discord.js");
const palette = require(`../colorset.json`);

module.exports = async (bot, reaction, user) => {


  //  Artwork featuring system
  const feature_system_add = () => {


      //  Centralized Object.
      let metadata = {
        art_channels: [
          "459892609838481408",
          "459893040753016872",
          "460439050445258752",
          "461926519976230922",
          "460615254553001994",
          "538806382779170826"
        ],
        featured_channel: bot.channels.get("581642059090362368"),
        featured_requirement: 2,
        msg: reaction.message,
        get artwork() {
          return this.msg.attachments.first().url;
        },
        get favs() {
          return this.msg.reactions.filter(reaction => reaction.emoji.name == "⭐").first().count
        }

      }


      //  Simple pre-defined logs.
      const log = (props = {}) => {
        !props.code ? props.code = `UNDEFINED` : props.code;
        const logtext = {
          NEW_FAVS: `${metadata.msg.author.username}'s work has been starred by ${user.username} in ${metadata.msg.channel.name}.`
        }

        let res = logtext[props.code]
        return console.log(res)
      }
        

      //  Core processes
      const main = async() => {

        if(metadata.favs >= metadata.featured_requirement) {
          let embed = new Discord.RichEmbed()
            .setImage(metadata.artwork)
            .setAuthor(metadata.msg.author.tag, metadata.msg.author.avatarURL)
            .setColor(palette.darkmatte)
            .setDescription(`[\u200b](${metadata.msg.id})`);
                        
            metadata.featured_channel.send(embed)
            metadata.featured_channel.send(`${metadata.msg.author}`)
              .then(msg => {
                msg.delete()
                log({code: `NEW_FAVS`});
              })
        }
        else return;
        
      }


      //  Initialize
      const run = () => {

        //  Returns if current channel is not listed in arts channels.
        if(!metadata.art_channels.includes(metadata.msg.channel.id))return;


        //  Returns if the reaction is not a "star".
        if(reaction.emoji.name !== "⭐")return;
        
        main();
      
      }

      run();

  }
  
  feature_system_add();

}

