const Discord = require("discord.js");
const palette = require('../colorset.json');
const formatManager = require('../utils/formatManager');
const userFinding = require('../utils/userFinding');

const sql = require("sqlite");
sql.open('.data/database.sqlite');
module.exports.run = async(bot,command, message,args)=>{

    ///   -sendreward 







sendRewardInit();

    async function sendRewardInit() {

        const format = new formatManager(message);

        try {        
            if(!message.member.roles.find(r => r.name === 'Grand Master'))return format.embedWrapper(palette.red, `You don't have authorization to use this command.`);
            if(!args[0])return format.embedWrapper(palette.darkmatte, 'Please put the target user. (id/username/tag)')
            if(!args[1])return format.embedWrapper(palette.darkmatte, 'Please put the reward rank. (1/2/3/runnerup).')

                    const user = await userFinding.resolve(message, args[0]);
                    sql.get(`SELECT * from userdata WHERE userId ="${user.id}"`).then(async userdatarow => {
                        const rewards = {
                            "1": { ac: 3000, medals: 25},
                            "2": { ac: 1500, medals: 10},
                            "3": { ac: 1000, medals: 5},
                            "runnerup": { ac: 500, medals: 3}
                        };

                        let updatedac = parseInt(rewards[args[1]].ac) + userdatarow.artcoins;
                        let updatedmedals = userdatarow.medals === null ? parseInt(rewards[args[1]].medals) :  parseInt(rewards[args[1]].medals) + userdatarow.medals;

                        sql.run(`UPDATE userdata SET artcoins = ${updatedac} WHERE userId = ${user.id}`)
                        sql.run(`UPDATE userdata SET medals = ${updatedmedals} WHERE userId = ${user.id}`)


                        const embed = new Discord.RichEmbed()
                                .setColor(palette.halloween)
                                .setFooter(`[Admin]${message.author.username}`, message.author.displayAvatarURL)
                                .setDescription(`
                                    Hello **${user.user.username}**, thank you for participating in this week's event! <:AnnieHug:540332226735505439> :tada:
                                    
                                    You have received the following items :
                                    - <:ArtCoins:467184620107202560> **${format.threeDigitsComa(rewards[args[1]].ac)}x** artcoins
                                    - <:eventmedal:530723484884664320> **${format.threeDigitsComa(rewards[args[1]].medals)}x** medals
                                    `)

                        user.send(embed)
                        format.embedWrapper(palette.lightgreen, `Package has been successfully delivered. 
                                ACCOUNT: **${user.user.tag}**
                                ITEMS:  (<:ArtCoins:467184620107202560> **${format.threeDigitsComa(rewards[args[1]].ac)}x** artcoins, <:eventmedal:530723484884664320> **${format.threeDigitsComa(rewards[args[1]].medals)}x** medals)`)
                        console.log(`${message.author.username} has given REWARD_PACKAGE(${args[1]}) to ${user.user.username}`)
                    })
            }

            catch(error) {
                return format.embedWrapper(palette.darkmatte,
                     `Sorry **${message.author.username}**, i encountered an error while processing your request. <:AnnieCry:542038556668067840>
                    \`${error}\`
                    `)
            }
    }
}
    
    module.exports.help = {
        name:"sendreward",
        aliases:[]
    }