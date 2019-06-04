const Discord = require("discord.js");
const env = require('../.data/environment.json');

module.exports = async (bot, reaction, user) => {


    //  Artwork featuring system
    const feature_system_remove = async () => {

        let favoritechannel = bot.channels.get("582808377864749056"); 

        reaction.fetchUsers();
        if (reaction.message.partial) await reaction.message.fetch();
        const rmsg = reaction.message;

        const artChannels = [
            "459892609838481408",
            "459893040753016872",
            "460439050445258752",
            "461926519976230922",
            "460615254553001994",
            "538806382779170826",
        ];

        if (reaction.emoji.name == "❤" && artChannels.includes(rmsg.channel.id)) { // change rmsg.channel.id == "530223957534703636" for the art channels
            reaction.fetchUsers()
            let x = rmsg.reactions.filter(reaction => reaction.emoji.name == "❤").first();
            if (rmsg.author.id == '501461775821176832') return;//make sure its not bots id
            if (x == undefined) x = 0; // if it has no likes set value to 0
            if (x.count < 3 || x == 0) { // minimum likes or no like to delete
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

                //  Normalizing the string.
                const remove_symbols = (str) => {
                    let new_str = str.replace(/[^a-zA-Z0-9]/g, "");
                    return new_str;
                }


                //Fwubbles Version (Remove single compressed message / ID in the footer)
                let msg_array = favoritechannel.messages.array() // fetch messages in the channel;
                let msg_collection = await favoritechannel.fetchMessages()// i dunno how this method works
                let msg_array2 = msg_collection.array();

                let delete_this_id;
                for (let i = 0; i < msg_array2.length; i++) {
                    if (msg_array2[i].embeds[0]) {
                        if (remove_symbols(msg_array2[i].embeds[0].description) === rmsg.id) {
                            delete_this_id = msg_array2[i].id;
                        }
                    }
                }


                favoritechannel.fetchMessage(delete_this_id)
                    .then(message => message.delete())
                    .catch(console.error);
            }
        }
    }


    feature_system_remove();

}

