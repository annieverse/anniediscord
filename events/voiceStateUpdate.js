const Discord = require("discord.js");
const palette = require('../utils/colorset.json');
const sql = require("sqlite");
sql.open(".data/database.sqlite");


module.exports = (bot, oldMember, newMember) => {
    /**
     * Explantion of varibles:
     * oldMemberChannel = newMember.voiceChannel
     * ^ so we dont have to type it everytime, it short cuts our way to the member's channel object (class) (same for oldMemberChannel)
     * .id gives the channels id identification so we can do channel specific tests
     * the first if statement tests for when a user joins any VC
     * the second if statement test for when a user leaves any VC
     * the third if statement test for when a user switched from any VC to another VC
     * 
     * GOAL:
     * create a way to give xp to users based on how long they are in VC (we can work on it and if we end up deciding on doing this we have it ready :)
     * 
     * Method/path to creation:
     * have a DB (database) to record multi shit
     *      userId
     *      time_join
     *      (maybe others)
     * in code:
     * calculate the amount of time in vc
     * have a method to give xp based on time in vc - random xp, so in other words a range f.ex 10-15/minute
     * give xp to user
     * 
     * NOTES:
     * I have created the skeleton. the If statements including the terms afk in them refer to the afk channel if the server sets one up
     * If user is muted then end session
     * 
     * Questions [put your questions under this line]:
     *
     * break down of varibles: (insert what you think) answers will be 'user object' or 'channel object'
     * oldMemberChannel and newMemberChannel are : <user.id>
     * oldMember and newMember are: user objects
     * 
     * Corrections:
     * oldMemberChannel and newMemberChannel are : channel object
     * oldMember and newMember are: user objects
     * 
     * (q = question, a = your answer, ca = pan's correction answer)
     * Q: So how would you grab a user?
     * A: get user_Id
     * CA: to grab a user's id it would be like this normally = message.authur.id but since we are in this weird event it is this = newMember.id/oldMember.id
     * CA(cont.): you can do let user_Id = newMember.id
     * not: almost
     * 
     * so how are we supposed to log the time information on the id
     * 
     * Q: So how would you log the info?
     * A(idea):
     * CA(idea): we can/ will probably use a DB. We will have to create the db, so we have to think about what info to store
     * 
     * Q: What info should we store?
     * A: the user's id great ohhhhhhhhhhh that explains it
     * CA: user's ID, time_join, we have to store the id in this db as a unique identifier, because if we dont we dont know what user joined at what time.
     * CA(cont): currently no boosts exists for being inside of VC, so we dont have to worry bout that. My card gives boost in the Text Channels
     *  
     * That's it :)
     * alrighty
     * i'll be hoping off then, thanks
     * i'm gunna add more skeleton for next time then we can just focus on one part at a time, np take care
     */

    // Grabs the channel object and assigns them to a varible
    let newMemberChannel = newMember.voiceChannel;
    let oldMemberChannel = oldMember.voiceChannel;

    // Grabs the guild that the bot is acting in
    //let guild = bot.guilds.get(voiceChatCommandChannel.guild.id);

    // grabs a afk channel if one exists, if not do nothing (No exp for being in vc)
    let afkChannel = bot.channels.get(bot.guilds.get(newMember.guild.id).afkChannelID);
    if (!afkChannel)return console.log("There is no afk channel so, I cannot give xp to those in vc currently until I learn how to do so :)")
    

    // Checks to make sure the user is not a bot
    if (oldMember.user.bot || newMember.user.bot) return

    // ALL DATA:
    // Channel object
    //console.log(`oldMember.voiceChannel: ${oldMember.voiceChannel}\nnewMember.voiceChannel: ${newMember.voiceChannel}`)
    // user object
    //console.log(`oldMember: ${oldMember}\nnewMember: ${newMember}`)

    /**
     * life saving promise :)
     * @param {number} ms 
     */
    const pause = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms * 1000));
    }

    /**
     * for when a user joins a VC
     */
    async function joinVC() {

        if (newMemberChannel.id !== afkChannel.id) {

        }
    }

    /**
     * for when a user leaves a VC
     */
    async function leaveVC() {

        if (oldMemberChannel.id !== afkChannel.id) {

        }
    }

    /**
     * For when a user changes/switches VC channels
     */
    async function changeVC() {

        if (newMemberChannel.id === afkChannel.id) {

        } else if ((newMemberChannel.id !== afkChannel.id) && (oldMemberChannel.id === afkChannel.id)) {

        }
    }

    if (oldMemberChannel === undefined && newMemberChannel !== undefined) {

        // What function goes here:
        //______()

        // User Joins a voice channel
        // identify user 
    } else if (oldMemberChannel !== undefined && newMemberChannel === undefined) {

        // What function goes here:
        //______()

        // User leaves a voice channel
        // identify user 
        // give range amount of xp / m accordingly
        // ^ adjust if user has card(s) or boosts
    } else if ((oldMemberChannel.id != newMemberChannel.id) || (newMemberChannel.id != oldMemberChannel.id)) {

        // What function goes here:
        //______()

        // User switches voice channel
        // identify user // aa
        // identify how long they spent in previous vc
        // ^ how-many minutes between time joined and time left
        // give range xp / m
        // ^ adjust if user has card(s) or boosts
    }
}