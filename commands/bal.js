const palette = require('../colorset.json');
const formatManager = require('../utils/formatManager');
const databaseManager = require('../utils/databaseManager');
const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, command, message, args, utils) => {

    /// artcoins.js
    ///
    ///  balance command
    ///    change logs:
    ///         05/12/19 - Bug fixes & remove unnecesary variables.
    ///			04/09/19 - emoji function.
    ///         12/20/18 - Structure reworks.
    ///         12/18/18 - Imported classes & event currency
    ///         11/12/18 - interface reworks.
    ///         10/18/18 - halloween palette.
    ///
    ///     -naphnaphz
    ///     -Frying Pan

const env = require('../.data/environment.json');
if(env.dev && !env.administrator_id.includes(message.author.id))return;

const format = new formatManager(message)
return [`sandbox`, `bot`, `gacha-house`, `games`].includes(message.channel.name) ? init_balance()
: null;


        async function init_balance() {

            if(!args[0]){
                const dbmanager = new databaseManager(message.author.id);
                const data = await dbmanager.pullRowData("userinventories", message.author.id);
                let ac = format.threeDigitsComa(data.artcoins);
                let name = format.capitalizeFirstLetter(message.author.username);

                    return message.channel.send(`**${name}'s Balance**`)
                        .then(() => {
                            format.embedWrapper(palette.golden,
                            `${utils.emoji(`artcoins`,bot)} ${ac} Artcoins`);
                        })
            }
            else if(args[0]){
                try {
                    const target = await utils.userFinding(message, message.content.substring(command.length+2));
                    const dbmanager = new databaseManager(target.id);
                    const data = await dbmanager.pullRowData("userinventories", target.id);
                    let ac = format.threeDigitsComa(data.artcoins);
                    let name = format.capitalizeFirstLetter(target.user.username);

                    return message.channel.send(`**${name}'s Balance**`)
                        .then(() => {
                            format.embedWrapper(palette.golden,
                            `${utils.emoji(`artcoins`,bot)} ${ac} Artcoins`);
                        })
                }
                catch(e) {
                    console.log(e)
                    return format.embedWrapper(palette.red, `Sorry, i couldn't find the user. :(`);
                }
            }
        }
}

module.exports.help = {
    name:"bal",
    aliases: [`balance`, `money`, `credit`, `ball`],
    description: `Checks your AC balance`,
    usage: `${prefix}bal`,
    group: "General",
    public: true,
}