const Discord = require("discord.js");
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports = async (bot, reaction, user) => {

    let favoritechannel = bot.channels.get("581642059090362368"); // channel the image is sent to
    console.log(reaction)
    if (reaction.message.partial) await reaction.message.fetch();
    const rmsg = reaction.message;

    if (user.bot) return;

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
        if (rmsg.author.id == '514688969355821077') return;//make sure its not bots id
        if(x==undefined)x=0; // if it has no likes set value to 0
        if (x.count == 1 || x==0) { // minimum likes or no like to delete
            // Do Code Here

            //let fileSize = rmsg.attachments.first().filesize;
            //let fileSizelimit = 8000000;
            
            //let attachmentFileUrl = rmsg.attachments.first().url
                //console.log(messages.array().find(x => x.content.slice(15) === rmsg.id).id)
                //let othermsgid = messages.array().find(x => x.content.slice(15) === rmsg.id).id;


            /*  //Pan Version (Removes 4 messages)
             *
             *  let othermsgid = favoritechannel.messages.array().find(x => x.content.slice(15) === rmsg.id).id;
             *
             *  favoritechannel.fetchMessages({after:othermsgid, limit:3})
             *      .then(messages => favoritechannel.bulkDelete(messages))
             *      .catch(console.error);
             *
             *  favoritechannel.fetchMessage(othermsgid)
             *      .then(message => message.delete())
             *  .catch(console.error);
             */

            //Fwubbles Version (Remove single compressed message / ID in the footer)
            let msg_array = favoritechannel.messages.array()
            let delete_this_id;
            for(let i = 0; i < msg_array.length; i++){
                if(msg_array[i].embeds[0]){
                    if(msg_array[i].embeds[0].footer.text === rmsg.id){
                        delete_this_id = msg_array[i].id;
                    }
                }
            }
            favoritechannel.fetchMessage(delete_this_id)
                .then(message => message.delete())
                .catch(console.error);
            }
        }

    }