const Discord = require("discord.js");

class AddRole {
  constructor(Stacks) {
    console.log(Stacks.meta)
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
    /// addrole.js
    ///
    ///  ADDROLE COMMAND
    ///    change logs:
    ///       09/17/18 - rework embed. 
    ///     -naphnaphz

    let message = this.message;
    let bot = this.stacks.bot;

    let bicon = bot.user.displayAvatarURL;
    let pUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(this.args[0]));
    let red = "#b22727";

    let roleEmbed = new Discord.RichEmbed();

    roleEmbed.setColor(red)
    roleEmbed.setDescription(`You don't have authorization to use this command.`)
    roleEmbed.setFooter(`Anime Artist United | Add Role`, bicon)
    if (!message.member.hasPermission("MANAGE_ROLES")) return message.channel.send(roleEmbed);

    roleEmbed.setColor(red)
    roleEmbed.setDescription(`Uhm, can you specify the user?`)
    if (!this.args[0]) return message.channel.send(roleEmbed);


    roleEmbed.setColor(red)
    roleEmbed.setDescription(`Sorry ${message.author.username}, I couldn't find that user.`)
    if (!pUser) return message.channel.send(roleEmbed);


    roleEmbed.setColor(red)
    roleEmbed.setDescription(`Can you specify the role?`)
    if (!this.args[1]) return message.channel.send(roleEmbed);


    roleEmbed.setColor(red)
    roleEmbed.setDescription(`${message.author.username}, I couldn't find that role.`)
    let role = this.args[1].substring(3, 21);
    let gRole = message.guild.roles.get(role);
    if (!gRole) return message.channel.send(roleEmbed).then(() => console.log(role));


    roleEmbed.setColor('#d61313')
    roleEmbed.setDescription(`${pUser} already has that role.`)
    if (pUser.roles.has(gRole.id)) return message.channel.send(roleEmbed);


    await (pUser.addRole(gRole.id));
    message.react("👌")
    try {

      roleEmbed.setColor('#a3edd0')
      roleEmbed.setDescription(`Gratz <@${pUser.id}> !
      You have been given the role **${gRole.name}**`)
      roleEmbed.setFooter(`Anime Artist United | New Role | Given by ${message.author.username}`, bicon)
      await pUser.send(roleEmbed)

    } catch (e) {

      roleEmbed.setColor('#5178a5')
      roleEmbed.setDescription(`Congrats to <@${pUser.id}>!! they have been given the role **${gRole.name}**.
     I tried to DM them, but their DMs are locked. T__T`)
      roleEmbed.setFooter(`Anime Artist United | New Role | Given by ${message.author.username}`, bicon)
      return message.channel.send(roleEmbed)
    }
  }
}

module.exports.help = {
  start: AddRole,
  name:"addrole",
  aliases: [],
  description: `Add roles to specific user.`,
  usage: `>addrole @user <role>`,
  group: "Admin",
  public: true,
  required_usermetadata: true,   
  multi_user: true
}