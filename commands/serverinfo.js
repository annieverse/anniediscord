const Discord = require("discord.js");
const palette = require('../colorset.json');
const ms = require("parse-ms");
const env = require('../.data/environment.json');
const prefix = env.prefix;


module.exports.run = async (bot, command, message, args, utils) => {

    /// serverinfo.js
    ///
    ///  server info command
    ///    change logs:
    ///       10/19/18 - added more data(owner & region)
    ///       10/18/18 - embed changes.
    ///       09/20/18 - More data, ms-module & rework embed.
    ///
    ///     -naphnaphz
    ///     -Frying Pan


if(env.dev && !env.administrator_id.includes(message.author.id))return;

    let sicon = message.guild.iconURL;
    let members = message.guild.memberCount;
    let botSize = message.guild.members.filter(a=>a.user.bot).size;
    let userSize = members - botSize;
    let uptimeFixed = ms(bot.uptime);
    var timestamp = new Date,
            timeformat = [timestamp.getMonth()+1,timestamp.getDate(),timestamp.getFullYear()].join('/')+' '+[timestamp.getHours(),
            timestamp.getMinutes(),
            timestamp.getSeconds()].join(':');

    let onmem = message.guild.members.filter(a => a.user.presence.status === `online`).size;
    let idlemem = message.guild.members.filter(a => a.user.presence.status === `idle`).size;
    let dndmem = message.guild.members.filter(a => a.user.presence.status === `dnd`).size;

    let createdAtMs = ms(Date.now() - (message.guild.createdAt) );
    let joinedAtMs = ms(Date.now() - (message.member.joinedAt) );

        let serverembed = new Discord.RichEmbed()

        .setColor(palette.halloween)
        .setThumbnail(sicon)
        .addField("Server Name",message.guild.name,true)
        .addField("Region", message.guild.region,true)
        .addField("Owner", `<@${message.guild.ownerID}>`)
        .addField("Created on", `${createdAtMs.days} days, ${createdAtMs.hours} hours ago.`,true)
        .addField("Date joined", `${joinedAtMs.days} days, ${joinedAtMs.hours} hours ago.`,true)
        .addField("Customs", `• **${message.guild.channels.size}** Channels\n• **${userSize}** Users\n• **${botSize}** Bots\n• **${members}** Members`,true)
        .addField("Presence Status",  `• **${onmem}** Online\n• **${idlemem}** Idle\n• **${dndmem}** Away\n• **${members-onmem-dndmem-idlemem}** Offline\n`,true)
        .addBlankField()
        .setFooter(`Anime Artist United | Server Information`, sicon)
        .setTimestamp(timestamp)

        return message.channel.send(serverembed);
}
module.exports.help = {
    name:"serverinfo",
    aliases: [],
    description: `Displays info about server`,
    usage: `${prefix}serverinfo`,
    group: "Server",
    public: true,
}