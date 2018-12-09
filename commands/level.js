const Discord = require('discord.js');
const botconfig = require("../botconfig");

const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot,command,message,args)=>{


    async function sqlGetUserIndex() {
        return sql.all(`SELECT userId FROM userdata ORDER BY currentexp DESC`)
        .then(async x => x.findIndex(z => z.userId === message.author.id))
    }


    /*
        * ordinal suffix credits to Salman. A
    */
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


let userIndex = await sqlGetUserIndex();
let lvlEmbed = new Discord.RichEmbed()
let bicon = bot.user.displayAvatarURL;

sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {


       if (!userdatarow) {
            sql.run("INSERT INTO userdata (userId, currentexp, maxexp, nextexpcurve, level, artcoins) VALUES (?, ?, ?, ?, ?, ?)", [message.author.id, 0, 100, 150, 0, 0])

                    lvlEmbed.setColor(0x550000)
                    lvlEmbed.setDescription(`✅ | New level account has been created.
                        Please re-type \`>level\`.`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

                    console.log(`new row created for ${message.author.username}.`)
                       return message.channel.send(lvlEmbed)
            }




    

        else if (userdatarow) {

            let difference = userdatarow.maxexp - userdatarow.currentexp;

            let currentExpDigit = userdatarow.currentexp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            let maxExpDigit = userdatarow.maxexp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            let differenceDigit = difference.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");


                if(userdatarow.level <= 1) {

                     message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Newblood").id)


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x550000)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Newblood",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)



                }


                if(userdatarow.level>=2 && userdatarow.level<=3){

                    message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Newblood").id)
                    message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Novice").id)


                   lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x524242)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Novice",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)





                }

                if(userdatarow.level>=4 && userdatarow.level<=5){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Novice").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Amateur")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x679200)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Amateur",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

    
}


                if(userdatarow.level>=6 && userdatarow.level<=7){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Amateur").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Warrior")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xa0005b)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Warrior",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)


    
}

                if(userdatarow.level>=8 && userdatarow.level<=9){

                         message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Warrior").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Contender")).id   

                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x006c79)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Contender",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)


    
}    

                if(userdatarow.level>=10 && userdatarow.level<=11){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Contender").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Duelist")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x1dd300)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Duelist",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)
            

}



                if(userdatarow.level>=12 && userdatarow.level<=13){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Duelist").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Tactician")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x6eff2e)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Tactician",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

    
}


                if(userdatarow.level>=14 && userdatarow.level<=15){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Tactician").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Commander")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xa3ff81)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Commander",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)
  
    
}


                if(userdatarow.level>=16 && userdatarow.level<=17){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Commander").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Berserker")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x0d2eff)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Berserker",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

    
}


                if(userdatarow.level>=18 && userdatarow.level<=19){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Berserker").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Gladiator")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x4586ff)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Gladiator",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)




}


                if(userdatarow.level>=20 && userdatarow.level<=21){

        message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Gladiator").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Champion")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x73efff)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Champion",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

    
}


                 if(userdatarow.level>=22 && userdatarow.level<=23){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Champion").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Master")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x5c00b3)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Master",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)


    
}

                 if(userdatarow.level>=24 && userdatarow.level<=25){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Master").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Hero")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x8440ff)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Hero",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

                
}
                 if(userdatarow.level>=26 && userdatarow.level<=27){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Hero").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Legend")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xaf6cff)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Legend",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

    
}

                 if(userdatarow.level>=28 && userdatarow.level<=29){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Legend").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Archfiend")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xaf0000)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Archfiend",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

    
}


                 if(userdatarow.level>=30 && userdatarow.level<=32){

        message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Archfiend").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Hellhound")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xff6a6a)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Hellhound",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

    
}


                 if(userdatarow.level>=33 && userdatarow.level<=35){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Hellhound").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Demon")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xff1b1b)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Demon",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

    
}
                 if(userdatarow.level>=36 && userdatarow.level<=38){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Demon").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Diablo")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xffabab)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Diablo",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

    
}
                 if(userdatarow.level>=39 && userdatarow.level<=41){

                          message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Diablo").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Ascended")).id  


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xbac700)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Ascended",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

    
}

                 if(userdatarow.level>=42 && userdatarow.level<=44){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Ascended").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Cherubium")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xf3ff36)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Cherubium",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)


}


                 if(userdatarow.level>=45 && userdatarow.level<=47){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Cherubium").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Seraphim")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xf5b5ff)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Seraphim",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

    
}
                 if(userdatarow.level>=48 && userdatarow.level<=51){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Seraphim").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Archangel")).id

                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xcd87ff)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Archangel",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)
    
}
                 if(userdatarow.level>=52 && userdatarow.level<=55){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Archangel").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Celestial")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xf60977)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Celestial",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

    
}

                 if(userdatarow.level>=56 && userdatarow.level<=59){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Celestial").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Divine")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xfc479c)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Divine",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)
    
}


                 if(userdatarow.level>=60 && userdatarow.level<=63){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Divine").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Heavenly Judge")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x2ca1a1)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Heavenly Judge",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)
    
}

                 if(userdatarow.level>=64 && userdatarow.level<=67){

                        message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Heavenly Judge").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Celestial God")).id    


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x00ffff)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Celestial God",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

}

                 if(userdatarow.level>=68 && userdatarow.level<=71){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Celestial God").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Calamity Host")).id

                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x88ffff)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Calamity Host",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)

    
}
                 if(userdatarow.level>=72 && userdatarow.level<=75){

                          message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Calamity Host").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Karma Killer")).id  


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0x7f00fb)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Karma Killer",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)
    
}
                 if(userdatarow.level>=76 && userdatarow.level<=79){


                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Karma Killer").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Ruling Star")).id

                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xd800fb)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Ruling Star",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon);
    
}
                 if(userdatarow.level>=80 && userdatarow.level<=84){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Ruling Star").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Daybreaker")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xfb00bf)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Daybreaker",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)
    
}


                 if(userdatarow.level>=85 && userdatarow.level<=99){


                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Daybreaker").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Doombearer")).id

                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor(0xfb00bf)
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Doombearer",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`${differenceDigit}XP until level up`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)
    
}

                 if(userdatarow.level === 100){

                            message.guild.member(message.author.id).removeRole(message.guild.roles.find("name","Doombearer").id)
        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Overlord")).id


                    lvlEmbed.setAuthor(message.author.username)
                    lvlEmbed.setColor('#000000')
                    lvlEmbed.addField("Level",userdatarow.level,true)
                    lvlEmbed.addField("XP",`${currentExpDigit} / ${maxExpDigit}`,true)
                    lvlEmbed.addField("Rank","Overlord",true)
                    lvlEmbed.setThumbnail( message.author.displayAvatarURL)
                    lvlEmbed.addField("Server ranking", `${ordinal_suffix_of(userIndex+1)}`,true)
                    lvlEmbed.addField("Next Level up",`You are on the highest level.`)
                    lvlEmbed.setFooter(`Anime Artist United | ${message.author.username}'s Level Profile`, bicon)


            }

                return message.channel.send(lvlEmbed).then(() =>
                console.log(`lvl check passed. ${message.author.username} | ${userdatarow.level}`));

            }
         })
    
}
module.exports.help = {
    name:"level",
        aliases:[]
}