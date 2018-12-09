

  /**
  * Managing ranks in AAU.
  * {ranksManager}
  */
class ranksManager {

  /**
    * Passing discord events.
    * @this.bot of Discord.Client
    * @this.message of message listener
    */  
  constructor(bot, message) {
    this.bot = bot;
    this.message = message;
  }

  /**
    * Get roles through discord's collection.
    * @r of role property
    */ 
  getRoles(r) {
      return this.bot.guilds.get(this.message.guild.id).roles.find(n => n.name === r)
  }

  /**
    * Check ranks based on given lvl.
    * @lv of user level
    */  
  ranksCheck(lv) {

  /**
    * Level gap between ranks
    * @cap
    */ 
      const cap = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
       33, 36, 39, 42, 45, 48, 52, 56, 60, 64, 68, 72, 76, 80, 85, 100];

  /**
    * Filtering nearest below given value of an array.
    * @array, @val
    */ 
      const closestBelowLv = (array, val) => {
        return Math.max.apply(null,array.filter(function(v)
          { return v <= val }))
      };


  /**
    * Filtering below given value of an array.
    * @array, @val
    */ 
      const previousLvl = (array, val) => {
        return Math.max.apply(null,array.filter(function(v)
          { return v < val }))
      };


  /**
    * Collection of available ranks.
    * @ranks
    */
      let ranks = {

            "0": this.getRoles('Newblood'),
            "2": this.getRoles('Novice'),
            "4": this.getRoles('Amateur'),
            "6": this.getRoles('Warrior'),
            "8": this.getRoles('Contender'),
            "10": this.getRoles('Duelist'),
            "12": this.getRoles('Tactician'),
            "14": this.getRoles('Commander'),
            "16": this.getRoles('Berserker'),
            "18": this.getRoles('Gladiator'),
            "20": this.getRoles('Champion'),
            "22": this.getRoles('Master'),
            "24": this.getRoles('Hero'),
            "26": this.getRoles('Legend'),
            "28": this.getRoles('Archfiend'),
            "30": this.getRoles('Hellhound'),
            "33": this.getRoles('Demon'),
            "36": this.getRoles('Diablo'),
            "39": this.getRoles('Ascended'),
            "42": this.getRoles('Cherubium'),
            "45": this.getRoles('Seraphim'),
            "48": this.getRoles('Archangel'),
            "52": this.getRoles('Celestial'),
            "56": this.getRoles('Divine'),
            "60": this.getRoles('Heavenly Judge'),
            "64": this.getRoles('Celestial God'),
            "68": this.getRoles('Calamity Host'),
            "72": this.getRoles('Karma Killer'),
            "76": this.getRoles('Ruling Star'),
            "80": this.getRoles('Daybreaker'),
            "85": this.getRoles('Doombearer'),
            "100": this.getRoles('Overlord')

      };

        return {
            title: ranks[(closestBelowLv(cap, lv)).toString()].name,
            rank: ranks[(closestBelowLv(cap, lv)).toString()],
            prevrank: ranks[(previousLvl(cap, lv)).toString()],
            lvlcap: cap,
            color: (ranks[(closestBelowLv(cap, lv)).toString()].hexColor).toString()
            
            } 

    }
  }


module.exports = ranksManager;