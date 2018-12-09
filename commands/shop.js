const Discord = require('discord.js');
const palette = require('../colorset.json');
const fs = require('fs');
const items = JSON.parse(fs.readFileSync('genItems.json','utf8'));
const formatManager = require('../utils/formatManager');

const sql = require("sqlite");
sql.open('.data/database.sqlite');

module.exports.run = async(bot, command, message,args) =>{
/// shop.js
///
///     SHOP COMMAND
///    changes log:
///
///     12/02/18 - Interface revamp, simplifed structure & added multiple pages.
///     10/19/18 - integrated with buy.js updates.
///     09/17/18 - huge reworks in shop system. later will be divided by 2 kinds of shop.
///     09/29/18 - changed items.type from "ticket" -> "Tickets:"   -requested by FloofyFox

///     -naphnaphz

const format = new formatManager();

const registerItems = (source, target) => {
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
                  tempDesc += `<:ArtCoins:467184620107202560> ${priceRange} - **${source[c].rolename}**\n\`${source[c].desc}\`\n\n`; 
              }
            }
           target.addField(categories[i], tempDesc);           
          }
}
    

  if (!args.join(" ")) { 

       const page1 = new Discord.RichEmbed();
       const page2 = new Discord.RichEmbed();
       const page3 = new Discord.RichEmbed();

          page1.setDescription(`**Welcome to the General Shop!**
          These are the general items you can buy with AC!\n`)
          page1.setThumbnail(bot.user.displayAvatarURL)
          page1.setColor(palette.halloween)
          page1.setFooter(`Type >buy role <rolename> to buy one of the listed ticket above.`)
          registerItems(items.TICKETS, page1);

          page2.setDescription(`**Customize your card color!**`)
          page2.setThumbnail(bot.user.displayAvatarURL)
          page2.setColor(palette.halloween)
          page2.setFooter(`Type >buy skin <skinname> to buy one of the listed skin above`)
          registerItems(items.SKINS, page2)

          page3.setDescription(`**Grab some badges!**`)
          page3.setThumbnail(bot.user.displayAvatarURL)
          page3.setColor(palette.halloween)
          page3.setFooter(`Type >buy badge <badgename> to buy one of the listed badge above`)
          registerItems(items.BADGES, page3)

          message.channel.send(page1).then(msg => {
            msg.react('⏪').then(r => {
            msg.react('⏩')

                const backwardsFilter = (reaction, user) => (reaction.emoji.name === '⏪') && (user.id === message.author.id);
                const forwardsFilter = (reaction, user) => (reaction.emoji.name === '⏩') && (user.id === message.author.id);            

                const backwards = msg.createReactionCollector(backwardsFilter, { time: 60000 });
                const forwards = msg.createReactionCollector(forwardsFilter, { time: 60000 });
                let count = 1;

                backwards.on('collect', r => {
                  r.remove(message.author)
                  count--
                  if(count == 2) { msg.edit(page2) }
                  else if(count == 1) { msg.edit(page1) }
                  else { count++ }

                });
                forwards.on('collect',  r => {
                  r.remove(message.author)
                  count++
                  if(count == 2) { msg.edit(page2) } 
                  else if(count == 3) { msg.edit(page3) }
                  else { count-- }

                });

                setTimeout(() => {
                    msg.clearReactions();
                }, 60000)
            })
          })
  }
}
module.exports.help = {
    name:"shop",
        aliases:[]
}