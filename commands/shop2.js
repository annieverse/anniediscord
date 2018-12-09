const Discord = require('discord.js');
const fs = require('fs');
const items = JSON.parse(fs.readFileSync('items.json','utf8'));

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
let bicon = bot.user.displayAvatarURL
const embedShop = new Discord.RichEmbed()

if (["roles-shop"].includes(message.channel.name)) {
             let categories = []; // Lets define categories as an empty array so we can add to it.
          

        if (!args.join(" ")) { // Run if no item specified...


            for (var i in items) { 

                if (!categories.includes(items[i].type)) {
                    categories.push(items[i].type)
                }   
            }
  

            for (var i = 0; i < categories.length; i++) { 
              var tempDesc = ''; 

                for (var c in items) { 
                    if (categories[i] === items[c].type) {

                        let priceRange = items[c].price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

                        tempDesc += `<:ArtCoins:467184620107202560> ${priceRange} - **${items[c].rolename}**\n`; 

                    }

                  }

                  
                 embedShop.addField(categories[i], tempDesc);           


                }

                embedShop.setDescription(`**Welcome to the Second Shop!**
                You can purchase various roles here!\n`)
                embedShop.setThumbnail(bicon)
                embedShop.setColor(0xD4AF37)
                embedShop.setFooter(`Second Shop Merchant | Anime Artist United`, bicon)

            return message.channel.send(embedShop)

  }
}
                embedShop.setDescription(`This command is only available in ${message.guild.channels.get('464180867083010048').toString()}.`)
                embedShop.setColor(0xD4AF37)
                embedShop.setFooter(`Second Shop Merchant | Anime Artist United`, bicon)

            return message.channel.send(embedShop)
}
module.exports.help = {
    name:"r.shop",
        aliases:[]
}