const Discord = require("discord.js");
const env = require('./.data/environment.json');
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();
const fs = require("fs");
require("./utils/eventHandler")(bot)

const http = require('http');
const express = require('express');
const app = express();


//	Ping server
app.get("/", (request, response) => {
    console.log(`At ${Date.now()} ping was received`);
    response.sendStatus(200);
});

app.listen(process.env.PORT);
setInterval(() => {
    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);


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


//	Client token.
const token = env.dev ? env.temp_token : process.env.TOKEN;
bot.login(token);
console.log(env.dev ? `Log-in as developer-mode.` : `Prod server started.`)