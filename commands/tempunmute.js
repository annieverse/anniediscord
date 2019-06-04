const Discord = require("discord.js");
const palette = require('../colorset.json');
const ms = require("ms");
const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, command, message, args, utils) => {


if(env.dev && !env.administrator_id.includes(message.author.id))return;

  function getRoles(r) {
              const currentGuild = bot.guilds.get(message.guild.id);
              return currentGuild.roles.find(n => n.name === r)
            };
  let bicon = bot.user.displayAvatarURL;
let admEmbed = new Discord.RichEmbed();
  admEmbed.setColor(palette.red)
    admEmbed.setDescription(`You don't have authorization to use this command.`)
    admEmbed.setFooter(`Anime Artist United | Say Message`, bicon)
  
  if(!message.member.roles.find(r => (r.name === 'Creators Council') 
                                  || (r.name === 'Trial Mod') 
                                  || (r.name === 'Channel Overseer') 
                                  || (r.name === 'Tomato Fox'))) return message.channel.send(admEmbed);
  
  let mutee = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
  if(!mutee) return message.channel.send("Please provide a user to be muted.");
  
  let reason = args.slice(1).join(" ");
  if(!reason) reason = "No reason given";
  
  let muterole = message.guild.roles.find(r => r.name === "muted");
  if(!muterole)return message.channel.send("There is no mute role to remove!");
  
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
  .addField(`Mutee:`,`username: ${mutee.user.username}\n
                      user ID:  ${mutee.id}`)
  .addField(`Moderator:`, `username: ${message.author.username}\n
                           user ID:  ${message.author.id}`)
  .addField(`Reason:`, reason)
  .addField(`Date:`, message.createdAt.toLocaleString());
  
  let staffLogChannel = bot.channels.get("460267216324263936");
  staffLogChannel.send(embed);


}//end of the module
module.exports.help = {
  name:"unmute",
  aliases: [],
  description: `unmutes a user`,
  usage: `${prefix}unmute @user [reason]<optional>`,
  group: "Admin",
  public: true,
}
