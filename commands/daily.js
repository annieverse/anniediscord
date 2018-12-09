const Discord = require('discord.js');
const ms = require('parse-ms');
const palette = require('../colorset.json');

const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot,command,message,args)=>{

    /// dailyjs
    ///
    ///  daily command
    ///    change logs:
    ///       11/12/18 - Original colorset.
    ///       10/18/18 - halloween colorset
    ///       10/12/18 - Minor embed changes.
    ///       09/17/18 - Frying Pan's daily system.
    ///       09/18/18 - reworked embed.
    ///
    ///     -naphnaphz
    ///     -Frying Pan


        let cooldown = 8.64e+7;
        let amount = 250;

        const botcon = message.author.displayAvatarURL;

        let dailyEmbed = new Discord.RichEmbed();
        dailyEmbed.setFooter(`${message.author.username}  |  Daily Attendance`, botcon)

        sql.get(`SELECT * FROM usercheck WHERE userId ="${message.author.id}"`).then(async usercheckrow => {

         if (usercheckrow) {

            if ((usercheckrow.lastDaily !== null) && cooldown - (Date.now() - usercheckrow.lastDaily) > 0 ) {
                let timeObj = ms(cooldown - (Date.now() - usercheckrow.lastDaily));

                dailyEmbed.setColor('#ad3632')
                dailyEmbed.setDescription(`Your daily resets in \`${timeObj.hours} hours, ${timeObj.minutes} minutes and ${timeObj.seconds} seconds.\``)

               return message.channel.send(dailyEmbed);
            }
            else {

                sql.run(`UPDATE usercheck SET lastDaily = "${Date.now()}" WHERE userId = ${message.author.id}`);
                sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
                    sql.run(`UPDATE userdata SET artcoins = "${amount + userdatarow.artcoins}" WHERE userId = ${message.author.id}`);

                dailyEmbed.setColor(palette.halloween)
                dailyEmbed.setDescription(`Here's your daily **${amount}** <:ArtCoins:467184620107202560> !! `)

                return message.channel.send(dailyEmbed);

                })
             }
         }
    })
}
    module.exports.help={
    name:"daily",
        aliases:[]
}