const Discord = require("discord.js");
const sql = require("sqlite");
sql.open('.data/database.sqlite');

module.exports.run = async (...ArrayStacks) => {

    /// addmoney.js
    ///
    ///  ADDMONEY COMMAND
    ///     change logs :
    ///      09/14/18 - minor bug fixes.
    ///      09/17/18 - name property changes (addmoney(prev) => addac(new))
    
    ///     -naphnaphz

    /// the same thing as i put addxp command.

    let bicon = bot.user.displayAvatarURL;
    let pUser  = message.guild.member(message.mentions.users.first()||message.guild.members.get(args[0]));
    let mentionedUser = message.mentions.users.first();
    let time = new Date();
    
let addXpEmbed = new Discord.RichEmbed();
let addXpEmbed2 = new Discord.RichEmbed();
let addXpEmbed3 = new Discord.RichEmbed();
let addXpEmbed4 = new Discord.RichEmbed();
let addXpEmbed5 = new Discord.RichEmbed();

    addXpEmbed.setColor('#d61313')
    addXpEmbed.setDescription(`You don't have authorization to use this command.`)
    addXpEmbed.setFooter(`Anime Artist United | Add AC`, bicon)

  if(!message.member.roles.find(r => (r.name === 'Grand Master') 
                                  || (r.name === 'Tomato Fox'))) return message.channel.send(addXpEmbed);
 
sql.get(`SELECT artcoins FROM userinventories WHERE userId ="${pUser.id}"`).then(async () => {

    if(!args[1]){
        addXpEmbed.setColor('#d30000')
        addXpEmbed.setDescription(`Please put the number.`)
        addXpEmbed.setFooter(`Anime Artist United | Add XP`, bicon)
        return message.channel.send(addXpEmbed);
    }


    sql.get(`SELECT artcoins from userinventories WHERE userId ="${pUser.id}"`).then(async userdatarow => {
       let parsedData = parseInt(args[1]) + userdatarow.artcoins;


                 sql.run(`UPDATE userinventories SET artcoins = ${parsedData} WHERE userId = ${pUser.id}`)


        addXpEmbed.setColor('#595959')
        addXpEmbed.setDescription(`⚙ | Calculating your art coins .\n
            0% | *initializing,.*`)
        addXpEmbed.setFooter(`Anime Artist United | Add AC`, bicon)

        addXpEmbed2.setColor('#595959')
        addXpEmbed2.setDescription(`⚙ | Calculating your art coins ..\n
            50% | *retrieving data ..*\n
            ID: ${pUser.id}`)
        addXpEmbed2.setFooter(`Anime Artist United | Add AC`, bicon)

        addXpEmbed3.setColor('#595959')
        addXpEmbed3.setDescription(`⚙ | Calculating your art coins ...\n
            90% | *processing ..*\n
            ID: ${pUser.id}
            *estimating account balance. .*`)
        addXpEmbed3.setFooter(`Anime Artist United | Add AC`, bicon)


        addXpEmbed4.setColor('#595959')
        addXpEmbed4.setDescription(`⚙ | Calculating your art coins .\n
            99% | *finishing ..*\n
            ID: ${pUser.id}
            *art_coins updated.*
            `)
        addXpEmbed4.setFooter(`Anime Artist United | Add AC`, bicon)

        let coinsDigit = parsedData.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        addXpEmbed5.setColor('#20e554')
        addXpEmbed5.setThumbnail(mentionedUser.displayAvatarURL)
        addXpEmbed5.setDescription(`✅ | Data updated.`)
        addXpEmbed5.addField('Username', `${pUser.displayName}\n\`${pUser.id}\``)
        addXpEmbed5.addField('BALANCE', `${coinsDigit}`,true)
        addXpEmbed5.setFooter(`Anime Artist United | Add AC on ${time}`, bicon)



    
        return message.channel.send(addXpEmbed).then((msg)=>
            msg.edit(addXpEmbed2)).then((msg)=>
            msg.edit(addXpEmbed3)).then((msg)=>
            msg.edit(addXpEmbed4)).then((msg)=>
            msg.edit(addXpEmbed5)).then(()=>
            console.log(`${message.author.username} has given ${args[1]} ART_COINS to ${mentionedUser.username}`))
    })
})
}
    
    module.exports.help = {
        name: "addac",
        aliases: [],
        description: `Add artcoins to specific user.`,
        usage: `>addac @user <amount>`,
        group: "Admin",
        public: true,
    }