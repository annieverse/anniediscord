const palette = require('../colorset.json');
const userFind = require('../utils/userFinding');
const formatManager = require('../utils/formatManager');
const databaseManager = require('../utils/databaseManager');

module.exports.run = async(bot,command,message,args)=>{

    /// artcoins.js
    ///
    ///  balance command
    ///    change logs:
    ///			04/09/19 - emoji function.
    ///         12/20/18 - Structure reworks.
    ///         12/18/18 - Imported classes & event currency
    ///         11/12/18 - interface reworks.
    ///         10/18/18 - halloween palette.
    ///
    ///     -naphnaphz
    ///     -Frying Pan

const format = new formatManager(message)
return ["489677250871164928"].includes(message.channel.id) ? checkBalance()
: null;


        async function checkBalance() {
          const emoji = (name) => {
            return bot.emojis.find(e => e.name === name)
          }

            if(!args[0]){
                const dbmanager = new databaseManager(message.author.id);
                const data = await dbmanager.userdata;
                const eventdata = await dbmanager.pullRowData("usereventsdata", message.author.id);
                let ac = format.threeDigitsComa(data.artcoins);
                let mdl = format.threeDigitsComa(data.medals === null ? 0 : data.medals);
                let frg = format.threeDigitsComa(data.fragments === null ? 0 : data.fragments);
                let name = format.capitalizeFirstLetter(message.author.username);

                    return message.channel.send(`**${name}'s Balance**`)
                        .then(() => {
                            format.embedWrapper(palette.golden,
                            `${emoji(`ArtCoins`)} ${ac} Artcoins | ${emoji(`eventmedal`)} ${mdl} Medals | ${emoji(`fragments`)} ${frg} Fragments`);
                        })
            }
            else if(args[0]){
                try {
                    const target = await userFind.resolve(message, message.content.substring(command.length+2))
                    const dbmanager = new databaseManager(target.id);
                    const data = await dbmanager.userdata;
                    const eventdata = await dbmanager.pullRowData("usereventsdata", target.id);
                    let ac = format.threeDigitsComa(data.artcoins);
                    let mdl = format.threeDigitsComa(data.medals === null ? 0 : data.medals);
                    let frg = format.threeDigitsComa(data.fragments === null ? 0 : data.fragments);
                    let name = format.capitalizeFirstLetter(target.user.username);

                    return message.channel.send(`**${name}'s Balance**`)
                        .then(() => {
                            format.embedWrapper(palette.golden,
                            `${emoji(`ArtCoins`)} ${ac} Artcoins | ${emoji(`eventmedal`)} ${mdl} Medals | ${emoji(`fragments`)} ${frg} Fragments`);
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
    name:">bal",
    aliases:[]
}