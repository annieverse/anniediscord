const Discord = require('discord.js');
const botconfig = require('../botconfig.json');
const palette = require('../colorset.json');
const package = require('../package.json');
const fs = require('fs');
const ms = require('parse-ms');

const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot,command,message,args)=>{

    /// botinfo.js
    ///
    ///  stats command
    ///    change logs:
    ///       11/08/18 - Major reworks. More data have been added.
    ///       10/18/18 - embed changes. removed global status
    ///       09/18/18 - Showing few bot data. Including status presence & system usage.
    ///
    ///     -naphnaphz
    ///     -Frying Pan


function countingIndex() {
        return sql.all(`SELECT timestamp FROM messagelog`)
        .then(async x => x.length)
}

function threeDigits(numbers) {
   return numbers.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

    let parsedValue = await countingIndex();
    let bicon = bot.user.displayAvatarURL;
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


        let botembed = new Discord.RichEmbed()
        .setColor(palette.darkmatte)
        .setTitle(`Annie's Status`)
.addField(`⚙ | **System**`,
`
\`\`\`json
» Uptime      :: ${uptimeFixed.hours}h ${uptimeFixed.minutes}m ${uptimeFixed.seconds}s
» Memory      :: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
» CPU         :: ${(process.cpuUsage().system / 1024 / 1024).toFixed(2)} %
» API version :: 2.4.0
\`\`\``)

.addField(`:oil: | **Database**`,
`\`\`\`json
» Storage  :: ${package.dependencies.sqlite}
» Size    :: ${fs.statSync('.data/database.sqlite').size} bytes
» Logs    :: ${await threeDigits(parsedValue)} msgs
\`\`\``)

.addField(`:busts_in_silhouette: | Online Users`,
`\`\`\`json
${onmem + idlemem + dndmem}
\`\`\``,true)

.addField(`:bar_chart: | Latency`,
`\`\`\`fix
${Math.round(bot.ping)}ms
\`\`\``,true)

		.setFooter("Annie | App Information ", bicon)
      
        return message.channel.send(botembed);
}
module.exports.help={
    name:"stats",
        aliases:[]
}