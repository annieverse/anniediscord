const Discord = require("discord.js");

class removeRole {
  constructor(Stacks) {
    this.author = Stacks.meta.author;
    this.data = Stacks.meta.data;
    this.utils = Stacks.utils;
    this.message = Stacks.message;
    this.args = Stacks.args;
    this.stacks = Stacks;
  }

  async execute() {
    // Add these three lines so u dont have to go through and put this./this.stacks infront of everything
    // might have to go through if another varible is called
    let message = this.message;
    let bot = this.stacks.bot;
    /// removerole.js
    ///
    ///  REMOVE COMMAND
    ///    change logs:
    ///       09/19/18 - rework embed. 
    ///     -naphnaphz



    let bicon = bot.user.displayAvatarURL;
    let pUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    let red = "#b22727";

    let roleEmbed = new Discord.RichEmbed();

    roleEmbed.setColor(red)
    roleEmbed.setDescription(`You don't have authorization to use this command.`)
    roleEmbed.setFooter(`Anime Artist United | Remove Role`, bicon)
    if (!message.member.hasPermission("MANAGE_ROLES")) return message.channel.send(roleEmbed);

    roleEmbed.setColor(red)
    roleEmbed.setDescription(`Uhm, can you specify the user?`)
    if (!args[0]) return message.channel.send(roleEmbed);


    roleEmbed.setColor(red)
    roleEmbed.setDescription(`Sorry ${message.author.username}, I couldn't find that user.`)
    if (!pUser) return message.channel.send(roleEmbed);


    roleEmbed.setColor(red)
    roleEmbed.setDescription(`Can you specify the role?`)
    if (!args[1]) return message.channel.send(roleEmbed);


    roleEmbed.setColor(red)
    roleEmbed.setDescription(`${message.author.username}, I couldn't find that role.`)
    let role = message.guild.roles.find(r => r.name === args[1].slice(0)).id;
    let gRole = message.guild.roles.get(role);
    if (!gRole) return message.channel.send(roleEmbed).then(() => console.log(role));


    roleEmbed.setColor('#d61313')
    roleEmbed.setDescription(`${pUser} doesn't have that role.`)
    if (!pUser.roles.has(gRole.id)) return message.channel.send(roleEmbed);


    await (pUser.removeRole(gRole.id));
    message.react("👌")
    try {

      roleEmbed.setColor('#a3edd0')
      roleEmbed.setDescription(`Sorry, your **${gRole.name}** role has been taken away. :((`)
      roleEmbed.setFooter(`Anime Artist United | Removed Role`, bicon)

      await pUser.send(roleEmbed)

    } catch (e) {

      roleEmbed.setColor('#5178a5')
      roleEmbed.setDescription(`Sorry to <@${pUser.id}>, the role ${gRole.name} has been confiscated. We tried to contact you, but your DMs are locked. :((`)
      roleEmbed.setFooter(`Anime Artist United | Removed Role`, bicon)
      return message.channel.send(roleEmbed)
    }
  }
}

module.exports.help = {
  start: removeRole,
  name:"removerole",
  aliases: [],
  description: `Removing user's roles.`,
  usage: `>removerole @user @role`,
  group: "Admin",
  public: true,
  require_usermetadata: true,
  multi_user: true
}