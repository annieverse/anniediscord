const discord = require("discord.js");
const ms = require("ms");
module.exports.run = async (bot,command, message,args)=>{
let tomute =  message.guild.member(message.mentions.users.first()||message.guilds.member.get(args[0]));
if(!tomute)return message.reply("Couldn't find user.");
if(tomute.hasPermission("MANAGE_MESSAGES"))return message.reply("you aren't allowed to mute other members of this server.");
let muterole = message.guild.roles.find(`name`,"muted");
//role creation
if(!muterole){
    try{
        muterole = await message.guild.createRole({
            name:"muted",
            color:"000000",
            permissions:[]
        })
        message.guild.channels.forEach(async(channel, id)=>{
            await channel.overwritePermissions(muterole,{
             SEND_MESSAGES:false,
             ADD_REACTIONS:false
            });
        });
    }catch(e){
        console.log(e.stack);
    }
}//end of role creation
let mutetime = args[1];
if(!mutetime)return message.reply("Time specification required.");

await(tomute.addRole(muterole.id));
message.reply(`<@${tomute.id}>has been muted for ${ms(ms(mutetime))}`);
setTimeout(function(){
tomute.removeRole(muterole.id);
message.channel.send(`<@${tomute.id}>has been unmuted `)
},ms(mutetime));
}//end of the module
module.exports.help = {
    name:"mute",
        aliases:[]
}
