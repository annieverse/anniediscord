const Discord = require("discord.js");
const formatManager = require('../../utils/formatManager');


const sql = require("sqlite");
sql.open('.data/database.sqlite');
module.exports.run = async (...ArrayStacks) => {




sendRewardInit();

    async function sendRewardInit() {

        const format = new formatManager(message);

        try {        
            if(!message.member.roles.find(r => (r.name === 'Tomato Fox') 
                                            || (r.name === 'Developer Team')))return format.embedWrapper(palette.red, `You don't have authorization to use this command.`);
            if(!args[0])return format.embedWrapper(palette.darkmatte, 'Please put the target user. (id/username/tag)')
            if(!args[1])return format.embedWrapper(palette.darkmatte, 'Please put the reward rank. (1/2/3/runnerup).')

                    const user = await utils.userFinding(message, args[0]);
                    sql.get(`SELECT * from userinventories WHERE userId ="${user.id}"`)
                        .then(async userdatarow => {
                        const rewards = {
                            "1": { ac: 3000, luckyticket: 10},
                            "2": { ac: 1500, luckyticket: 5},
                            "3": { ac: 1000, luckyticket: 3},
                            "runnerup": { ac: 500, luckyticket: 1}
                        };

                        let updatedac = parseInt(rewards[args[1]].ac) + userdatarow.artcoins;
                        let updated_luckyticket = userdatarow.lucky_ticket === null ? parseInt(rewards[args[1]].luckyticket) :  parseInt(rewards[args[1]].luckyticket) + userdatarow.lucky_ticket;

                        sql.run(`UPDATE userinventories SET artcoins = ${updatedac} WHERE userId = ${user.id}`)
                        sql.run(`UPDATE userinventories SET lucky_ticket = ${updated_luckyticket} WHERE userId = ${user.id}`)


                        const embed = new Discord.RichEmbed()
                                .setColor(palette.halloween)
                                .setFooter(`[Admin]${message.author.username}`, message.author.displayAvatarURL)
                                .setDescription(`
                                    Hello **${user.user.username}**, thank you for participating in this week's event! <:AnnieHug:540332226735505439> :tada:
                                    
                                    You have received the following items :
                                    - ${utils.emoji(`artcoins`,bot)} **${format.threeDigitsComa(rewards[args[1]].ac)}x** Artcoins
                                    - ${utils.emoji(`luckyticket`,bot)}  **${format.threeDigitsComa(rewards[args[1]].luckyticket)}x** Lucky Tickets
                                    `)

                        user.send(embed)
                        format.embedWrapper(palette.lightgreen, `Package has been successfully delivered. 
                                ACCOUNT: **${user.user.tag}**
                                ITEMS:  ${utils.emoji(`artcoins`,bot)} **${format.threeDigitsComa(rewards[args[1]].ac)}x** Artcoins, ${utils.emoji(`luckyticket`,bot)}**${format.threeDigitsComa(rewards[args[1]].luckyticket)}x** Lucky Tickets)`)
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
    aliases: [],
    description: `Send Rewards for events`,
    usage: `>sendreward @user <place>`,
    group: "Admin",
    public: true,
    }