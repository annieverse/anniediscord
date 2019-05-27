const Discord = require("discord.js");
const env = require('./.data/environment.json');
const palette = require('./colorset.json');
const fs = require("fs");
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();
require("./utils/eventHandler")(bot)
const express = require('express');
const app = express();


//	Ping server so it won't died cause of idling.
app.get("/", (request, response) => {
    console.log(`${bot.ping}ms ping was received`);
    response.sendStatus(200);
});


//  To prevent PM2 from being terminated.
const listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
});


//	Loading command modules.
fs.readdir("./commands/", (err, files) => {

    if (err) console.log(err);
    let jsfile = files.filter(f => f.split(".").pop() === "js")
    if (jsfile.length <= 0) {
        console.log(`missing files`);
        return;
    }

    jsfile.forEach((f, i) => {
        let props = require(`./commands/${f}`);
        bot.commands.set(props.help.name, props);
        props.help.aliases.forEach(alias => {
            bot.aliases.set(alias, props.help.name)
        });
    });
    console.log(`${jsfile.length} command files have been loaded.`)
});


//  Bot Messaging via Console ♡
let y = process.openStdin()
y.addListener("data", res => {
    


    let x = res.toString().trim().split(/ +/g);
    let msg = x.join(" ")

     //  Modify These Values!
    let color = palette.golden
    let channel = "sandbox"
    //let channel = "general"
    //let channel = "general-2"
    //let channel = "vc-off-topic"
    //let channel = "taff-hq"
    //let enabletextwrapping = true;

    if (enabletextwrapping) {
        embedWrapper(channel, color, msg);
    } else {
        bot.channels.get(bot.channels.find(x => x.name === channel).id).send(msg);
    }
});


let embed = new Discord.RichEmbed();
const embedWrapper = (channel, color, content) => {
    embed.setColor(color)
    embed.setDescription(content)
    let channelid = bot.channels.find(x => x.name === channel).id
    return bot.channels.get(channelid).send(embed);
}

//	Client token.
const token = process.env.TOKEN ? process.env.TOKEN : env.temp_token;
console.log(env.dev ? `Local development server has been started.` : `Production server has been started.`)
bot.login(token)
