

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
      const cap = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 85, 100];

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

            "0": this.getRoles('Pencilician'),
            "5": this.getRoles('Crayola Knight'),
            "10": this.getRoles('Crayomancer'),
            "15": this.getRoles('Brush Wizard'),
            "20": this.getRoles('Sketch Summoner'),
            "25": this.getRoles('Legendary Doodler'),
            "30": this.getRoles('Artifice Master'),
            "35": this.getRoles('Hellbound Painter'),
            "40": this.getRoles('Pastel Paladin'),
            "45": this.getRoles('Color Elementalist'),
            "50": this.getRoles('Copic Crusader'),
            "60": this.getRoles('Earthwork Alchemist'),
            "70": this.getRoles('Canvas Conqueror'),
            "85": this.getRoles('Fame Dweller'),
            "100": this.getRoles('The Creator'),
            "180": this.getRoles('Altered Pencilian')

      };

        return {
            title: ranks[(closestBelowLv(cap, lv)).toString()].name,
            rank: ranks[(closestBelowLv(cap, lv)).toString()],
            prevrank: ranks[(previousLvl(cap, lv)).toString()],
            currentrank: ranks[lv.toString()],
            nexttorank: (lv-previousLvl(cap, lv)),
            lvlcap: cap,
            color: (ranks[(closestBelowLv(cap, lv)).toString()].hexColor).toString()
            
            } 

    }
  }


module.exports = ranksManager;