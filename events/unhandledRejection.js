const Discord = require("discord.js");
const moment = require('moment');
const palette = require('../colorset.json');
const env = require(`../.data/environment.json`);

module.exports = (bot, err, p, message) => {


    //  Centralized object
    const metadata = {
        date: moment(Date.now()).format(`dddd, MMMM Do YYYY, h:mm:ss a`),
        error: err.stack,
        user: {
            mention: message.author,
            msg: message.content,
            id: message.author.id,
            name: message.author.username,
            tag: message.author.tag
        },
        channel: bot.channels.get(message.channel.id).toString(),
        log: bot.channels.get("580889690677444618"),
        dev: message.guild.roles.find(r => r.name === "Developer Team").toString()
    }

    
    //replacing authors name in directory
    metadata.error = metadata.error.split("\\");
    //let y = metadata.error.replace(new RegExp(x[2],"gi"), "Developer_User");


    //  Discord log.
    const embed = new Discord.RichEmbed()
        .setColor(palette.darkmatte)
        .setTitle("UnhandledRejection Error")
        .addField("User", metadata.user.mention,true)
        .addField("Channel", metadata.channel,true)
        .setDescription(`
        "${metadata.user.msg}"
        \`\`\`javascript\n${metadata.error}\n\`\`\`
        `)
        .setTimestamp(Date.now())


    //  Disable error channel logging in dev environment.
    if(env.dev) return console.log(metadata.error);
    err.name !== "TypeError" ? metadata.log.send(metadata.dev) : null;
    return metadata.log.send(embed);
}
