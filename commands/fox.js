const Discord = require("discord.js");
const superagent = require("superagent");

module.exports.run = async (bot,command, message, args) => {
        message.delete(5000);
        if (!args[0]){
        let { body } = await superagent
            .get(`https://randomfox.ca/floof/`);

        let pandaembed = new Discord.RichEmbed()
            .setColor("#ff9900")
            .setImage(body.image);

        message.channel.send(pandaembed);
    }
}

module.exports.help = {
    name: "fox",
        aliases:[]
}