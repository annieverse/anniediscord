const Discord = require("discord.js");
const palette = require('../colorset.json');
const ms = require("ms");
module.exports.run = async (bot,command, message,args)=>{
function getRoles(r) {
              const currentGuild = bot.guilds.get(message.guild.id);
              return currentGuild.roles.find(n => n.name === r)
            };
  message.delete();
  let bicon = bot.user.displayAvatarURL;
  let admEmbed = new Discord.RichEmbed();
  admEmbed.setColor(palette.red)
    admEmbed.setDescription(`You don't have authorization to use this command.`)
    admEmbed.setFooter(`Anime Artist United | Say Message`, bicon)
  
  if(!message.member.roles.find(r => r.name === 'Creators Council') && !message.member.roles.find(r => r.name === 'Trial Mod') && !message.member.roles.find(r => r.name === 'Channel Overseer'))return message.channel.send(admEmbed)
  
  if(!message.member.hasPermission("MANAGE_MESSAGES") || !message.guild.owner) return message.channel.send("You, don't have permission to use this command.");
  
  
  let mutee = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
  if(!mutee) return message.channel.send("Please provide a user to be muted.");
  
  let reason;
  let mutetime = args[1];
  if(!mutetime){
    mutetime = '1d';
  }
  if(mutetime){
    if(isNaN(mutetime.charAt(0))){
      mutetime = '1d';
      reason = args[1];
      if(!reason){reason = "No reason was given.";}else{reason = args.join(" ").split(" ").slice(1).join(" ");}
    }else{
      reason = args[2];
      if(!reason){reason = "No reason was given.";}else{reason = args.join(" ").split(" ").slice(2).join(" ");}
    }
  }
  
  
  let muterole = message.guild.roles.find(r => r.name === "muted");
  //start of create role
  if(!muterole){
    try{
      muterole = await message.guild.createRole({
        name: "muted",
        color: "#000000",
        permissions:[]
      })
      message.guild.channels.forEach(async (channel, id) => {
        await channel.overwritePermissions(muterole, {
          SEND_MESSAGES: false,
          ADD_REACTIONS: false,
          SEND_TTS_MESSAGES: false,
          ATTACH_FILES: false,
          SPEAK: false
        });
      });
    }catch(e){
      console.log(e.stack);
    }
  }
  
  mutee.addRole(muterole.id).then(() => {
    message.delete();
    mutee.send(`Hello, you have been muted in ${message.guild.name}\n
                for: ${reason}\nfor: ${mutetime}: **Or** until a staff member unmutes.`).catch(err => console.log(err));
  })
  //end of create role

  let embed = new Discord.RichEmbed()
  .setColor(palette.red)
  .setAuthor(`${message.guild.name} Modlogs`, message.guild.iconURL)
  .addField(`Moderation:`, `mute`)
  .addField(`Mutee:`,`username: ${mutee.user.username}\n
                      user ID:  ${mutee.id}`)
  .addField(`Moderator:`, `username: ${message.author.username}\n
                           user ID:  ${message.author.id}`)
  .addField(`Reason:`, reason)
  .addField(`Time:`, mutetime)
  .addField(`Date:`, message.createdAt.toLocaleString());
  
  let staffLogChannel = bot.channels.get("460267216324263936");
  staffLogChannel.send(embed);
  
  setTimeout(function(){
    if(mutee.roles.find(r => r.name === muterole.name)){
      mutee.removeRole(muterole.id);
    }
  },ms(mutetime));
  
}//end of the module
module.exports.help = {
    name:"mute",
        aliases:[]
}
