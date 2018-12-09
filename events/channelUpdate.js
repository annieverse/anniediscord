const Discord = require("discord.js");

module.exports = (bot, oldChannel, newChannel) => {

    let serverUpdatesChannel = bot.channels.get("459892157600366612");
  let memberChannel = bot.channels.get("518245560239652867");
  let ESTChannel = bot.channels.get("514668748612042763");
  let MSTChannel = bot.channels.get("514673767583318037");
  let GMT08Channel = bot.channels.get("514676732247408641");
  
  if(oldChannel.name !== newChannel.name){
    if ((oldChannel.id != memberChannel.id) && (oldChannel.id != ESTChannel.id) && (oldChannel.id != MSTChannel.id) && (oldChannel.id != GMT08Channel.id)){
      serverUpdatesChannel.send(`Renamed ${oldChannel.name} to <#${newChannel.id}>`);
    }
  }
  
}