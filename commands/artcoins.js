const Discord = require('discord.js');
const palette = require('../colorset.json');

const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot,command,message,args)=>{

    /// artcoins.js
    ///
    ///  balance command
    ///    change logs:
    ///         11/12/18 - interface reworks.
    ///         10/18/18 - halloween palette.
    ///
    ///     -naphnaphz
    ///     -Frying Pan
  /*
  REFERENCE FOR OTHER FILES:
  
    const src = require('./artcoins');
    let aliases = src.help.aliases[0];
      if(aliases == command){
        message.channel.send("ji");
      }
  */
  
function threeDigitsComa(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
}


async function userResolvable(input) {

        const userPattern = /^(?:<@!?)?([0-9]+)>?$/;

        if(userPattern.test(input)) input = input.replace(userPattern, '$1');
        let members = message.guild.members;
        const filter = member => member.user.id === input
            || member.displayName.toLowerCase() === input.toLowerCase()
            || member.user.username.toLowerCase() === input.toLowerCase()
            || member.user.tag.toLowerCase() === input.toLowerCase();

        return members.filter(filter).first();
    }




if(!args[0]){

   sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => { 

    let parsedName = capitalizeFirstLetter(message.author.username);
    let digitValue = threeDigitsComa(userdatarow.artcoins);
    let coinEmbed = new Discord.RichEmbed()
    .setColor(palette.halloween)
    .setDescription(`**${parsedName}'s Balance** : <:ArtCoins:467184620107202560> ${digitValue} Artcoins`)
        return message.channel.send(coinEmbed);
    })
}




if(args[0]){

    let user = await userResolvable(args[0]);

    sql.get(`SELECT * FROM userdata WHERE userId =${user.id}`)
    .then(async userdatarow => {

    let digitValue = threeDigitsComa(userdatarow.artcoins);
    let parsedName = capitalizeFirstLetter(user.user.username);

    const acoinEmbed = new Discord.RichEmbed()
    .setColor(palette.halloween)
    .setDescription(`**${parsedName}'s Balance** : <:ArtCoins:467184620107202560> ${digitValue} Artcoins`)

        return message.channel.send(acoinEmbed);

    })
  }
}


module.exports.help = {
    name:"balance",
    aliases:["bal","name2","name3","naphLovesThis"]
}