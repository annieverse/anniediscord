const Discord = require("discord.js"),
      config = require("../prefix.json"),
      palette = require(`../colorset.json`),
      //utils = require(`../utils/utils.js`),
      prefix = config.prefix,//change this line
      sql = require("sqlite"),
      ranksManager = require(`../utils/ranksManager`);

module.exports.run = async(bot, command,message,args)=>{
  
  let bicon = bot.user.displayAvatarURL;
  let helpEmbed = new Discord.RichEmbed();
  let clandata= [];
  const configRank = new ranksManager(bot, message);
  
  if (!args[0]) {
    return message.reply(` I'm sorry but you need to enter a name for the clan.`)
  }else if(args[0].toLowerCase() === 'help'){
      helpEmbed.setTitle('Clan Settings | Info')
      helpEmbed.setDescription(`${prefix}clancreate <clanname> \n
                                Starts the creation proccess for a clan. Also the clan name has a max length of 24 characters.`)
      helpEmbed.setFooter(`Anime Artist United | Clan Settings | Create`, bicon);
      message.channel.send(helpEmbed)
  }// End of help command for create clan command
  else {//test
    /**
     * A function to member's level.
     * @returns ClanMember's level
     */
    async function getMembersRank(member){
      return sql.get(`SELECT level FROM userdata WHERE userId=${member.id}`).then(async x => x.level)
    }
    /**
     * A function to member's AC.
     * @returns ClanMember's AC
     */
    async function getMembersMoney(member){
      return sql.get(`SELECT artcoins FROM userdata WHERE userId=${member.id}`).then(async x => x.artcoins)
    }
    /**
     * A function to member's AC.
     * @returns ClanMember's AC
     */
    async function getMembersClanStatus(member){
      return sql.get(`SELECT InClan FROM usercheck WHERE userId=${member.id}`)
              .then(async x => x.InClan)
    }
    /**
     * A function to check if a clan name exists.
     * @returns Clan names
     */
  async function getClanNames(){
    return sql.get(`SELECT * FROM clans`).then(async x => x.clanName)
  }
    
    if(getMembersClanStatus(message.author) == null || getMembersClanStatus(message.author)== "true")return message.reply(` I'm sorry but you are already in a clan.`)
      
    if(getMembersRank(message.author)<40)return message.reply(` I'm sorry but you are not a high enough level to create a clan. You must be atleast level 40.`)
    
    if(getMembersMoney(message.author)<30000)return message.reply(` I'm sorry but you don't have enough AC for a clan, you need atleast 30k AC.`)
    
    if(args[0].length>24)return message.reply(` I'm sorry but your clan name that you entered is too long. The name exceded the limit by ${args[0].length-24} characters.`)
    
    let maxClanMems=6
    if(getMembersRank(message.author)>=85){
      maxClanMems=16
    }else if(getMembersRank(message.author)>=60){
      maxClanMems=11;
    }else if(getMembersRank(message.author)>=50){
      maxClanMems=8;
    }
    
    let username = await message.author.username;
    let tag = await message.author.discriminator
    let channelCreateNameJoin = await username.replace(/ /g, "-")+"-"+ await tag
    let channelCreateName = await channelCreateNameJoin.toLowerCase()
    console.log(channelCreateName)
    
        
    let category = message.guild.channels.find(c => c.name == "CLAN SETUP" && c.type == "category")
    // Create category if it doesn't exists.
    if (category==null) {await message.guild.createChannel("CLAN SETUP", "category"); console.log(`Category has been created.`)}else{console.log("Category channel exists");}
      
    
    let channelname = message.guild.channels.find(c => c.name == channelCreateName && c.type == "text")
    
    if (channelname != null && message.guild.channels.some(x=> x.id=channelname.id)) { //checks if there in an item in the channels collection that corresponds with the supplied parameters, returns a boolean
      console.log(`channel exists .....................`)
      console.error
      return; //prevents the rest of the code from being executed
    }else{
      console.log(`channel created.....................`)
    
      await message.guild.createChannel(channelCreateName, "text", [{
        id:message.guild.id,
        deny: ['VIEW_CHANNEL']
      }])    
      
      let channelget = message.guild.channels.find(c => c.name == channelCreateName && c.type == "text");
      
      await channelget.setParent(category.id);
      
      console.log(`Giving || ${message.author.username} || perms to channel.`);
      channelget.overwritePermissions(message.author.id, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: true
      })
        .then()
        .catch(console.error);
      console.log(`done giving perms.`);
      
      console.log(`Giving || ${configRank.getRoles('Creators Council').name} || perms to channel.`);
      channelget.overwritePermissions(configRank.getRoles('Creators Council'), {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: true
      })
        .then()
        .catch(console.error);
      console.log(`done giving perms.`);
      
      
      clandata.push(args.join(" ")); // Clan Name        0
      clandata.push(message.author.tag) // Clan Leader        1
      clandata.push(args[0].substring(0,5)) // Clan tag        2
      clandata.push(`Hey welcome to our clan **${clandata[0]}**`) // Clan Description      3
      clandata.push(message.author.tag) // Clan Members        4
      clandata.push(message.author.id) // SQL CLAN LEADER / MEMBERS     5
      clandata.push(message.member) // original message.member      6
      
      //console.log(getClanNames().some(x=>x==clandata[0]))
      let setupEmbed = new Discord.RichEmbed();
      
      let messageToEdit
      
      setupEmbed.setTitle('Clan Settings | Create')
      setupEmbed.setDescription(`To fill out the information, just type the number you wish to edit then the apporite info. So an example would be "1 Pans". Also you can type CANCEL at any point to cancel the proccess, keep in mind a clan costs 30k AC. Please react with ☑ when done so the proccess can be finished and your clan be created!!!`)
      setupEmbed.addField(`[1] Clan Name:`,clandata[0])
      setupEmbed.addField(`Clan Leader:`,`${clandata[1]}`)
      setupEmbed.addField(`[2] Clan Tag:`,`『${clandata[2]}』`)
      setupEmbed.addField(`Clan Tag Info:`,`The clan tag if left empty, it will be the first 5 characters of the clan name. If you wish to make a custom one, it has to be no more than 5 characters long. In other words, the max length is 5 letters long.`)
      setupEmbed.addField(`[3] Clan Description:`,`${clandata[3]}`)
      setupEmbed.addField(`Clan Description Info:`,`The clan description if left empty, it will say "Hey welcome to our clan ${args[0]}". If you wish to make a custom one, it has to be no more than 165 characters long. In other words, the max length is 165 letters long.`)
      setupEmbed.addField(`Clan Members (1/${maxClanMems}):`,`${clandata[4]}`)
      setupEmbed.setFooter(`Anime Artist United | Clan Settings | Create`, bicon);
      channelget.send(`<@${message.author.id}>`).then(msg=>{msg.delete();}).then(channelget.send(setupEmbed).then(msg=>{msg.react(`☑`); messageToEdit=msg.id}).then(msg=>{
        
        const collector = new Discord.MessageCollector(channelget, m => m.author.id === message.author.id);
        
        collector.on('collect', message => {
            if (message.content.startsWith("1")) {
              let clanname = message.content.slice(1)
              if(clanname.length>24){
                return message.reply(` I'm sorry but your clan name that you entered is too long. The name exceded the limit by ${clanname.length-24} characters.`)
              }else{
                setupEmbed.fields[0].value = clanname;
                //
                // Edit Embed
                //
                channelget.fetchMessage(messageToEdit)
                  .then(message => message.edit(setupEmbed))
                  .catch(console.error);
                
                message.delete(1000);
                clandata[2] = clanname;
              }
            } else if (message.content.startsWith("2")) {
              let clantag = message.content.slice(1)
              if(clantag.length>6){
                return message.reply(` I'm sorry but that tag is too long, the maximum length is 5 characters.`)
              }else{
                setupEmbed.fields[2].value = `『${clantag}』`;
                //
                // Edit Embed
                //
                channelget.fetchMessage(messageToEdit)
                  .then(message => message.edit(setupEmbed))
                  .catch(console.error);
                message.delete(1000);
                clandata[2] = clantag;
              }
            } else if (message.content.startsWith("3")) {
                let newDescription = message.content.slice(1);
              
              if(newDescription.length>165){
                newDescription=message.content.substring(1,165);
              }
              
              setupEmbed.fields[4].value = newDescription;
                //
                // Edit Embed
                //
                channelget.fetchMessage(messageToEdit)
                  .then(message => message.edit(setupEmbed))
                  .catch(console.error);
              message.delete(1000);
              clandata[3] = newDescription;
                      
            }else if (message.content.startsWith("CANCEL")){
              return channelget.delete();
            }
        })// End of collector
        
        const reactionfilter = (reaction, user) => reaction.emoji.name === `☑` && user.id === clandata[5];
        channelget.fetchMessage(messageToEdit)
                  .then(message =>{ 
          const reactioncollector = message.createReactionCollector(reactionfilter);
          reactioncollector.on('collect', async reaction => {
                sql.get(`SELECT clanLeader FROM clans WHERE clanLeader=${clandata[5]}`).then(async row=>{
                  if (!row){
                    sql.run(`INSERT INTO clans (clanTag, clanName, clanDesc, clanLeader, clanMember1, clanMember2, clanMember3, clanMember4, clanMember5, clanMember6, clanMember7, clanMember8, clanMember9, clanMember10, clanMember11, clanMember12, clanMember13, clanMember14, clanMember15) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                      [clandata[2], clandata[0], clandata[3], clandata[5], clandata[5], null, null, null, null, null, null, null, null, null, null, null, null, null, null])
                  }
                });
            sql.get(`SELECT artcoins FROM usercheck WHERE userId=${message.author.id}`).then(async row=>{
                  if (row){
                    sql.run(`UPDATE userdata SET artcoins=${row.artcoins-30000} WHERE userId=${clandata[5]}`)
                    sql.run(`UPDATE usercheck SET InClan=true WHERE userId=${clandata[5]}`)
                    sql.run(`UPDATE usercheck SET clanName=${clandata[0]} WHERE userId=${clandata[5]}`)
                  }
                });
            
            channelget.delete();
            let clanrole = message.guild.roles.find(r => r.name === clandata[0]);
            if (!clanrole){
              try{
                clanrole = await message.guild.createRole({
                  name: clandata[0],
                  color: "#000000",
                  permissions:[]
                })
              }catch(e){
                console.log(e.stack);
              }
            }
            clandata[6].addRole(clanrole.id)
        });
          })
                  .catch(console.error);
        
        
        
      }));
      
    }
  }// End of create command
  
}//end of module.exports.run

module.exports.help = {
        name:"clancreate",
        aliases:[]
}