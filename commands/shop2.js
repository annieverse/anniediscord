const Discord = require('discord.js');
const palette = require('../colorset.json');
const formatManager = require('../utils/formatManager');
const databaseManager = require('../utils/databaseManager');
const sql = require("sqlite");
sql.open('.data/database.sqlite');

module.exports.run = async(bot, command, message,args) =>{
/// shop2.js
///
///     SHOP2 COMMAND
///    changes log:
///     10/19/18 - integrated with buy.js updates.
///     09/29/18 - old roles shop.
///

const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

const format = new formatManager(message);
const collection = new databaseManager(message.author.id);

const moji = (mojiname) => {
    return bot.emojis.find((x) => x.name === mojiname) 
}

const registerItems = (source, target, emoji=moji('artcoins')) => {
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
                  tempDesc += `${emoji} ${priceRange} - **${source[c].name}**\n`; 
              }
            }
           target.addField(categories[i], tempDesc);           
    }
}


if (["roles-shop"].includes(message.channel.name)) {
  if (!args.join(" ")) { 

       const page1 = new Discord.RichEmbed();

       const links = {
           roles: "https://i.redd.it/79disx5z5c8x.jpg"
       };

          page1.setDescription(`**Welcome to the Second Shop!**
          You can buy various roles in here!\n`)
          page1.setColor(palette.darkmatte)
          page1.setImage(links.roles)
          page1.setFooter(`Type >buy role <rolename> to buy one of the listed role above.`)
          registerItems(await collection.classifyItem('Roles'), page1);
        
          /*
          page2.setDescription(`**Special Holiday roles!**!\n`)
          page2.setColor(palette.darkmatte)
          page2.setImage('https://media.discordapp.net/attachments/508385654259056660/527588146007769102/Holiday_shop_banner.png?width=1006&height=478')
          page2.setFooter(`Type >buy role <rolename> to buy one of the listed role above.`)
          registerItems(await collection.classifyItem('Seasonal Roles'), page2, moji('candycane'));
          */

          return message.channel.send(page1)

          /* // paged functions
          .then(msg => {
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
                  if(count == 1) { msg.edit(page1) }
                  else { count++ }

                });
                forwards.on('collect',  r => {
                  r.remove(message.author)
                  count++
                  if(count == 2) { msg.edit(page2) } 
                  else { count-- }

                });

                setTimeout(() => {
                    msg.clearReactions();
                }, 60000)
            })
          })
          */
  }


} 
else {
    return format.embedWrapper(palette.darkmatte, `This shop only available in ${message.guild.channels.get('464180867083010048').toString()}.`)
}
}
module.exports.help = {
    name:"r.shop",
        aliases:[]
}