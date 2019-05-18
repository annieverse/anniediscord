const Discord = require("discord.js");
const palette = require('../colorset.json')
const formatManager = require('../utils/formatManager.js');
const superagent = require("superagent");

module.exports.run = async (bot,command, message, args) => {

const env = require(`../utils/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

const format = new formatManager(message);
return ["bot", "bot-games", "cmds"].includes(message.channel.name) ? initFox()
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)

async function initFox() {
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
}

module.exports.help = {
    name: "fox",
        aliases:[]
}