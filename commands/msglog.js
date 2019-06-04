const Discord = require('discord.js');
const palette = require('../colorset.json');

const env = require('../.data/environment.json');
const prefix = env.prefix;

const sql = require("sqlite");
sql.open(".data/database.sqlite");


module.exports.run = async (bot, command, message, args, utils) => {


if(env.dev && !env.administrator_id.includes(message.author.id))return;

const embed = new Discord.RichEmbed();
embed.setColor(palette.blankgray)
embed.setDescription(`Uhm sorry, you don't have authorization to access it.`)
embed.setFooter(`${message.author.username} | Developer Mode`, message.author.displayAvatarURL)

if((!message.member.hasPermission("ADMINISTRATOR")) && (message.author.id !== '277266191540551680'))return message.channel.send(embed);


function countingIndex() {
  var dateToday = Date.now();
  let thirtydaysago = dateToday - 2505600000;
return sql.all(`SELECT timestamp FROM messagelog WHERE timestamp BETWEEN ${thirtydaysago} and ${dateToday}`)
.then(async x => x.length)
}

let parsedValue = await countingIndex();
	embed.setColor(palette.darkmatte)
	embed.setDescription(`There's **${parsedValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}** messages data were collected in the past 30 days. `)

	return message.channel.send(embed)

}
module.exports.help = {
  name:"get_msglog",
  aliases: [],
  description: `See the total amount of messages collected`,
  usage: `${prefix}get_msglog`,
  group: "Admin",
  public: false,
}