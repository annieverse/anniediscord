const Discord = require("discord.js");
const palette = require('../colorset.json');
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot,command, message,args)=>{

let payEmbed = new Discord.RichEmbed();
let botcon = bot.user.displayAvatarURL;
let user = message.mentions.users.first();


function randomString(length, chars) { 
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
}

var transactionCode2 = randomString(5, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
var transactionCode = randomString(2, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');

  function getUserDataLvl(user) {

             return sql.get(`SELECT * FROM userdata WHERE userId ="${user.id}"`)
             .then(data => data.level);

             }
  
const userLvl = await getUserDataLvl(message.member);
if(userLvl<6)return message.channel.send("I'm sorry, your level isn't high enough to use this command")
//.comparePositionTo(role)

sql.get(`SELECT * FROM userdata WHERE userId = "${message.author.id}"`).then(async userdatarow => {
if(!args[0]) {
            payEmbed.setColor(palette.darkmatte)
            payEmbed.setDescription(`**${message.author.username}**, here's how to use pay command :
                \`>pay\`  \`@user\`  \`value\``)
            payEmbed.setFooter(`Anime Artist United  |  Bank`, botcon)

    return message.channel.send(payEmbed);
}


else if(!args[1]) {

                payEmbed.setColor(palette.red)
                payEmbed.setDescription(`${message.author.username}, please put the number.`)
                payEmbed.setFooter(`Anime Artist United  |  Bank`, botcon)

                 return message.channel.send(payEmbed);
            
        }

else if(args[1].includes(user.id)) { 
            let timestamp = new Date();

                payEmbed.setColor(palette.red)
                payEmbed.setDescription(`
                ❌ | Transaction failed.
                ${timestamp}\n
                
                ID: \`${message.author.id} / ${message.author.tag}\`
                REASON: \`WRONG FORMAT.\`

                `)
                payEmbed.setFooter(`Anime Artist United  |  Bank`, botcon)

                 return message.channel.send(payEmbed);
            
        }



else if(args[0].includes(message.author.id)) {

                payEmbed.setColor(palette.red)
                payEmbed.setDescription(`I know what you did there,. ${message.author.username}.`)
                payEmbed.setFooter(`Anime Artist United  |  Bank`, botcon)

                return message.channel.send(payEmbed);
            
        }


      else if(userdatarow.artcoins < args[1])  {
        let timestamp = new Date();
                payEmbed.setColor(palette.red)
                payEmbed.setDescription(`
                ❌ | Transaction failed.
                ${timestamp}\n
                
                ID: \`${message.author.id} / ${message.author.tag}\`
                REASON: \`NOT ENOUGH BALANCE.\`

                `)
                payEmbed.setFooter(`Anime Artist United  |  Bank`, botcon)

                return message.channel.send(payEmbed)
        }
       
    

else if((args[1]) && (!args[1].includes(user.id)) && (args[0] !== message.author.id)) {

        sql.run(`UPDATE userdata SET artcoins = ${userdatarow.artcoins - parseInt(args[1])} WHERE userId = ${message.author.id}`);

        sql.get(`SELECT * FROM userdata WHERE userId ="${user.id}"`).then(async userdatarow => {
        sql.run(`UPDATE userdata SET artcoins = ${userdatarow.artcoins + parseInt(args[1])} WHERE userId = ${user.id}`);

        let timestamp = new Date();

        let digitValue = args[1].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

            payEmbed.setColor('#4df9a3')
            payEmbed.setDescription(`
                ✅ | Transaction successful.
                ${timestamp}\n
                Transaction ID : ${transactionCode}-${transactionCode2}\n
                TRANSFER
                TO ACCOUNT:  \`${user.id}\`\n
                Name :  **${user.username}**\n
                Value : <:ArtCoins:467184620107202560> **${digitValue}**\n
                This message is automatically generated after you made a
                successful payment with other user.\n

                If you have any trouble, please DM: Kitomi#0077 / Poppy#7929 / naphnaphz#7790
                `)
            payEmbed.setFooter(`Anime Artist United  |  Bank`, botcon)


            return message.channel.send(payEmbed).then(()=>
            console.log(`Transaction successful. ID : ${message.author.username}, ${user.username}`))

        })
    }
    })




}
module.exports.help = {
    name:"pay",
        aliases:[]
}