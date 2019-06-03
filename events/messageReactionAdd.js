const Discord = require("discord.js");
const palette = require(`../colorset.json`);
const sql = require(`sqlite`);
const env = require(`../.data/environment.json`);

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
          "538806382779170826",
          "565308091424571422",
        ],
        featured_channel: bot.channels.get("582808377864749056"),
        featured_requirement: 10,
        main_emoji: `❤`,
        msg: reaction.message,
        get artwork() {
          return this.msg.attachments.first().url;
        },
        get favs() {
          reaction.fetchUsers();
          function test(){
            if(reaction.users.size>reaction.count){
              return reaction.users.size;
            } else if (reaction.users.size < reaction.count){
              return reaction.count;
            } else if (reaction.users.size == reaction.count) {
              return reaction.count;
            }
          }
          return test();
          // return this.msg.reactions.filter(reaction => reaction.emoji.name == "⭐").first().count
          // return reaction.users.size;
        }

      }

      
      //  Store new like point
      const add_like = () => {
        sql.open(`.data/database.sqlite`);
        sql.run(`UPDATE userdata 
                 SET liked_counts = liked_counts + 1 
                 WHERE userId = "${metadata.msg.author.id}"`)
      }


      //  Simple pre-defined logs.
      const log = (props = {}) => {
        !props.code ? props.code = `UNDEFINED` : props.code;
        const logtext = {
          NEW_LIKE: `${metadata.msg.author.username}'s work has been liked by ${user.username} in #${metadata.msg.channel.name}.`
        }

        let res = logtext[props.code]
        return console.log(res)
      }
        

      //  Core processes
      const main = async() => {

        log({code: `NEW_LIKE`})
        add_like();

        if(metadata.favs === metadata.featured_requirement) {
          let embed = new Discord.RichEmbed()
            .setImage(metadata.artwork)
            .setAuthor(metadata.msg.author.tag, metadata.msg.author.avatarURL)
            .setColor(palette.darkmatte)
            .setDescription(`[\u200b](${metadata.msg.id})`);
                        
            metadata.featured_channel.send(embed)
            metadata.featured_channel.send(`${metadata.msg.author}`)
              .then(msg => {
                msg.delete()
              })
        }
        else return;
        
      }


      //  Initialize
      const run = () => {


        //  Returns if current channel is not listed in arts channels.
        if(!metadata.art_channels.includes(metadata.msg.channel.id)) return;


        //  Returns if the reaction is not MATCH.
        if(reaction.emoji.name !== metadata.main_emoji)return;


        //  Returns self-liking
        if(metadata.msg.author.id === user.id)return reaction.remove(user);
        
        main();

      }

      run();

  }
  
  feature_system_add();

}

