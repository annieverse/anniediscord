module.exports = (bot, e, message_object) => {
    let testChannel = bot.channels.get('581642059090362368');
    testChannel.send(e);
    console.error(e);
    
};
