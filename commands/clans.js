const Discord = require("discord.js"),
      config = require("../prefix.json"),
      palette = require(`../colorset.json`),
      utils = require(`../utils/utils.js`),
      prefix = config.prefix,
      sql = require("sqlite"),
      ranksManager = require(`../utils/ranksManager`),
      userFinding = require('../utils/userFinding');

module.exports.run = async(bot, command,message,args)=>{
  
  const configRank = new ranksManager(bot, message);
  
  let bicon = bot.user.displayAvatarURL;
  let helpEmbed = new Discord.RichEmbed();
  
  /**
   * Things For Clans:
   * 
   * 1.) 30k for a clan
   * 
   * 2.) everyone allowed to be in only one clan
   * 
   * 3.) confirmation message after creating a clan (in an embed) or plain message with bolded titles or possibly a canvas
   *      Name: Awootist Awoovement 
   *      Clan tag: 『AWOO』
   *      Clan Leader: Kitomi
   *      AWOO members: @The Frying Pan『PANS』 | @naphnaphz ☆ | empty | empty | empty |
   * 
   * 4.) Each clan will have its own role
   *
   * 5.) Member limits for clans and requirement  
   *     Lvl 40 - 5
   *     Lvl 50 - 7
   *     Lvl 60 - 10
   *     Lvl 85 - 15
   *
   * 6.) Members that want to join must be level 15 or higher
   * 
   * 7.) Member that joins must consent
   ****************************************************************************
   ****************************************************************************
   ****************************************************************************
   * Proccess for creating clan
   * 
   * 1.) >clan create
   *    - Will open a new channel where a series of questions will be asked
   *    - Example:
   * 
   *    https://docs.google.com/document/d/1tMGowcf_e4wdsNDl38Dv_sNmHyyRN8GEQW-ld9f9oqc/edit?usp=sharing
   * 
   *
   * All of the functions for clans
   */
    
  /*
   * A function to find out if the member is in a clan.
   * @returns Boolean (value in table)
   */
  async function getIfMemInClan(member){
    return sql.get(`SELECT InClan FROM userdata WHERE userId=${member.id}`)
      .then(async x => x.InClan)
  }
  
  /*
   * A function to find out member's clan name.
   * @returns clan name
   */
  async function getMemClan(member){
    return sql.get(`SELECT clanName FROM userdata WHERE userId=${member.id}`)
      .then(async x => x.clanName)
  }
  
  /*
   * A function to find out member's level.
   * @returns level
   */
  async function getMemLvl(member){
    return sql.get(`SELECT level FROM userdata WHERE userId=${member.id}`)
      .then(async x => x.level)
  }

  /*
   *  Returns an object form of clan table.
   *  @param row id.
   */
  async function getClanData(id) {
    return sql.get(`SELECT * FROM clans WHERE _rowid_ = ${id}`)
        .then(async obj => obj);
  }

  /*
   * A function to find out if the max members allowed in a clan.
   * @returns max member count
   */
  async function getMaxMemInClan(member){
    let membersclan = await getMemClan(member)
    let clanleader = await getClanLeader(membersclan)
    let clanleaderlvl = await sql.get(`SELECT level FROM userdata WHERE userId=${clanleader}`)
      .then(async x => x.level)
    let maxClanMems=6
    if(clanleaderlvl>=85){
      maxClanMems=16
    }else if(clanleaderlvl>=60){
      maxClanMems=11;
    }else if(clanleaderlvl>=50){
      maxClanMems=8;
    }
    return maxClanMems;
  }
  
  /*
   * A function to find clan leader.
   * @returns Leader
   */
  async function getClanLeader(clanname){
    return sql.get(`SELECT clanLeader FROM clans WHERE clanName=${clanname}`)
      .then(async x => x.clanLeader)
  }
  
  /*
   * All Sub Commands Below:
   */
  const src = require('./clans');
  
  if(command==src.help.name){//overall and individual help...
    //chelp
    console.log(`chelp`);
  }// end of chelp
  
  if(command==src.help.aliases[6]){
    //cinfo
    console.log(`cinfo`);
  }// end of cinfo
  
  if(await getIfMemInClan(message.author)==false || null)return message.reply(`I'm sorry but you are currently not in any clan.`);
  
  if(command==src.help.aliases[0]){
    //csetdesc
    console.log(`csetdesc`);
    let desc = args.join(" ");
    let clanname = await getMemClan(message.author);
    let clanLeader = await getClanLeader(clanname)
    if(message.author.id!==clanLeader)return message.reply(`I'm sorry, it looks like you are in a clan but you are not the clan leader.`)
    if(desc.length>165)return message.reply(`I'm sorry but the description you have entered exceeds the character count.`)
    sql.run(`UPDATE clans SET clanDescription=${desc} WHERE clanLeader=${message.author.id}`)
  }// end of csetdesc
  
  if(command==src.help.aliases[1]){
    //csettag
    console.log(`csettag`);
    let tag = args.join(" ");
    let clanname = await getMemClan(message.author);
    let clanLeader = await getClanLeader(clanname)
    if(message.author.id!==clanLeader)return message.reply(`I'm sorry, it looks like you are in a clan but you are not the clan leader.`)
    if(tag.length>5)return message.reply(`I'm sorry but the tag you have entered exceeds the character count.`)
    sql.run(`UPDATE clans SET clanTag=${tag} WHERE clanLeader=${message.author.id}`)
  }// end of csettag
  
  if(command==src.help.aliases[2]){
    //caddmem
    console.log(`caddmem`);
  }// end of caddmem
  
  if(command==src.help.aliases[3]){
    //ckickmem
    console.log(`ckickmem`);
  }// end of ckickmem
  
  if(command==src.help.aliases[4]){
    //cleave
    console.log(`cleave`);
  }// end of cleave
  
  if(command==src.help.aliases[5]){
    //cpromote
    console.log(`cpromote`);
  }// end of cpromote
}//end of module.exports.run

module.exports.help = {
        name:"chelp",
        aliases:["csetdesc","csettag","caddmem","ckickmem","cleave","cpromote","cinfo"]
}