const Discord = require('discord.js');
const botconfig = require(`../botconfig.json`);
const formatManager = require('../utils/formatManager.js');
const palette = require(`../colorset.json`);

module.exports.run = async(bot,command,message,args)=>{
	
	/// help.js
    ///
    ///  Help command
    ///    change logs:
    ///		  11/12/18 - Interface reworks.
    ///	  	  11/01/18 - Added leaderboard (xp, ac) & server invite. Removed report cmd.
    ///		  10/18/18 - Halloween palette
    ///       09/17/18 - Major changes. Including embed structures & infos.
    ///       
    ///
    ///     -naphnaphz

const format = new formatManager(message);
return ["bot", "bot-games", "cmds"].includes(message.channel.name) ? initHelp()
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)

function fileAliasesCheck(file) {
	const src = require(`./${file}`)
	return src.help.name;
};


async function initHelp() {
    const header = new Discord.RichEmbed()
          .setColor(palette.darkmatte)
          .setThumbnail(bot.user.displayAvatarURL)
          .setDescription(`<:AnnieHi:501524470692053002> **Hello, I'm Annie!**\nBelow are my commands documentation.\n\n
    **»  General ::**
       \`${fileAliasesCheck('profile')}\`, \`${fileAliasesCheck('setdesc')}\`, \`${fileAliasesCheck('level')}\`, \`${fileAliasesCheck('artcoins')}\`, \`${fileAliasesCheck('daily')}\`,
       \`${fileAliasesCheck('shop')}\`, \`${fileAliasesCheck('shop2')}\`, \`${fileAliasesCheck('avatar')}\`, \`${fileAliasesCheck('buy')}\`, \`${fileAliasesCheck('pay')}\`, \`${fileAliasesCheck('convertartcoin')}\`,

    **»  Fun ::**
      \`${fileAliasesCheck('fox')}\`, \`${fileAliasesCheck('ask')}\`, \`${fileAliasesCheck('secretcommand')}\`, \`${fileAliasesCheck('coinflip')}\`

    **»  Server ::**
      \`${fileAliasesCheck('time')}\`, \`${fileAliasesCheck('botinfo')}\`, \`${fileAliasesCheck('help')}\`, \`${fileAliasesCheck('leaderboard')}\`, \`${fileAliasesCheck('invite')}\`, \`${fileAliasesCheck('ping')}\`

    **»  Administration ::**
      \`${fileAliasesCheck('admhelp')}\`
      `);

    const footer = new Discord.RichEmbed()
            .setColor(palette.halloween)
            .setDescription(`Need further help? Please DM <@507043081770631169>.`);


      return message.channel.send(header).then(() => {
          message.channel.send(footer)
        });
}
}
module.exports.help = {
    name:"help",
        aliases:[]
}