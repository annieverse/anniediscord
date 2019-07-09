class gachaContainerStoring {
    constructor(Stacks, container) {
        this.stacks = Stacks;
        this.container = container;
        this.db = Stacks.db(Stacks.meta.author.id)
    }


    /**
     *  Summing up all the extracted numbers from same item category.
     *  @param {String} codeitem as item alias to be accumulated with
     */
    accumulateValues(codeitem = ``) {
        return this.container.alias
        .filter(pcs => pcs.indexOf(codeitem) > -1)
        .map(pcs => parseInt(pcs, 10))
        .reduce((total, pcs) => total + pcs);        
    }


    /**
     *  Filtering duplicates and checks for rany card.
     *  @param {Object} src as source object to be filtered
     */
    additionalChecks(src = {}) {
        const { metacards, emoji, reply, code: {GACHA}, meta: { data } } = this.stacks;
        for (let key in src) {

            //	Multiply amount of fragments for user who had rany_card
            if (data.rany_card && (key === `fragments`)) src[key] = src[key] * (data.total_cards + 1);
    
            //Check for card duplicates
            if (key.indexOf(`card`) > -1) {
                if (data[key]) {
                    const convert_to_shard = key.replace(`card`, `shards`);
    
                    //	Each card will be dismantled into 5 shards & 10k fragments.
                    storing({
                        [convert_to_shard]: 5 * src[key],
                        fragments: 10000 * src[key],
                    });
    
                    reply(GACHA.DUPLICATE_CARDS, {
                        socket: [
                            metacards[key].fullname,
                            emoji(convert_to_shard),
                            5 * src[key],
                            convert_to_shard,
                            emoji(`fragments`),
                            10000 * src[key]
                        ]
                    })
    
                    delete src[key];
                    continue;
                }
            }
        }      
    }


    /**
     *  Removing numbers from item alias to be used as item categorizing.
     */
    get aliasKey() {
        return this.container.alias.map(el => el.replace(/[0-9]/g, ""))
    }


    /**
	 *	Pushing elements from aliasKey and removing underscore
	 * 	from element that only has single word.
     */
    get tagging() {
    	let res = [];
    	for (let i in this.aliasKey) {
    		if (this.aliasKey[i].charAt(0) === "_") {
                res.push(this.aliasKey[i].replace("_", ""))
                continue;
            }
    		res.push(this.aliasKey[i]);
    	}
    	return res;
    }


    /**
     *  Removing duplicates and set unique category
     */
    get categorizing() {
        let tagged = this.tagging;
        let res = tagged.filter((value, index) => tagged.indexOf(value) === index);
        return res;
    }

	
    /**
     * 	Merging all the numbers to their corresponding category
     *  and finishing up the object.
     *  Return an Object.
     */
    get mergingItems() {
        let category = this.categorizing
        let objres = {};
        for (let i in category) {
            objres[category[i]] = this.accumulateValues(category[i]);
        }
        return objres;
    }


    /**
     *  Initializer
     */
    async run() {
        //  Parse & merge roll data
        let parsed_container = this.mergingItems
        //  Wait for another item conditions check
        await this.additionalChecks(parsed_container)
        //  Withdrawing user's lucky tickets based on roll type
        await this.db.withdrawLuckyTicket(this.container.roll_type)
        //  Store inventory data
        await this.db.storingUserGachaMetadata(parsed_container)
    }
}

module.exports = gachaContainerStoring