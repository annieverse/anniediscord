const Discord = require('discord.js');
const palette = require(`../colorset.json`);
const botconfig = require('../botconfig.json');
const ranksManager = require('../utils/ranksManager');
const formatManager = require('../utils/formatManager');
const sql = require("sqlite");
sql.open(".data/database.sqlite");


module.exports = (bot,message) => {


    if(message.author.bot)return;
    if(message.channel.type ==='dm')return;


    const manager = new ranksManager(bot, message)
    const format = new formatManager(message)

    Miscellaneous();
    artChannelsFilter();
    eventChannelFilter();
    portfolioRequest();
    commandHandler();



    function attachmentCheck() {
        try {
            return message.attachments.first().id ? true : null
        }
        catch(e) {
            return false
        }
    }

    function portfolioRequest() {
        if(message.content.includes(`#myportfolio`) && attachmentCheck()) {
            let user = {
                img: message.attachments.first().url,
                id: message.author.id,
                tag: message.author.tag,
                loc: message.channel.name,
                date: Date.now()
            };
            message.react(`✅`);
            sql.run(`INSERT INTO userartworks (userId, url, timestamp, location) VALUES (?, ?, ?, ?)`, [user.id, user.img, user.date, user.loc]) 
            return console.log(`${user.tag} has submitted "${user.img}" through #myportfolio in ${user.loc}.`)
        }
    }

    function artChannelsFilter() {
        const artchannels = [
         "459892609838481408",
         "459893040753016872",
         "460439050445258752", 
         "461926519976230922",
         "460615254553001994",
         "538806382779170826"
        ];
         
        if(artchannels.includes(message.channel.id) && attachmentCheck() && !message.content.includes(`#myportfolio`)) {
            let img = message.attachments.first();
            sql.run(`INSERT INTO userartworks (userId, url, timestamp, location) VALUES (?, ?, ?, ?)`, [message.author.id, img.url, Date.now(), message.channel.name]) 
            return console.log(`${message.author.tag} has submitted "${img.filename}" in ${message.channel.name}.`)
        }
    }

    function eventChannelFilter() {
        let submissionchannel = bot.channels.get('460615254553001994');
        let eventchannel = bot.channels.get('460615157056405505');
        if(message.channel.id === submissionchannel.id && attachmentCheck()){
            let role = manager.getRoles('Event Participant');
            let user = message.guild.member(message.author.id);
            user.removeRole(role)
            
            let embed = new Discord.RichEmbed()
            .setColor(palette.golden)
            .setTimestamp(Date.now())
            .setDescription(`**${message.author.username}** has submitted some work! <:AnnieHype:523196958882529280>`)
            return eventchannel.send(embed);
        }
    }

    function Miscellaneous() {
        if(message.content.startsWith('(╯°□°）╯︵ ┻━┻'))return message.channel.send('┬─┬ ノ( ゜-゜ノ)');
        if(message.content.startsWith('┬─┬ ノ( ゜-゜ノ)'))return message.channel.send('(╯°□°）╯︵ ┻━┻')
        if(message.isMentioned(bot.user)) {
            let responseArr = [
                `Nice to meet you **${message.author.username}**.`,
                `awooooooo`,
                `Yes? my prefix is ${botconfig.prefix}`,
                `Hello there!`,
                `awooooooo`,
                `Do you need any help? please type **>help.**`,
                `Hello **${message.author.username}**! my prefix is \`${botconfig.prefix}\``,
                `Hewo **${message.author.username}**, don't forget to take your dailies!`
            ];
            let randomizedResponseArr = responseArr[Math.floor(Math.random () * responseArr.length)];
        
              message.channel.startTyping();
              format.embedWrapper(palette.halloween, randomizedResponseArr);
              return message.channel.stopTyping();
          };
    }

    function commandHandler() {
        let prefix = botconfig.prefix;
        let messageArray = message.content.split(" ");
        let cmd = messageArray[0];
        let args = messageArray.slice(1);
        let command = cmd.slice(prefix.length);
        let commandfile = bot.commands.get(cmd.slice(prefix.length)) || bot.commands.get(bot.aliases.get(cmd.slice(prefix.length)));

        if (!message.content.startsWith(botconfig.prefix))return;
        if (commandfile) commandfile.run(bot,command,message,args);
    }
  
  function wordFilter(){
    let bannedWords = ["n1gg3r","n_i_g_g_e_r","nijjer","nigjer","n i g g e r","nigher",
                       "niggerr","nigerr","niggggger","niggger"," ًًً nigger","nigger","NIGER","migher","spic","niqqa", 
                       "big nig", "nignig", "nibba", "Manig","fag","faggot","chink","dyke"];
    let okWords = ["moreactive", "reaction",];
    let testMessage = message.content;
    let newMessage = testMessage.replace(/\W/g, '');

    //let msgsent = message.content.toUpperCase();
    let msgsent = newMessage.toUpperCase();
    let msgOringinal = msgsent.toLowerCase();
    let msgUser = message.author.bot? bot.user.name : message.member.displayName;

    for (var x in bannedWords){
        if (msgsent.includes(bannedWords[x].toUpperCase()) && !msgsent.includes(okWords[0].toUpperCase()) && !msgsent.includes(okWords[1].toUpperCase())){
          message.delete();
          message.channel.send("I'm sorry but a word in your message is not allowed, please try to refrain from using it.")
          console.log("[LOG] bad word detected: "+msgsent);
        };
    };
  };

}