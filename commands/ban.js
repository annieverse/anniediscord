const Discord = require("discord.js");
module.exports.run=async(bot,command,message,args)=>{

const env = require('../.data/environment.json');
if(env.dev && !env.administrator_id.includes(message.author.id))return;

    let bUser=   message.guild.member(message.mentions.users.first()||message.guilds.member.get(args[0]));
        if(!bUser)return message.channel.send("Can't find user.");
        let breason = args.join(" ").slice(22);
        if(!message.member.hasPermission("ADMINISTRATOR"))return message.channel.send("You are not allowed to kick.")
        if(bUser.hasPermission("ADMINISTRATOR"))return message.channel.send("That person can't be kicked.")
        let banEmbed = new Discord.RichEmbed()
        
        .setDescription("~Ban~")
        .setColor(0xff1a1a)
        .addField("Banned User",`${bUser}with ID ${bUser.id}`)
        .addField("Banned By",`<@${message.author.id}> with ID ${message.author.id}`)
        .addField("Banned In",message.channel)
        .addField("Time",message.createdAt)
        .addField("Reason",breason);
        let BanChannel = message.guild.channels.find(`name`,"goodbye");
        if(!BanChannel)return message.channel.send("Can't goodbye channel");
        message.guild.member(bUser).ban(breason);
        BanChannel.send(banEmbed);
}
module.exports.help={
    name:"ban",
        aliases:[]
}