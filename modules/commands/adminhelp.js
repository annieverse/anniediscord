const Discord = require('discord.js');

class adminHelp {
  constructor(Stacks) {
    this.author = Stacks.meta.author;
    this.data = Stacks.meta.data;
    this.utils = Stacks.utils;
    this.message = Stacks.message;
    this.args = Stacks.args;
    this.palette = Stacks.palette;
    this.required_roles = this.message.member.roles.find(r => (r.name === 'Grand Master') || (r.name === 'Tomato Fox'));
    this.stacks = Stacks;
  }

  async execute() {
    /// admhelp.js
    ///
    ///  Admin Help command
    ///    change logs:
    ///       11/12/18 - Interface reworks & minor bug fixes.
    ///       09/18/18 - Help command for admin.
    ///       
    ///
    ///     -naphnaphz

    let message = this.message;
    let bot = this.stacks.bot;

    function fileAliasesCheck(file) {
      const src = require(`./${file}`)
      return src.help.name;
    }


    let bicon = bot.user.displayAvatarURL;
    let admEmbed = new Discord.RichEmbed();
    let admEmbed2 = new Discord.RichEmbed();


    admEmbed.setColor(this.palette.red)
    admEmbed.setDescription(`You don't have authorization to use this command.`)
    admEmbed.setFooter(`Anime Artist United | Admin Help Section`, bicon)

    if (!message.member.roles.find(r => r.name === 'Creators Council')) return message.channel.send(admEmbed);

    message.react("👌")
    try {

      admEmbed.setDescription(`
        <:AnnieHi:501524470692053002> **Hello, ${message.author.username}!**\nBelow are my administrator-level commands. Please use it wisely!\n

        >\`${fileAliasesCheck('addrole')}\`
        Add roles to specific user.\n
        >\`${fileAliasesCheck('removerole')}\`
        Removing user's roles.\n
        >\`${fileAliasesCheck('payToRole')}\`
        Send specific amount of artcoins to group of users.\n
        >\`${fileAliasesCheck('ban')}\`
        Kick permanently.\n
        >\`${fileAliasesCheck('eval')}\`
        Evaluating Annie's code through message.

        Actually, I still have more hidden commands!
        DM **Development Team Member** for any further informations.\n
        `)

      admEmbed.setColor(this.palette.darkmatte)
      admEmbed.setThumbnail(bot.user.displayAvatarURL)

      admEmbed2.setDescription(`I've sent you the DM!`)
      admEmbed2.setColor(this.palette.halloween)
      admEmbed2.setFooter("Anime Artist United | Admin Help Section", bicon)
      await message.author.send(admEmbed).then((msg) => message.channel.send(admEmbed2));

    } catch (e) {
      console.log(`[ERROR LOG for adminhelp.js`)
      console.log(e)
      admEmbed.setColor('#5178a5')
      admEmbed.setDescription(`I tried to DM you ${message.author.username}, but your DMs are locked. T__T`)
      admEmbed.setFooter(`Anime Artist United | Admin Help Section`, bicon)
      return message.channel.send(admEmbed)
    }
    
  }
}
/*
module.exports.run = async (...ArrayStacks) => {
	/// admhelp.js
    ///
    ///  Admin Help command
    ///    change logs:
    ///       11/12/18 - Interface reworks & minor bug fixes.
    ///       09/18/18 - Help command for admin.
    ///       
    ///
    ///     -naphnaphz

function fileAliasesCheck(file) {
    const src = require(`./${file}`)
    return src.help.name;
}


let bicon = bot.user.displayAvatarURL;
let admEmbed = new Discord.RichEmbed();
let admEmbed2 = new Discord.RichEmbed();


    admEmbed.setColor(palette.red)
    admEmbed.setDescription(`You don't have authorization to use this command.`)
    admEmbed.setFooter(`Anime Artist United | Admin Help Section`, bicon)

if(!message.member.roles.find(r => r.name === 'Creators Council'))return message.channel.send(admEmbed);

    message.react("👌")
  try{

	admEmbed.setDescription(`
        <:AnnieHi:501524470692053002> **Hello, ${message.author.username}!**\nBelow are my administrator-level commands. Please use it wisely!\n

        >\`${fileAliasesCheck('addrole')}\`
        Add roles to specific user.\n
        >\`${fileAliasesCheck('removerole')}\`
        Removing user's roles.\n
        >\`${fileAliasesCheck('addexp')}\`
        Add XP to specific user.\n
        >\`${fileAliasesCheck('addmoney')}\`
        Add artcoins to specific user.\n
        >\`${fileAliasesCheck('payToRole')}\`
        Send specific amount of artcoins to group of users.\n
        >\`${fileAliasesCheck('ban')}\`
        Kick permanently.\n
        >\`${fileAliasesCheck('eval')}\`
        Evaluating Annie's code through message.

        Actually, I still have more hidden commands!
        DM **naphnaphz#7790** for any further informations.\n
        `)

	admEmbed.setColor(palette.darkmatte)
    admEmbed.setThumbnail(bot.user.displayAvatarURL)

	admEmbed2.setDescription(`I've sent you the DM!`)
	admEmbed2.setColor(palette.halloween)
	admEmbed2.setFooter("Anime Artist United | Admin Help Section", bicon)
    await message.author.send(admEmbed).then((msg) => message.channel.send(admEmbed2));

  }catch(e){

    admEmbed.setColor('#5178a5')
    admEmbed.setDescription(`I tried to DM you ${message.author.username}, but your DMs are locked. T__T`)
    admEmbed.setFooter(`Anime Artist United | Admin Help Section`, bicon)
    return message.channel.send(admEmbed)
  }
}*/
module.exports.help = {
  start:adminHelp,
  name:"adminhelp",
  aliases: [],
  description: `A list of all admin commands`,
  usage: `${require(`../../.data/environment.json`).prefix}adminhelp`,
  group: "Admin",
  public: true,
  required_usermetadata: true,
  multi_user: true
}