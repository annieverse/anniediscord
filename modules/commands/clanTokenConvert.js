
module.exports.run = async (bot, command, message) => {

  
  message.channel.send("This command is not yet created and/or finished quite yet");

}//end of module.exports.run

module.exports.help = {
  name:"cclantoken",
  aliases: [],
  description: `converts AC into AC`,
  usage: `>cclantoken <amount>`,
  group: "General",
  public: false,
}