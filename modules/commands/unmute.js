const Discord = require("discord.js");
class unmute {
  constructor(Stacks) {
    this.author = Stacks.meta.author;
    this.data = Stacks.meta.data;
    this.utils = Stacks.utils;
    this.message = Stacks.message;
    this.args = Stacks.args;
    this.palette = Stacks.palette;
    this.stacks = Stacks;
  }

  async execute() {
    let message = this.message;
    let bot = this.stacks.bot;
    let palette = this.stacks.palette;
    let bicon = bot.user.displayAvatarURL;
    let admEmbed = new Discord.RichEmbed();
    admEmbed.setColor(palette.red)
    admEmbed.setDescription(`You don't have authorization to use this command.`)
    admEmbed.setFooter(`Anime Artist United | Say Message`, bicon)

    if (!message.member.roles.find(r => (r.name === 'Creators Council')
      || (r.name === 'Trial Mod')
      || (r.name === 'Channel Overseer')
      || (r.name === 'Tomato Fox'))) return message.channel.send(admEmbed);

    let mutee = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if (!mutee) return message.channel.send("Please provide a user to be muted.");

    let reason = args.slice(1).join(" ");
    if (!reason) reason = "No reason given";

    let muterole = message.guild.roles.find(r => r.name === "muted");
    if (!muterole) return message.channel.send("There is no mute role to remove!");

    mutee.removeRole(muterole.id).then(() => {
      message.delete();
      mutee.send(`Hello, you have been unmuted in ${message.guild.name}\n
                for: ${reason}\n`).catch(err => console.log(err));
    })
    //end of create role

    let embed = new Discord.RichEmbed()
      .setColor(palette.red)
      .setAuthor(`${message.guild.name} Modlogs`, message.guild.iconURL)
      .addField(`Moderation:`, `unmute`)
      .addField(`Mutee:`, `username: ${mutee.user.username}\n
                      user ID:  ${mutee.id}`)
      .addField(`Moderator:`, `username: ${message.author.username}\n
                           user ID:  ${message.author.id}`)
      .addField(`Reason:`, reason)
      .addField(`Date:`, message.createdAt.toLocaleString());

    let staffLogChannel = bot.channels.get("460267216324263936");
    staffLogChannel.send(embed);
  }
}

module.exports.help = {
  start: unmute,
  name:"unmute",
  aliases: [],
  description: `unmutes a user`,
  usage: `${require(`../../.data/environment.json`).prefix}unmute @user [reason]<optional>`,
  group: "Admin",
  public: true,
  require_usermetadata: true,
  multi_user: true
}
