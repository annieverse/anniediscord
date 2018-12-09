const Discord = require("discord.js");
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();
const { Canvas } = require("canvas-constructor");
const { resolve, join } = require("path");
const fs = require("fs");
const sql = require("sqlite");
sql.open(".data/database.sqlite");
require("./utils/eventHandler")(bot)

Canvas.registerFont(resolve(join(__dirname, "./fonts/Roboto.ttf")), "Roboto");
Canvas.registerFont(resolve(join(__dirname, "./fonts/Whitney.otf")), "Whitney");
Canvas.registerFont(resolve(join(__dirname, "./fonts/KosugiMaru.ttf")), "KosugiMaru");

const http = require('http');
const express = require('express');
const app = express();

app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

fs.readdir("./commands/", (err, files) => {

        if(err) console.log(err);
      
        let jsfile = files.filter(f => f.split(".").pop() === "js")
        if(jsfile.length <= 0){
          console.log("where daaaa filesss?");
          return;
        }
      
        jsfile.forEach((f, i) =>{
          let props = require(`./commands/${f}`);
          bot.commands.set(props.help.name, props);
          props.help.aliases.forEach(alias => {
            bot.aliases.set(alias, props.help.name)
          });
        });
        console.log(`${jsfile.length} command files have been loaded.`)
  });
bot.login(process.env.TOKEN)