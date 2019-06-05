const Discord = require("discord.js");
const moment = require(`moment`);
const palette = require('../colorset.json');
const formatManager = require('../utils/formatManager.js');

const env = require('../.data/environment.json');
const prefix = env.prefix;

const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async (bot, command, message, args, utils) => {


    if (env.dev && !env.administrator_id.includes(message.author.id)) return;


    const format = new formatManager(message);
    return ["bot", "bot-games", "cmds", `sandbox`].includes(message.channel.name) ? initPay() :
        format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)



    async function initPay() {

        function randomString(length, chars) {
            var result = '';
            for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
            return result;
        }

        function template(content, color = palette.darkmatte) {
            let embed = new Discord.RichEmbed()
                .setColor(color)
                .setDescription(content)
                .setFooter(`AAU Bank`, bot.user.displayAvatarURL)

            return message.channel.send(embed);
        }


        // this returning data lvl from userdata.
        function getUserDataLvl(user) {
            return sql.get(`SELECT * FROM userdata WHERE userId ="${user.id}"`)
                .then(data => data.level);
        }

        /// Fwubbles Integer Check Testing
        const isValidCount = (msg) => {
            return !Number.isNaN(Number(msg)) && !(Math.round(Number(msg)) <= 0) && Number.isFinite(Number(msg));
        }
        const getPosInt = (msg) => {
            return !Number.isNaN(Number(msg)) && !(Math.round(Number(msg)) <= 0) && Number.isFinite(Number(msg)) ? Math.round(Number(msg)) : NaN;
        }

        const userLvl = await getUserDataLvl(message.member);


        if (userLvl < 6) return message.channel.send("I'm sorry, your level isn't high enough to use this feature.")
        if (!args[0]) return template(`**${message.author.username}**, here's how to use pay command :\n\`>pay\`  \`user\`  \`value\``)

        sql.get(`SELECT * FROM userinventories WHERE userId = "${message.author.id}"`).then(async userdatarow => {
            const user = await utils.userFinding(message, args[0]);

            if (!args[1]) return template(`**${message.author.username}**, please put the number.`)
            if (args[1].includes(user.id)) return template(`❌ | Transaction failed.\nREASON: \`WRONG FORMAT.\``, palette.red)
            if (user.id === message.author.id) return template(`I know what you did there, ${message.author.username}.`);
            if (userdatarow.artcoins < args[1]) return template(`❌ | Transaction failed.\nREASON: \`NOT ENOUGH BALANCE.\``);


            if (user.id !== message.author.id) {

                let transactionCode2 = randomString(5, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
                let transactionCode = randomString(2, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
                let digitValue = format.threeDigitsComa(getPosInt(args[1]));
                let timestamp = moment(Date.now()).format(`MMMM Do YYYY, h:mm:ss a`);

                console.log(args[1]);
                const update_data = () => {
                    sql.run(`UPDATE userinventories SET artcoins = artcoins - ${parseInt(getPosInt(args[1]))} WHERE userId = "${message.author.id}"`);
                    sql.run(`UPDATE userinventories SET artcoins = artcoins + ${parseInt(getPosInt(args[1]))} WHERE userId = "${user.id}"`);
                    console.log(`Transaction successful. ID : ${message.author.username}, ${user.user.username}`)
                }

                /// Fwubbles Integer Check Test
                if (!isValidCount(args[1])) return format.embedWrapper(palette.red, `Please enter a valid amount.`);

                update_data();

                return template(`
	                    ✅ | Transaction successful.
	                    ${timestamp}\n
	                    TRANSACTION ID : ${transactionCode}-${transactionCode2}
	                    TRANSFER
	                    TO ACCOUNT:  \`${user.id}\`
	                    NAME :  **${user.user.username}**
	                    VALUE : ${utils.emoji(`artcoins`,bot)} **${digitValue}**
	                    This message is automatically generated after you made a
	                    successful payment with other user.\n

	                    If you have any trouble, please DM the available councils`, palette.lightgreen)
            }
        })
    }
}
module.exports.help = {
    name: "pay",
    aliases: [],
    description: `Pay a specified user an amount of AC from your balance`,
    usage: `${prefix}pay @user <amount>`,
    group: "Shop-related",
    public: true,
}