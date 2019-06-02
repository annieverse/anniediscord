const Discord = require("discord.js");
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async (bot, command, message, args, utils) => {

        //  payToRole.js
        //      
        //      PAY TO ROLE COMMAND
        //      changes log:
        //          09/22/18 - bug fixes.
        //          09/20/18 - Embed reworks & Added receipt.
        //          09/16/18 - Frying Pan's made the prototype.
        //
        // 

const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

let payEmbed = new Discord.RichEmbed();
let payEmbedReceipt = new Discord.RichEmbed();
let authorReceipt = new Discord.RichEmbed();

let botcon = bot.user.displayAvatarURL;

function randomString(length, chars) { 
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
}

var transactionCode2 = randomString(5, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
var transactionCode = randomString(2, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');


    payEmbed.setColor('#d81e1e')
    payEmbed.setDescription(`You don't have authorization to use this command.`)
    payEmbed.setFooter(`Anime Artist United | Pay to Role`, botcon)
    if(!message.member.hasPermission("MANAGE_ROLES"))return message.channel.send(payEmbed);

        if(!args[0]) {

                payEmbed.setColor('#d81e1e')
                payEmbed.setDescription(`Can you specify the role please?`)
                payEmbed.setFooter(`Anime Artist United  |  Pay to Role`, botcon)

                 return message.channel.send(payEmbed);
            
        }

    let roleName = args[0].substring(3, 21);

    let membersWithRole = message.guild.members.filter(member => {
        return member.roles.get(roleName);
    }).map(member => {
        return member.user.id;
    });

    let nicknameWithRole = message.guild.members.filter(member => {
        return member.roles.get(roleName);
    }).map(member => {
        return member.user.tag;
    });
        

                if(!args[1]) {

                payEmbed.setColor('#d81e1e')
                payEmbed.setDescription(`${message.author.username}, please put the number.`)
                payEmbed.setFooter(`Anime Artist United  |  Pay to Role`, botcon)

                 return message.channel.send(payEmbed);
            
        }


    sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
     if(userdatarow.artcoins < (args[1] * membersWithRole.length) ) {
                payEmbed.setColor('#d81e1e')
                payEmbed.setDescription(`${message.author.username}, you don't have enough balance to continue this transaction. :(`)
                payEmbed.setFooter(`Anime Artist United  |  Pay to Role`, botcon)

               return message.channel.send(payEmbed);
            }
        

//
//End of args checks
//
else {
    //Filtering the guild members only keeping those with the role
    //Then mapping the filtered array to their usernames
    

   function sleep(ms){
        return new Promise(resolve => setTimeout(resolve,ms));
    }

    payEmbed.setColor('#2d2d2d')
    payEmbed.setDescription(`⚙ | *Querying ${membersWithRole.length} users ..*`)

    message.channel.send(payEmbed).then(async msg => {
    let loop=true;
    let i = 0;
    while (loop){
        if (i<membersWithRole.length){

            sql.get(`SELECT * FROM userdata WHERE userId = "${membersWithRole[i]}"`).then(async userdatarow => {
                
                sql.run(`UPDATE userdata SET artcoins = "${userdatarow.artcoins + parseInt(args[1])}" WHERE userId = ${membersWithRole[i]}`);

                        });
            
            await sleep(1000)
            console.log(membersWithRole[i]);
            i++;
            payEmbed.setDescription(`⚙ | *Querying ${i}/${membersWithRole.length} users ..*
                \`${nicknameWithRole[i]}\`
                \`ID:${membersWithRole[i]}\``)
                msg.edit(payEmbed);

            if(i == membersWithRole.length) {
                payEmbed.setDescription(`⚙ | *Query finished!*`)
                msg.edit(payEmbed)

            }
        }


         else {
            
            sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
                sql.run(`UPDATE userdata SET artcoins = "${userdatarow.artcoins - (args[1] * membersWithRole.length)}" WHERE userId = ${message.author.id}`);
            });
            

            loop = false;
            let timestamp = new Date();
            let digitValue = args[1].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            let multiplied = args[1] * membersWithRole.length;
            let multiplyDigit = multiplied.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

            payEmbedReceipt.setColor('#4df9a3')
            payEmbedReceipt.setDescription(`
                ✅ | Transaction successful.
                ${timestamp}\n
                Transaction ID : ${transactionCode}-${transactionCode2}\n
                TRANSFER
                TO ACCOUNT:  \`${roleName}\`\n
                Name :  
                **${nicknameWithRole.join(`\n`)}**\n

                Value : <:ArtCoins:467184620107202560> **${digitValue}**\n
                This message is automatically generated after you made a
                successful payment with other user.\n
                DM: Kitomi#0077 / Poppy#7929 / naphnaphz#7790
                `)
             payEmbedReceipt.setFooter(`Anime Artist United  |  Bank`, botcon)

             authorReceipt.setColor('#4df9a3')
             authorReceipt.setDescription(`
                <:ArtCoins:467184620107202560> **${multiplyDigit}** has been deducted from your balance.
                `)
             authorReceipt.setFooter(`Anime Artist United  |  Bank`, botcon)

             return message.author.send(authorReceipt).then(() =>
                message.channel.send(payEmbedReceipt))
                }
            }
        })
     }
 })
}

module.exports.help = {
    name:"payrole",
        aliases:[]
}