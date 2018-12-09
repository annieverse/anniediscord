const Discord = require("discord.js");
const { Attachment } = require("discord.js");
const { get } = require("snekfetch"); 
const { Canvas } = require("canvas-constructor");
const { resolve, join } = require("path");
const palette = require(`../colorset.json`);
const imageUrlRegex = /\?size=2048$/g;
const profileManager = require('../utils/profileManager');
const formatterManager = require('../utils/formatManager');
Canvas.registerFont(resolve(join(__dirname, "../fonts/Roboto.ttf")), "Roboto");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-medium.ttf")), "RobotoMedium");
Canvas.registerFont(resolve(join(__dirname, "../fonts/Whitney.otf")), "Whitney");
Canvas.registerFont(resolve(join(__dirname, "../fonts/KosugiMaru.ttf")), "KosugiMaru");

module.exports = (bot, member) => {
/*

		* @guildMemberAdd listener.
		* it will send canvas-generated message to welcome channel
		* for every joined user.

*/
	const members = member.guild.memberCount;
	const botSize = member.guild.members.filter(a => a.user.bot).size;
	const userSize = members - botSize;
	const configFormat = new formatterManager();
	const configProfile = new profileManager(); 
	const d = Date.now();
	const guild = member.guild;
	const user = bot.users.get(member.id);
	const welcomechnl = guild.channels.find(channel => channel.name === "general")

	bot.channels.get(`518245560239652867`).setName(`${userSize} members!`);		
	
 const sendMsg = async () => {
  welcomechnl.send(`Welcome ${user}, I am Annie the server's mascot and your personal guide here, It is a pleasure to meet you! Please read ${member.guild.channels.get('472605630788665344').toString()} & ${member.guild.channels.get('486741536827113493').toString()} for full access to the server. Feel free to DM <@507043081770631169> for any questions, our staff team will get back to you asap. Last but not least, enjoy your stay!! :tada:`,
	new Attachment(await welcomeCard(user),`welcome!-${user.tag}.jpg`))
 }

 sendMsg();

			async function welcomeCard(member) {

 
			const { body: avatar } = await get(member.displayAvatarURL.replace(imageUrlRegex, "?size=512"));

					return new Canvas(1200, 275) // x y

					.addImage(await configProfile.getAsset('kitowelcomer'), 0, 0, 1200, 365, 205)
					.addImage(await configProfile.getAsset('welcomeoverlay'), 0, 0, 1200, 1200, 540)

					.setTextAlign("left")
					.setTextFont(`${configProfile.checkUsernameLength(member.username).welcomer}pt ${configProfile.checkAlphanumeric(member.username)}`)
					.setColor(palette.white)
					.addText(member.username, 540, 170)

					.setTextAlign("right")
					.setTextFont("35pt Roboto")
					.setColor(palette.halloween)
					.addText(configFormat.ordinalSuffix(userSize), 258, 170)

					.setColor(palette.white)
					.setTextFont("21pt Roboto")
					.addText('User', 268, 200)

					.setTextAlign("left")  
					.setTextFont("18pt Roboto")
					.addText(`${configFormat.formatedTime(d)}..`, 516, 85) 

					.setTextFont("25pt Roboto")
					.addText('has joined', (750 - configProfile.checkPosition(member.username) ), 217)

					.setColor('#b3e5fc')

					.setTextFont("40pt Roboto")
					.addText('AAU !', (908 - configProfile.checkPosition(member.username) ), 230)

					.setColor(palette.white)
					.addRoundImage(avatar, 280, 20, 240, 240, 120)
					.restore()

					
					.toBuffer()
}


}