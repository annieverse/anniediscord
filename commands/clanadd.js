const Discord = require("discord.js");
const palette = require(`../colorset.json`);
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot,command, message,args)=>{

const env = require(`../utils/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

  function fileAliasesCheck(file) {
    const src = require(`./${file}`)
    return src.help.name;
  };
  
  let bicon = bot.user.displayAvatarURL;
  let Embed = new Discord.RichEmbed();
      Embed.setColor(palette.red)
      Embed.setDescription(`You don't have authorization to use this command.`)
      Embed.setFooter(`Anime Artist United | Clan Add`, bicon) 


  var clanLeaderId = message.author.id;
  var clanLeaderName = message.author.username;
  var clanName = "";
  var clanTag = "";
  var clanMotto = "";

  
  //
  //  Check to make sure person has right lvl and money
  //

  /**
        Lifesaver promise. Used pretty often when calling an API.
        @pause
    */
  function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Parsing emoji by its name.
  function emoji(name) {
    return bot.emojis.find(e => e.name === name)
  }

  /**
      Requesting user data from sql API.
      @get_userobject
  */
  let raw_object;
  function get_userobject() {
    let user = message.author;
    return sql.get(`SELECT  * FROM userdta WHERE userId = "${user.id}"`)
      .then(async res => raw_object = res)
  }
  
  /**
        Parse raw_object (also referenced as container)
        @filtering_data
    */
  async function filtering_data(container) {

    let userlevel = container.level;
    let userAC = container.artcoins;

    // Check to make sure user is at least level 40
    if (userlevel<40) return message.channel.send("*Filler message*: I'm am sorry but you are not a high enough level yet.")

    // Sets the max members allowed in clan
    let maxMembers = 5;
    if (userlevel > 50) maxMembers = 7;
    if (userlevel > 60) maxMembers = 10;
    if (userlevel > 85) maxMembers = 15;

    // Check for color customize
    let colorCustom = false;
    if (userlevel > 45) colorCustom = true;

    // Check to make sure user has enough balance
    if (userAC < 45000)return message.channel.send("*Filler message*: I'm am sorry but you do not have enough AC.");
    

  //
  //  complete transaction
  //
    const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 20000 });
    //console.log(collector)
    collector.on('collect', message => {

      console.log(`clanLeaderName: ${clanLeaderName} clanLeaderId: ${clanLeaderId} userlevel: ${userlevel} userAC: ${userAC}`)

      message.channel.send(`Are you sure that you want to create a clan, it will take 45,000 AC from your account?`)
      if (message.content.toLowerCase = "yes"){
        sql.get(`UPDATE userdata SET artcoins = ${userAC - 45000} WHERE userId = "${user.id}"`)


        //
        // ADD two more columns in userdata || inClan | clanLeader
        //
        sql.get(`UPDATE userdata SET inClan = ${true} WHERE userId = "${user.id}"`)
        sql.get(`UPDATE userdata SET clanLeader = ${true} WHERE userId = "${user.id}"`)


        message.channel.send(`*Filler message*: Thank you for creating a clan`);
      } else if (message.content.toLowerCase = "no") {
        return message.channel.send(`*Filler message*: Okay, thank you`)
      }

      console.log(`clanLeaderName: ${clanLeaderName} clanLeaderId: ${clanLeaderId} userlevel: ${userlevel} userAC: ${userAC}`)
      collector.off;
    });
  }

  
  //
  //  confirmation messages
  //

  //
  // finish details
  //

  /**
       create a clan, initializing the clan name, tag and motto
       @clan_creation
   */
  async function clan_creation() {

    const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 20000 });
    collector.on('collect', message => {

      message.channel.send(`Some more things are needed to complete the creation of your clan.\nTo Start what would you like you clan name to be? ()`)
      
      if (message.content.valueOf > 25) message.channel.send(`please give a name that is less than 25 characters.`)
      if (message.content.valueOf < 25){
        clanName = message.content;
        clanTag = clanName.substring(0,5);
        const collectortwo = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 20000 });
        message.channel.send(`Your clan name will be ${clanName} and your clan tag will be ${clanTag}. You can change your tag later.\nNow please write a short description/motto for your clan. The default motto if you type "n/a" will be "One awsome clan"`)
        collectortwo.on(`collect`,msg => {
          if (msg.content.toLowerCase = "n/a"){

          } else if (msg.content.valueOf>120){
            msg.channel.send(`please type a description less than 120 characters.`)
          } else{
            clanMotto = msg.content;
          }

        });
      } 
    });


    //
    // 
    //
  }

  //
  //  test
  //

  /**
       Send result into message event. 
       @run
   */
  async function run() {

    // fix line below before release!!! @naph
    if (![`sandbox`].includes(message.channel.name)) return configFormat.embedWrapper(palette.darkmatte, `You can create your clan in bot channels.`);

    return message.channel.send(`\`fetching ${message.author.username} data ..\``)
      .then(async load => {
        await get_userobject();
        await pause(200);
        await filtering_data(raw_object);

        message.channel.send(`${emoji(`AnnieWot`)} | *Filler message*: Thank you for creating a clan`);
        load.delete();
      })
  }


























  //
  //  move all this shit
  //

  const clanSetUp = new Discord.RichEmbed()
    .setColor(palette.halloween)
    .setDescription("Thank you for creating a new clan but a few things are required to complete the process:"
                   +"\nClan name"
                   +"\nPlease type the Clan Leader first, then the Clan Name.");
  
  
  message.channel.send(clanSetUp);
  
  
  
  const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 20000 });
        //console.log(collector)
        collector.on('collect', message => {
          clanLeader = message.guild.member(message.mentions.users.first());
          clanName = message.content.slice(23);
          
          console.log("clanName: "+`${clanName}`);
          console.log("clanLeader: "+`${clanLeader.id}`);
          
          sql.get(`SELECT * FROM clandata WHERE userId ="${clanLeader.id}"`).then(async clanrow => {
            if (!clanrow){
              sql.run(`INSERT INTO clandata (userId, clanname, admin, clancoins, clanpoints, dual, dualwith, winner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [clanLeader.id, clanName, true, 0, 0, null, null, null]);
              message.channel.send(`New clan created named: ***${clanName}*** with ${clanLeader} as their fearless leader!000`);
              collector.off;
            }else{
              sql.run(`UPDATE clandata SET clanname = ${clanrow.clanname.replace(clanrow.clanname,clanName)} WHERE userId = ${clanLeader.id}`);
              sql.run(`UPDATE clandata SET admin = "true" WHERE userId = ${clanLeader.id}`);
              message.channel.send(`New clan created named: ***${clanName}*** with ${clanLeader} as their fearless leader!111`);
              collector.off;
            }
          });
          
          //message.channel.send(`New clan created named: ***${clanName}*** with ${clanLeader} as their fearless leader!`);
          collector.off;
          });
  
}//end of module.exports.run

module.exports.help = {
        name:"createclan",
        aliases:[]
}
