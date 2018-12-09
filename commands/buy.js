const Discord = require('discord.js');
const fs = require('fs');
const items = JSON.parse(fs.readFileSync('genItems.json','utf8'));
const items2 = JSON.parse(fs.readFileSync('items.json','utf8'));
const config = require('../botconfig.json');
const palette = require('../colorset.json');

const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot,command, message, args)=>{
/// buy.js
///
///     BUY COMMAND
///    changes log:
///     12/02/18 - few arguments required to buy specific items, simplified structure.
///     10/19/18 - uppercased user's args, rolename key added in genItems.json.
///     09/17/18 - huge reworks in buy system. The changes will be followed by shop.js.
///     09/29/18 - added purchase option for role_items(items.json)
///

let embed1 = new Discord.RichEmbed();

let itemName = '';
let itemPrice = 0;
let itemValue = '';

const registerItems = (source, targetArguments) => {
         for(var i in source) {
                if(targetArguments === source[i].name) {
                itemName = source[i].name;
                itemPrice = source[i].price;
                itemValue = source[i].rolename;

            }
        }   
};

const purchase = {
    getRoles: function (rolename, user) {
            return message.guild.members.get(user.id).addRole(message.guild.roles.find(n => n.name === rolename));
        },

    getInterface: function(skin, user) {
            sql.get(`SELECT * FROM userdata WHERE userId =${user.id}`).then(async userdatarow => {
                sql.run(`UPDATE userdata SET interfacemode ="${skin.toString()}" WHERE userId = ${user.id}`);
            })
        },

    withdraw: function(price, user) {
            sql.get(`SELECT * FROM userdata WHERE userId =${user.id}`).then(async userdatarow => {
                sql.run(`UPDATE userdata SET artcoins = ${userdatarow.artcoins - parseInt(price)} WHERE userId = ${user.id}`);
            })
        }
    };    


function embedWrapper(color, desc) {
        embed1.setColor(color)
        embed1.setDescription(desc)
        embed1.setFooter(`Shops Merchant | Anime Artist United`, bot.user.displayAvatarURL)
        return embed1;
};



if(args[0]) {

    if(args[0].toUpperCase() === 'ROLE') {

        if(!args[1]) {
            return message.channel.send(embedWrapper(palette.darkmatte, `**${message.author.username}**, please specify the role name.`));
        }

        const targetItem = (message.content.substring(10)).toUpperCase();
        registerItems(items.TICKETS, targetItem);
        registerItems(items.ROLES, targetItem);

        if(targetItem === itemName) {
            sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
            if(userdatarow.artcoins < parseInt(itemPrice))return message.channel.send(embedWrapper(palette.red,`Sorry! it seems you don't have enough artcoins. :(`));
            if(userdatarow.artcoins >= parseInt(itemPrice)) {
                purchase.getRoles(itemValue, message.author);
                purchase.withdraw(itemPrice, message.author);
                return message.channel.send(embedWrapper(palette.lightgreen, `Yay! **${message.author.username}** has bought the role **${itemValue}!**`));
            }
            })
        }
        else {
            return message.channel.send(embedWrapper(palette.red, `Sorry **${message.author.username}**, I couldn't find that item.`));
        }   
    }//end of role option
    else if(args[0].toUpperCase() === 'SKIN') {

        if(!args[1]) {
            return message.channel.send(embedWrapper(palette.darkmatte, `**${message.author.username}**, please specify the skin name.`));
        }

        const targetItem = (message.content.substring(10)).toUpperCase();
        registerItems(items.SKINS, targetItem);

        if(targetItem === itemName) {
            sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
            if(userdatarow.artcoins < parseInt(itemPrice))return message.channel.send(embedWrapper(palette.red,`Sorry! it seems you don't have enough artcoins. :(`));
            if(userdatarow.artcoins >= parseInt(itemPrice)) {
                purchase.getInterface(itemValue, message.author);
                purchase.withdraw(itemPrice, message.author);
                return message.channel.send(embedWrapper(palette.lightgreen, `Awesome! **${message.author.username}** has bought **${itemValue} skin!**`));
            }
            })
        }
        else {
            return message.channel.send(embedWrapper(palette.red, `Sorry **${message.author.username}**, I couldn't find that item.`));
        }       
    }//end of role option
    else {
        return message.channel.send(embedWrapper(palette.darkmatte, `Could you please specify the category? (ex: \`${config.prefix}buy\` \`role\` \`baka\`)`));
    } 
}
    else {
        return message.channel.send(embedWrapper(palette.darkmatte, `Here's the correct usage: \`${config.prefix}buy\` \`<category>\` \`<itemName>\``));
    } 
}

            
module.exports.help = {
    name:"buy",
        aliases:[]
}