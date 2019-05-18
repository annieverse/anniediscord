const config = process.env.PREFIX;
const palette = require('../colorset.json');
const sql = require("sqlite");

/**
 * A check for SQLite, to make sure all neccessary tables are in the data system.
 */
async function SQLCheckSetup() {
  
  console.log(`[LOG] Checking if the program is missing any sql tables and created them...`)
  
  sql.run(`CREATE TABLE IF NOT EXISTS blockedUsers (userId TEXT, username TEXT, blockedBy TEXT, timeAt INT)`);
  sql.run(`CREATE TABLE IF NOT EXISTS threadMessages (threadId TEXT, userId TEXT, username TEXT, body TEXT, isAnonymous INT, dmMessageId TEXT, timeAt INT)`);
  sql.run(`CREATE TABLE IF NOT EXISTS threads (threadId TEXT, status TEXT, userId TEXT, username TEXT, channelId TEXT, timeAt INT)`);
  sql.run(`CREATE TABLE IF NOT EXISTS clans (ClanTag TEXT, ClanName TEXT, ClanDesc TEXT, ClanLeader TEXT, ClanMembers TEXT)`);
  
  return console.log(`[LOG] All sql tables requirred are now created.`);
}

/**
 * A check to see if a user has a role higher then another role.
 * @param memberrole
 * @returns boolean
 */
async function roleCleranceCheck(memberrole, requiredrole){
  // @param memberrole is what role the member currently has
  // @param requiredrole is what role the member needs
  
  if(memberrole.position > requiredrole.position){
    //@returns Rank is Lower
    return true;
  }else{
    //@returns Rank is Higher
    return false;
  }
}

/**
 * A check to see if a user has a staff role.
 * @param user
 * @returns boolean
 */
async function isStaff(member) {
  
  console.log(`[LOG] Checking if the user is a staff member...`)
  
  let staffRoleOptions = [];
  let allStaffRoleOptions = config.staffRoles || "staff";
  
  for (var i=0; i<allStaffRoleOptions.length; i+=1) {
    staffRoleOptions.push(getRoles(allStaffRoleOptions.slice(i,i+1)));
  }
  
  if(member.roles.some(r=>[staffRoleOptions].includes(r.name))){
    return true;
  }else{
    console.log(`[LOG] ${member.user.username} is not a staff member.`);
    return false;
  }
}

/**
 * Gets the file name of a command.
 * @param file
 * @returns file name
 */
async function fileAliasesCheck(file) {
    const src = require(`./${file}`)
    return src.help.name;
  };

/**
 * Gets the role no matter if the input value is an id or the name itself.
 * @param role
 * @returns role
 */
async function getRoles(r) {
      return this.bot.guilds.get(this.message.guild.id).roles.find(n => n.name === r)
  }

/**
 * checks if the value is a number or not.
 * @param value
 * @returns boolean
 */
async function isNumeric(value){
  return !isNaN(value)
}

/**
 * checks if the value is a number or not.
 * @param string
 * @param numlines
 * @returns A correctly formatted paragraph
 */
async function formatString(string, numlines) {
    var length = string.length;
    var paraLength = Math.round((string.length)/numlines);
    var paragraphs = [];
    for (var i=0; i<numlines; i++) {
        var marker = paraLength;
        //if the marker is right after a space, move marker back one character
        if (string.charAt(marker-1) == " ") {
            marker--; 
        }
        //move marker to end of a word if it's in the middle
        while(string.charAt(marker) != " " && string.charAt(marker) != "") {
            marker++;
        }
        var nextPara = string.substring(0, marker)
        paragraphs.push(nextPara)
        string = string.substring((nextPara.length+1),string.length)
    }
   if(numlines===1){
     return {
						first: paragraphs[0]
					};
   }else if(numlines===2){
     return {
						first: paragraphs[0],
						second: paragraphs[1]
					};
   }else if(numlines===3){
     return {
						first: paragraphs[0],
						second: paragraphs[1],
						third: paragraphs[2]
					};
   }
}

async function UserFinder(message, target){
	      const userPattern = /^(?:<@!?)?([0-9]+)>?$/;
	      if(userPattern.test(target)) target = target.replace(userPattern, '$1');
	      let members = message.guild.members;

	      const filter = member => member.user.id === target
	          || member.displayName.toLowerCase() === target.toLowerCase()
	          || member.user.username.toLowerCase() === target.toLowerCase()
	          || member.user.tag.toLowerCase() === target.toLowerCase();
			 
	          return members.filter(filter).first();
	  	}

/**
 * checks if the value is greater than 0, and not 'NaN' or 'Infinity'
 * pair with "Example: if(isPosVal()) and Math.round() to round the argument safely."
 * @param value string or number
 * @returns boolean
 */
async function isPosVal(msg){
      return !Number.isNaN(Number(msg)) && !(Math.round(Number(msg)) <= 0) && Number.isFinite(Number(msg)) ;
}

/**
 * Used for getting the positive, non-zero integer
 * pair with "isPosVal()"
 * @param value string or number
 * @returns a rounded Integer, or 'NaN'
 */
async function getPosInt(msg){
      return !Number.isNaN(Number(msg)) && !(Math.round(Number(msg)) <= 0) && Number.isFinite(Number(msg)) ? Math.round(Number(msg)) : NaN;
}


module.exports = {
  SQLCheckSetup,
  isStaff,
  isNumeric,
  getRoles,
  roleCleranceCheck,
  fileAliasesCheck,
  formatString,
  UserFinder,
  isPosVal,
  getPosInt,
};
