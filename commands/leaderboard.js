const Discord = require('discord.js');
const palette = require('../colorset.json');
const config = require('../botconfig.json');

const sql = require("sqlite");
sql.open(".data/database.sqlite");


module.exports.run = async(bot,command, message, args)=> {

/// leaderboard.js
///
///    LEADERBOARD COMMAND
///    changes log:
///    11/12/18 - Interface reworks.
///    10/24/18 - Added AC ranking, structure & embed changes.
///    10/18/18(2) - Mention bug fix.
///    10/18/18 - New command.
///
///  -naphnaphz


let boardEmbed = new Discord.RichEmbed();
let boardEmbed2 = new Discord.RichEmbed();


    /*
        * Get author XP and AC data.

    */
    async function sqlGetAuthorXP() {

        return sql.get(`SELECT * FROM userdata WHERE userId="${message.author.id}"`)
            .then(async x => x.currentexp )
    }

    async function sqlGetAuthorAC(user) {
        return sql.get(`SELECT * FROM userdata WHERE userId= ${user}`)
        .then(async x => x.artcoins )
    }






    /*
        * Get users data (ID, curxp, lvl, ac) from mentioned index.

    */

    async function sqlGetIdArtCoins(index) {
        return sql.all(`SELECT userId FROM userdata ORDER BY artcoins DESC`)
        .then(async x => x[index].userId )

    }

    async function sqlGetIdXp(index) {
        return sql.all(`SELECT userId FROM userdata ORDER BY currentexp DESC`)
        .then(async x => x[index].userId )

    }


    async function sqlGetCurrentXP(index) {
        return sql.all(`SELECT currentexp FROM userdata ORDER BY currentexp DESC`)
        .then(async x => x[index].currentexp )
        
    }

    async function sqlGetLevel(index) {
        return sql.all(`SELECT level FROM userdata ORDER BY currentexp DESC`)
        .then(async x => x[index].level )
        
    }

     async function sqlGetAC(index) {
        return sql.all(`SELECT artcoins FROM userdata ORDER BY artcoins DESC`)
        .then(async x => x[index].artcoins )
        
    }



    /*
        * Get Total length from respective row
        * Artcoins & Current xp;

    */
    async function sqlCountingIndexArtcoins() {
        return sql.all(`SELECT level FROM userdata ORDER BY artcoins DESC`)
        .then(async x => x.length )
    }

    async function sqlCountingIndexExp() {
        return sql.all(`SELECT level FROM userdata ORDER BY currentexp DESC`)
        .then(async x => x.length )
    }





    /*
        * Get user index position from respective sorts.
        * Artcoins & Current xp;
    */
    async function sqlGetAuthorIndexByArtCoins() {
        return sql.all(`SELECT userId FROM userdata ORDER BY artcoins DESC`)
        .then(async x => x.findIndex(z => z.userId === message.author.id))
    }

    async function sqlGetAuthorIndexByExp() {
        return sql.all(`SELECT userId FROM userdata ORDER BY currentexp DESC`)
        .then(async x => x.findIndex(z => z.userId === message.author.id))
    }






    async function parseMention(id) {
        return message.guild.members.get(id).displayName;
    }

    function threeDigitComma(val) {
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }


    function ordinal_suffix_of(i) {
        var j = i % 10,
            k = i % 100;
        if (j == 1 && k != 11) {
            return i + "st";
        }
        if (j == 2 && k != 12) {
            return i + "nd";
        }
        if (j == 3 && k != 13) {
            return i + "rd";
        }
        return i + "th";
    }



if(!args[0]) {
    boardEmbed.setColor(palette.halloween)
    boardEmbed.setDescription(`**${message.author.username}**, here's how to use the command :\n
        \`${config.prefix}lb xp\` (*for XP leaderboard*)
        \`${config.prefix}lb ac\` (*for AC leaderboard*)`)
    boardEmbed.setFooter(`Leaderboard`, message.author.displayAvatarURL)

    return message.channel.send(boardEmbed)

}

else if(args[0].includes('ac')) {
        let authorIndex = await sqlGetAuthorIndexByArtCoins();
        let authorAC = await sqlGetAuthorAC(message.author.id);
        let artcoinsemoji = bot.emojis.find((x) => x.name === "ArtCoins");

        let firstRank = {
            ac: await sqlGetAC(0),
            id: await sqlGetIdArtCoins(0)
        }

        let secondRank = {
            ac: await sqlGetAC(1),
            id: await sqlGetIdArtCoins(1)
        }

        let thirdRank = {
            ac: await sqlGetAC(2),
            id: await sqlGetIdArtCoins(2)
        }

        let fourthRank = {
            ac: await sqlGetAC(3),
            id: await sqlGetIdArtCoins(3)
        }

        let fifthRank = {
            ac: await sqlGetAC(4),
            id: await sqlGetIdArtCoins(4)
        }

        let sixthRank = {
            ac: await sqlGetAC(5),
            id: await sqlGetIdArtCoins(5)
        }

        let seventhRank = {
            ac: await sqlGetAC(6),
            id: await sqlGetIdArtCoins(6)
        }

        let eighthRank = {
            ac: await sqlGetAC(7),
            id: await sqlGetIdArtCoins(7)
        }

        let ninethRank = {
            ac: await sqlGetAC(8),
            id: await sqlGetIdArtCoins(8)
        }

        let tenthRank = {
            ac: await sqlGetAC(9),
            id: await sqlGetIdArtCoins(9)
        }




        boardEmbed2.setColor(palette.halloween)
        boardEmbed2.setDescription(`You are **${ordinal_suffix_of(authorIndex+1)}** from a total of **${await sqlCountingIndexArtcoins()}** users. Your current artcoins is : ${artcoinsemoji} **${threeDigitComma(authorAC)}**.`)
        boardEmbed2.setFooter(`${message.author.username} | Artcoins Leaderboard`, message.author.displayAvatarURL)

        boardEmbed.setColor(palette.darkmatte)
        boardEmbed.setDescription(`

            [ **1** ]- \`${await parseMention(firstRank.id)}\`
                       ∟...... ${artcoinsemoji} **${threeDigitComma(firstRank.ac)}**\n 
            [ **2** ]- \`${await parseMention(secondRank.id)}\`
                       ∟...... ${artcoinsemoji} **${threeDigitComma(secondRank.ac)}**\n
            [ **3** ]- \`${await parseMention(thirdRank.id)}\`
                       ∟...... ${artcoinsemoji} **${threeDigitComma(thirdRank.ac)}**\n
            [ **4** ]- \`${await parseMention(fourthRank.id)}\`
                       ∟...... ${artcoinsemoji} **${threeDigitComma(fourthRank.ac)}**\n
            [ **5** ]- \`${await parseMention(fifthRank.id)}\`
                       ∟...... ${artcoinsemoji} **${threeDigitComma(fifthRank.ac)}**\n
            [ **6** ]- \`${await parseMention(sixthRank.id)}\`
                       ∟...... ${artcoinsemoji} **${threeDigitComma(sixthRank.ac)}**\n
            [ **7** ]- \`${await parseMention(seventhRank.id)}\`
                       ∟...... ${artcoinsemoji} **${threeDigitComma(seventhRank.ac)}**\n
            [ **8** ]- \`${await parseMention(eighthRank.id)}\`
                       ∟...... ${artcoinsemoji} **${threeDigitComma(eighthRank.ac)}**\n
            [ **9** ]- \`${await parseMention(ninethRank.id)}\`
                       ∟...... ${artcoinsemoji} **${threeDigitComma(ninethRank.ac)}**\n
            [ **10** ]- \`${await parseMention(tenthRank.id)}\`
                       ∟...... ${artcoinsemoji} **${threeDigitComma(tenthRank.ac)}**\n
            `)


            return message.channel.send(boardEmbed).then(() =>
                message.channel.send(boardEmbed2))
    }




else if(args[0].includes('xp')) {

        let authorIndex = await sqlGetAuthorIndexByExp();
        let authorExp = await sqlGetAuthorXP();


        let firstRank = {
            xp: await sqlGetCurrentXP(0),
            lv: await sqlGetLevel(0),
            id: await sqlGetIdXp(0)
        }

        let secondRank = {
            xp: await sqlGetCurrentXP(1),
            lv: await sqlGetLevel(1),
            id: await sqlGetIdXp(1)
        }

        let thirdRank = {
            xp: await sqlGetCurrentXP(2),
            lv: await sqlGetLevel(2),
            id: await sqlGetIdXp(2)
        }

        let fourthRank = {
            xp: await sqlGetCurrentXP(3),
            lv: await sqlGetLevel(3),
            id: await sqlGetIdXp(3)
        }

        let fifthRank = {
            xp: await sqlGetCurrentXP(4),
            lv: await sqlGetLevel(4),
            id: await sqlGetIdXp(4)
        }

        let sixthRank = {
            xp: await sqlGetCurrentXP(5),
            lv: await sqlGetLevel(5),
            id: await sqlGetIdXp(5)
        }

        let seventhRank = {
            xp: await sqlGetCurrentXP(6),
            lv: await sqlGetLevel(6),
            id: await sqlGetIdXp(6)
        }

        let eighthRank = {
            xp: await sqlGetCurrentXP(7),
            lv: await sqlGetLevel(7),
            id: await sqlGetIdXp(7)
        }

        let ninethRank = {
            xp: await sqlGetCurrentXP(8),
            lv: await sqlGetLevel(8),
            id: await sqlGetIdXp(8)
        }

        let tenthRank = {
            xp: await sqlGetCurrentXP(9),
            lv: await sqlGetLevel(9),
            id: await sqlGetIdXp(9)
        }

        boardEmbed2.setColor(palette.halloween)
        boardEmbed2.setDescription(`You are **${ordinal_suffix_of(authorIndex+1)}** from a total of **${await sqlCountingIndexExp()}** users. Your current xp is : **${threeDigitComma(authorExp)}**.`)
        boardEmbed2.setFooter(`${message.author.username} | XP Leaderboard`, message.author.displayAvatarURL)

        boardEmbed.setColor(palette.darkmatte)
        boardEmbed.setDescription(`
            [ **1** ]- \`${await parseMention(firstRank.id)}\`
            ∟......  **LV ${firstRank.lv}** | **${threeDigitComma(firstRank.xp)}**\n
            [ **2** ]- \`${await parseMention(secondRank.id)}\`
            ∟......  **LV ${secondRank.lv}** | **${threeDigitComma(secondRank.xp)}**\n
            [ **3** ]- \`${await parseMention(thirdRank.id)}\`
            ∟......  **LV ${thirdRank.lv}** | **${threeDigitComma(thirdRank.xp)}**\n 
            [ **4** ]- \`${await parseMention(fourthRank.id)}\`
            ∟......  **LV ${fourthRank.lv}** | **${threeDigitComma(fourthRank.xp)}**\n
            [ **5** ]- \`${await parseMention(fifthRank.id)}\`
            ∟......  **LV ${fifthRank.lv}** | **${threeDigitComma(fifthRank.xp)}**\n
            [ **6** ]- \`${await parseMention(sixthRank.id)}\`
            ∟......  **LV ${sixthRank.lv}** | **${threeDigitComma(sixthRank.xp)}**\n
            [ **7** ]- \`${await parseMention(seventhRank.id)}\`
            ∟......  **LV ${seventhRank.lv}** | **${threeDigitComma(seventhRank.xp)}**\n
            [ **8** ]- \`${await parseMention(eighthRank.id)}\`
            ∟......  **LV ${eighthRank.lv}** | **${threeDigitComma(eighthRank.xp)}**\n
            [ **9** ]- \`${await parseMention(ninethRank.id)}\`
            ∟......  **LV ${ninethRank.lv}** | **${threeDigitComma(ninethRank.xp)}**\n
            [ **10** ]- \`${await parseMention(tenthRank.id)}\`
            ∟......  **LV ${tenthRank.lv}** | **${threeDigitComma(tenthRank.xp)}**\n         
            `)


            return message.channel.send(boardEmbed).then(() =>
                message.channel.send(boardEmbed2))

    }

}
module.exports.help = {
    name:"lb",
        aliases:[]
}