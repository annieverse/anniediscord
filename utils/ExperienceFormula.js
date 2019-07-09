const ranksManager = require(`./ranksManager`);
const databaseManager = require(`./databaseManager`);

/**
 * Experience formula wrapper.
 * @Experience
 */
class Experience {
    constructor(data) {
        this.data = data;
        this.message = data.message;
        this.ranks = new ranksManager(data.bot, data.message);
        this.db = new databaseManager(data.message.author.id);
    }

    //  Add new rank if user new exp is above threeshold.
    addRank() {
        this.message.guild.member(this.data.message.author.id).addRole(this.message.guild.roles.find(r => r.name === this.ranks.ranksCheck(this.data.updated.level).title));
    }

    //  Remove previous rank if new level gap is greater than 5.
    removeRank() {
        const previousDuplicateRanks = (this.ranks.ranksCheck(this.data.updated.level).lvlcap)
            .filter(val => val < this.data.updated.level);

        let idpool = [];
        for (let i in previousDuplicateRanks) {
            idpool.push(((this.ranks.ranksCheck(previousDuplicateRanks[i]).rank).id).toString())
        }
        return this.message.guild.member(this.data.message.author.id).removeRoles(idpool)
    }

    //  Register new exp data.
    updatingExp() {
        /**
         * Main experience formula used in Annie's level system
         * @param {Integer} x current exp
         * @param {Integer} level current level
         * @param {Integer} b current max exp/cap exp
         * @param {integer} c current curve exp until next exp cap
         * @formula
         */
        const formula = (x, level, b, c) => {
            for (let i = 150; i !== x; i += c) {
                b += c;
                c += 200;
                level++;
                if (i > x) {
                    break;
                }
            }
            return {
                x: x,
                level: level,
                b: b,
                c: c

            }
        }

        const accumulatedCurrent = this.data.total_gained + this.data.previous.currentexp;
        const main = formula(accumulatedCurrent, 0, 0, 150);
        
        //  Save new data
        this.data.updated.currentexp = accumulatedCurrent;
        this.data.updated.level = main.level;
        this.data.updated.maxexp = main.b;
        this.data.updated.nextexpcurve = main.c;

        //  Store new values
        this.db.updateExperienceMetadata(this.data.updated)
}

// Returns true if new_rank is different from previous one.
get rankUp() {
    let new_rank = this.ranks.ranksCheck(this.data.updated.level).title;
    let old_rank = this.ranks.ranksCheck(this.data.previous.level).title;

    return new_rank !== old_rank ? true : false;
}
}

module.exports = Experience;