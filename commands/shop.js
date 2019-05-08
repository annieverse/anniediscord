const Discord = require('discord.js');
const palette = require('../colorset.json');
const fs = require('fs');
const formatManager = require('../utils/formatManager');
const databaseManager = require('../utils/databaseManager');

const sql = require("sqlite");
sql.open('.data/database.sqlite');

module.exports.run = async(bot, command, message,args) =>{
/// shop.js
///
///     SHOP COMMAND
///    changes log:
///
///     02/26/19 - Ticket shop added.
///     12/02/18 - Interface revamp, simplifed structure & added multiple pages.
///     10/19/18 - integrated with buy.js updates.
///     09/17/18 - huge reworks in shop system. later will be divided by 2 kinds of shop.
///     09/29/18 - changed items.type from "ticket" -> "Tickets:"   -requested by FloofyFox

///     -naphnaphz

const format = new formatManager(message);

return ["naph-little-house"].includes(message.channel.name) ? initShop()
: format.embedWrapper(palette.darkmatte, `Unavailable access.`)


async function initShop() {
    const collection = new databaseManager(message.author.id);
    const moji = (mojiname) => {
         return bot.emojis.find((x) => x.name === mojiname) 
    }

    const registerItems = (source, target, emoji=moji('ArtCoins')) => {
        let categories = []; 

        for (var i in source) { 
              if (!categories.includes(source[i].type)) {
                  categories.push(source[i].type)
              }
          }


        for (var i = 0; i < categories.length; i++) { 
            var tempDesc = '';
              for (var c in source) { 
                  if (categories[i] === source[c].type) {
                      let priceRange = format.threeDigitsComa(source[c].price);
                      tempDesc += `${emoji} ${priceRange} - **${source[c].name}**\n\`${source[c].desc}\`\n\n`; 
                  }
                }
               target.addField(categories[i], tempDesc);           
        }
    }


    const links = {
              ticketshop: "https://i.ibb.co/7tBJ8t0/ticket1-banner.png",
              boostershop: "https://i.ibb.co/MDNG3LX/booster1-banner.png",
              holidaydiscount: "https://media.discordapp.net/attachments/459892157600366612/526452238424604682/XmasBonus.png?width=559&height=479",
              skinshop: "https://i.ibb.co/Mh6vsbz/SKINSHOP-NAPHNAPHZ.png",
              badgeshop: "https://i.ibb.co/6sXpgq6/badgeshop-naphnaphz.png",
              covershop: "https://i.ibb.co/PYcfFLR/shopcover-jan2019.png",
              packageshop: "https://i.ibb.co/N2Jx7W7/Holiday-shop.png"
    };



    //          WORKING ON NEW SHOP INTERFACE

    let registered_interface = [];
    async function interface(desc = "test", color = palette.darkmatte, footer = "footer", type = "Tickets", emoji = "ArtCoins", opt1 = undefined, opt2 = undefined) {
            const page = new Discord.RichEmbed()
                .setDescription(desc)
                .setColor(color)
                .setFooter(footer)
                registerItems(await collection.classifyItem(type, opt1, opt2), page, moji(emoji));

                registered_interface.push(page);
    }


        /*
           const page1 = new Discord.RichEmbed();
           const page2 = new Discord.RichEmbed();
           const page3 = new Discord.RichEmbed();
           const page4 = new Discord.RichEmbed();
           const page5 = new Discord.RichEmbed();

              page1.setDescription(`**Welcome to the General Shop!**
              These are the general items you can buy with AC!\n`)
                    .setImage(links.ticketshop)
                    .setColor(palette.darkmatte)
                    .setFooter(`[1 / 5] Type >buy ticket <ticketname> to buy one of the listed ticket above.`)
                    registerItems(await collection.classifyItem('Tickets', '_rowid_ < 3'), page1);

              page2.setDescription(`**Boost your social activities!**`)
                    .setImage(links.boostershop)
                    .setColor(palette.darkmatte)
                    .setFooter(`[2 / 5] Type >buy ticket <ticketname> to buy one of the listed booster above`)
                    registerItems(await collection.classifyItem('Tickets', '_rowid_ > 2', 'name DESC'), page2)

              page3.setDescription(`**Customize your card color!**`)
                    .setImage(links.skinshop)
                    .setColor(palette.darkmatte)
                    .setFooter(`[3 / 5] Type >buy skin <skinname> to buy one of the listed skin above`)
                    registerItems(await collection.classifyItem('Skins'), page3)

              page4.setDescription(`**Grab some badges!**`)
                    .setImage(links.badgeshop)
                    .setColor(palette.darkmatte)
                    .setFooter(`[4 / 5] Type >buy badge <badgename> to buy one of the listed badge above`)
                    registerItems(await collection.classifyItem('Badges'), page4)

              page5.setDescription(`**Beautify your profile cover!**`)
                    .setImage(links.covershop)
                    .setColor(palette.darkmatte)
                    .setFooter(`[5 / 5] Type >buy cover <covername> to buy one of the listed cover above`)
                    registerItems(await collection.classifyItem('Covers', 'price > 350'), page5)

                    */

            async function run() {
                await interface(`Lucky Ticket`, palette.darkmatte, `[1 / 7]`, `Unique`, `ArtCoins`, `price < 130`);
                await interface(`May Special Cover!`, palette.darkmatte, `[2 / 7]`, `Covers`, `magicalpaper`, `price < 2`);
                await interface(`These are our general items!`, palette.darkmatte, `[3 / 7]`, `Tickets`, `ArtCoins`,`_rowid_ < 3`);
                await interface(`Boost your social activities!`, palette.darkmatte, `[4 / 7]`, `Tickets`, `ArtCoins`, `_rowid_ > 2`, `name DESC`);
                await interface(`Customize your card theme!`, palette.darkmatte, `[5 / 7]`, `Skins`, `ArtCoins`);
                await interface(`Grab your artistic badges!`, palette.darkmatte, `[6 / 7]`, `Badges`, `ArtCoins`);
                await interface(`Beautify your profile cover!`, palette.darkmatte, `[7 / 7]`, `Covers`, `ArtCoins`, `price > 350`);



                message.channel.send(registered_interface[0])
                    .then(msg => {
                        msg.react('⏪').then(() => {
                        msg.react('⏩')

                        const backwardsFilter = (reaction, user) => (reaction.emoji.name === '⏪') && (user.id === message.author.id);
                        const forwardsFilter = (reaction, user) => (reaction.emoji.name === '⏩') && (user.id === message.author.id);            

                        const backwards = msg.createReactionCollector(backwardsFilter, { time: 60000 });
                        const forwards = msg.createReactionCollector(forwardsFilter, { time: 60000 });
                        let count = 0;

                        backwards.on('collect', r => {
                          r.remove(message.author)
                          count--

                            if(registered_interface[count]) { msg.edit(registered_interface[count]) }
                            else { count++ }

                        });
                        forwards.on('collect',  r => {
                          r.remove(message.author)
                          count++

                            if(registered_interface[count]) { msg.edit(registered_interface[count]) }
                            else { count-- }

                        });

                        setTimeout(() => {
                            msg.clearReactions();
                        }, 60000)
                    })
                })
            }

            return run();
}
}
module.exports.help = {
    name:">shop",
        aliases:[]
}