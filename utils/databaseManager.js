
const sql = require('sqlite');
sql.open('.data/database.sqlite');
  /**
    *   Accessing database globally.
    *   {databaseUtils}
    */
class databaseUtils {

        /**
            *   id represent userId in userdata column.
            * @this.id
            */
        constructor(id) {
            this.id = id;
        }

        /**
         * Lifesaver promise. Used pretty often when calling an API.
         * @pause
         */
        pause(ms){
            return new Promise(resolve => setTimeout(resolve, ms));
        } // End of pause

        //  Pull neccesary data at once.
        get userMetadata() {
            return sql.get(
                `SELECT *
                FROM userdata
                INNER JOIN userinventories
                ON userinventories.userId = userdata.userId
                INNER JOIN usercheck
                ON usercheck.userId = userdata.userId
                INNER JOIN collections
                ON collections.userId = userdata.userId
                WHERE userdata.userId = "${this.id}"`
            )
        }


        get userBadges() {
            return sql.get(`
                SELECT *
                FROM userbadges
                WHERE userId = "${this.id}"
            `)
        }


        //  Accepts one level of an object. Returns sql-like string.
        toQuery(data) {
            let res = ``
            for(let key in data) {
                res += `${key} = ${key} - ${data[key]},`
            }
            res = res.replace(/.$/," ")
            return res;
        }
        
        //  Withdrawing multiple columns value
        consumeMaterials(cardmeta) {
            sql.run(`
                UPDATE userinventories
                SET ${this.toQuery(cardmeta)} 
                WHERE userId = "${this.id}"
            `)
            return this;
        }

        //  Set one value into card column
        registerCard(card_alias) {
            sql.run(`
                UPDATE collections
                SET ${card_alias} = 1
                WHERE userId = "${this.id}"
            `)
            return this;
        }


        storeArtcoins(value) {
            sql.run(`
                UPDATE userinventories
                SET artcoins = artcoins + ${value}
                WHERE userId = "${this.id}"
            `)
        }

        updateSkin(newvalue) {
            sql.run(`UPDATE userdata 
            SET interfacemode ="${newvalue}" 
            WHERE userId = ${this.id}`);
        }

        updateCover(newvalue) {
            sql.run(`UPDATE userdata 
            SET cover = "${newvalue}"
            WHERE userId = ${this.id}`);
        }

        async updateBadge(newvalue) {
            let badgedata = await this.userBadges;
            let slotkey = Object.keys(badgedata);
            let slotvalue = Object.values(badgedata);
            sql.run(`UPDATE userbadges 
            SET ${slotkey[slotvalue.indexOf(null)]} = "${newvalue}" 
            WHERE userId = ${this.id}`);
        }

        updateExpBooster(newvalue) {
            sql.run(`UPDATE usercheck 
            SET expbooster = "${newvalue}",
                expbooster_duration = ${Date.now()}
            WHERE userId = "${this.id}"`);
        }

        updateExperienceMetadata(data = {}) {
            sql.run(`UPDATE userdata 
            SET currentexp = ${data.currentexp},
            level = ${data.level},
            maxexp = ${data.maxexp},
            nextexpcurve = ${data.nextexpcurve}
            WHERE userId = "${this.id}"`);
        }

        updateDailies(dly_metadata) {
            //  Update daily date
            sql.run(`UPDATE usercheck
                     SET totaldailystreak = ${dly_metadata.countStreak},
                     lastdaily = "${Date.now()}"
                     WHERE userId = ${this.id}`);
            
            //  Update dailies reward
            sql.run(`UPDATE userinventories
                     SET artcoins = artcoins + ${dly_metadata.amount + dly_metadata.bonus}
                     WHERE userId = "${this.id}"`);
        }

        updateReps(dly_metadata) {
            //  Update daily date
            sql.run(`UPDATE usercheck
                     SET repcooldown = "${Date.now()}"
                     WHERE userId = ${this.id}`);
            
            //  Update dailies reward
            sql.run(`UPDATE userdata
                     SET reputations = reputations + ${dly_metadata.amount}
                     WHERE userId = "${dly_metadata.target_id}"`);
        }

        resetExperiencePoints() {
            sql.run(`
                UPDATE userdata
                SET currentexp = 0,
                maxexp = 100,
                nextexpcurve = 150,
                level = 0,
                WHERE userId = "${this.id}"
            `)
        }

        resetInventory() {
            //  Remove old entry
            sql.run(`DELETE FROM userinventories WHERE userId = "${this.id}"`);
            //  Add new entry
            sql.run(`INSERT INTO userinventories (userId) VALUES ("${this.id}")`);
        }

        deliverRewardItems(metadata = {}) {
            sql.run(`
                UPDATE userinventories
                SET artcoins = artcoins + ${metadata.artcoins},
                lucky_ticket = lucky_ticket + ${metadata.lucky_ticket}
                WHERE userId = "${this.id}"
            `)
        }


        withdraw(value, value_type) {
            sql.run(`UPDATE userinventories 
            SET ${value_type} = ${value_type} - ${value} 
            WHERE userId = "${this.id}"`);
        }

        addLuckyTickets(amount = 0) {
            sql.run(`
                UPDATE userinventories
                SET lucky_ticket = lucky_ticket + ${amount}
                WHERE userId = "${this.id}"
            `)
        }


        get luckyTicketDropRates() {
            return sql.all(`SELECT DISTINCT drop_rate FROM luckyticket_rewards_pool WHERE availability = 1`)
        }

        lootGroupByRate(rate) {
            return sql.get(`SELECT * FROM luckyticket_rewards_pool WHERE drop_rate = ${rate} AND availability = 1 ORDER BY RANDOM() LIMIT 1`)
        }


        /**
		Subtracting tickets by result of roll_type().
        @substract_ticket
		*/
		withdrawLuckyTicket(amount = 0) {
            sql.run(`UPDATE userinventories
             SET lucky_ticket = lucky_ticket - ${amount}
             WHERE userId = ${this.id}`)
        }
        
        //	Count total user's collected cards.
		async totalCollectedCards() {
			const data = await sql.get(`SELECT * FROM collections WHERE userId = ${this.id}`);
			for (let key in data) {
				if (!data[key]) delete data[key];
			}
			return Object.keys(data).length;
        }
        

        /**
         *  Storing rolled items straight into user inventory
         *  @param {Object} obj as parsed object of roll metadata
         */
        async storingUserGachaMetadata(obj = {}) {
            for (let keyv in obj) {
                const tablediff = keyv.indexOf(`card`) > -1 ? `collections` : `userinventories`;
                sql.run(`UPDATE ${tablediff} 
                         SET ${keyv} = CASE WHEN ${keyv} IS NULL 
                            THEN ${parseInt(obj[keyv])} 
                            ELSE ${keyv} + ${parseInt(obj[keyv])} 
                         END 
                         WHERE userId = "${this.id}"`);
            }
        }


        /**
         * Adding user reputation points
         * @param {Integer} amount Updated/added amount of user's reputation points
         */
        addReputations(amount = 0) {
            return sql.run(`UPDATE userdata
                            SET reputations = CASE WHEN reputations IS NULL
                                                THEN ${amount}
                                              ELSE reputations + ${amount}
                                            END
                            WHERE userId = "${this.id}"`)
        }


        get inventory() {
            return sql.get(`
                SELECT *
                FROM userinventories
                WHERE userId = "${this.id}"`)
        }

        //  Store new heart point
        addHeart() {
            sql.run(`
            UPDATE userdata 
            SET liked_counts = liked_counts + 1 
            WHERE userId = "${this.id}"
            `)
        }

        //  Enable user's notification
        enableNotification() {
            sql.run(`
                UPDATE userdata
                SET get_notification = 1
                WHERE userId = "${this.id}"
            `)
        }

        //  Disabled user's notification
        disableNotification() {
            sql.run(`
                UPDATE userdata
                SET get_notification = 0
                WHERE userId = "${this.id}"
            `)
        }
        
        /**
            *   Getting keys from object
            * @src: an object of data to be pulled from.
            */
        storingKey(src) {
            let container = [];
                for(let i in src) { container.push(i) }
                return container;
            }

            
        /**
            *   Getting value from object keys
            * @src: an object of data to be pulled from.
            */
        storingValue(src) {
            let container = [];
                    for(let q in src) { container.push(src[q]) }
                    return container; 
            }


        /**
            *   Getting value from object keys
            * @src: an object of data to be pulled from.
            * @ele: target key.
            */
        storingValueOfElement(src, ele) {
                let container = [];
                    for(let q in src) { container.push(src[q][ele]) }
                    return container; 
            }
                

            /**
            *   Register new item.
            *   @param name of item name.
            *   @param alias of item source alias.
            *   @param type of item type.
            *   @param price of item price.
            *   @param description of item description.
            */
        registerItem(name, alias, type, price, description) {
                return sql.get(`INSERT INTO itemlist (name, alias, type, price, desc) VALUES (?, ?, ?, ?, ?)`, [name, alias, type, price, description])
                .then(() => console.log(`New item: ${name} has been registered. With values of ${alias, type, price, description}.`)) 
        }



        /**
            *   Register new ID into table.
            * @param tablename of target table.
            * @param id of userId
            */
        registeringId(tablename, id) {
            return sql.run(`INSERT INTO ${tablename} (userId) VALUES (?)`, [id])
            .then(() => console.log(`New ID: ${id}, has been registered into ${tablename}.`))
        }       


        /**
            *   Register new column into given table.
            * @param tablename of target table.
            * @param columnname of new column.
            * @param type of column type.
            */
        registerColumn(tablename, columnname, type) {
                return sql.get(`ALTER TABLE ${tablename} ADD COLUMN ${columnname} ${type}`)
                .then(() => console.log(`New COLUMN: ${columnname}-${type}, has been registered into ${tablename}.`)) 
        }


            /**
            *   Register new table.
            * @param tablename of target table.
            * @param columnname of target column.
            * @param type of column type.
            */
        registerTable(tablename, columnname, type) {
                return sql.get(`CREATE TABLE ${tablename} (${columnname} ${type.toUpperCase()})`)
                .then(() => console.log(`New TABLE: ${tablename} has been created. With default COLUMN: ${columnname}-${type}.`)) 
        }


            /**
            *   Sum up value on column of table.
            * @param tablename of target table.
            * @param columnname of target column.
            * @param value of new value to be added on.
            *   @param id of target userid.
            */
        sumValue(tablename, columnname, value, id, idtype = "userId") {
            return sql.get(`SELECT * FROM ${tablename} WHERE ${idtype} ="${id}"`)
                            .then(async currentdata => {
                                sql.run(`UPDATE ${tablename} SET ${columnname} = ${currentdata[columnname] === null ? parseInt(value) : currentdata[columnname] + parseInt(value)} WHERE ${idtype} = ${id}`)
                                    .then(() => console.log(`ADDED ${value} VALUE on ${columnname} of ID: ${id}.`)) 
                            })
        }

        /**
         * Extendable function to add values to any table
         * 
         * @param {string} tablename the name of the table
         * @param {string} columnnames the name of the columns ie. 'col1, col2, col3, etc'
         * @param {string} values the input values ie. ''this is val 1', 'this is val 2', 'val3'
         */
        addValues(tablename, columnnames, values){
            return sql.run(`INSERT INTO ${tablename}(${columnnames}) VALUES (${values})`).then(()=>{
                console.log(`ADDED ${values} VALUES INTO ${columnnames} of Table: ${tablename}`)
            })
        }
            /**
            *   Subtract value on column of table.
            * @param tablename of target table.
            * @param columnname of target column.
            * @param value of new value to be added on.
            *   @param id of target userid.
            */
        subtractValue(tablename, columnname, value, id) {
            return sql.get(`SELECT * FROM ${tablename} WHERE userId ="${id}"`)
                            .then(async currentdata => {
                                sql.run(`UPDATE ${tablename} SET ${columnname} = ${currentdata[columnname] === null ? 0 : currentdata[columnname] - parseInt(value)} WHERE userId = ${id}`)
                                    .then(() => console.log(`SUBTRACT ${value} VALUE on ${columnname} of ID: ${id}.`)) 
                            })
        }


            /**
             *  Replacing value on column of table.
             *  @param tablename of target table.
             *  @param columnname of target column.
             *  @param value of new value to be added on.
             *  @param id of target userid.
             *  @param idtype of the id type (default: "userId")
             */
        replaceValue(tablename, columnname, value, id, idtype="userId") {
            return sql.run(`UPDATE ${tablename} SET ${columnname} = "${value}" WHERE ${idtype} = ${id}`)
                        .then(() => console.log(`New value (${value}) has been placed in ${id}-${columnname}.`)) 
        }



        /**
            *   Pull id data from given table.
            * @param tablename of target table.
            * @param id of userId
            */
        pullRowData(tablename, id, idtype='userId') {
            return sql.get(`SELECT * FROM ${tablename} WHERE ${idtype} = ${id}`).then(async parsed => parsed) 
        }



        /**
            *     Registering item type into shop.
            *   @param type of item type.
            *     @param opt of additional filter option. (default: "price < 999999")
            */
        classifyItem(type, opt='price > 0', order='price ASC') {
            return sql.all(`SELECT name, type, price, desc FROM itemlist WHERE type = "${type.toString()}" AND status = "sell" AND ${opt} ORDER BY ${order}`).then(async parsed => parsed) 
        }



        /**
            *   Find item on given array.
            *   Ignoring word case
            * @param src of target array.
            * @param id of target element in given src.
            */
        request_query(callback, itemname) {
            return sql.all(`SELECT upper(name), alias, type, price, desc, status, rarity FROM itemlist WHERE status = "sell"`)
                .then(rootgroup => callback(callback, itemname))
        }


        // Returns key-value
        lookfor(src, name) {
            for(let i in src) { 
                if(src[i] === name.toUpperCase()) {
                    return src[i]
                }
            }
        }


        // Get item obj.
        get_item(itemname) {
            return this.request_query(this.lookfor, itemname)
        }



        /**
            *   Get package obj from packagelist.
            * @param name of package name.
            */
        async pullPackage(name) {
            let src = await this.wholeIndexing('packagelist'); 
            let filtered = await this.storingValueOfElement(src, 'name');
            let itemIndex = this.itemIndexing(filtered, name);
            
                return sql.get(`SELECT * FROM packagelist WHERE name = "${itemIndex.toString()}"`).then(async parsed => parsed) 
        }



        /**
            *   Pulling item aliases from given package.
            * @param pkg of parsed pkg object.
            */
        async packageAlias(pkg) {
            
                let aliases = [];
                for(let i = 1; i <= 3; i++) {
                    sql.get(`SELECT alias FROM itemlist WHERE itemId = ${(pkg[`item` + i.toString()])}`)
                    .then(async parsed => await aliases.push(parsed.alias))

                    if(i === 3) { break; }
                }
                await this.pause(1000)
                return aliases;
        }



        /**
          * Returns true if the given package's badge was present in their userbadges.
          * Otherwise, false.
          * @param id of packagename
          * @param userbadges of user badges collection.
          */
         async packageCrossCheck(id, userbadges) {
            let targetPackage = await this.pullPackage(id)  
            let data = await this.packageAlias(targetPackage);
                return data.every(e => userbadges.includes(e));
        }



        /**
          * Pull collection of table data.
          * @param tablename
          */
        wholeIndexing(tablename, opt="") {
            return sql.all(`SELECT * FROM ${tablename} ${opt}`)
                            .then(async parsed => parsed)
        }


        /**
            *   Delete row data from given table.
            * @param tablename of target table.
            * @param id of userId
            * @param idtype of the id type.
            */
        removeRowData(tablename, id, idtype='userId') {
            return sql.run(`DELETE FROM ${tablename} WHERE ${idtype} = ${id}`)
            .then(() => console.log(`ID: ${id} OF GROUP: ${tablename} has been successfully removed.**`)) 
        }




        /**
            *   Pull ID ranking based on given descendant column order.
            * @param tablename of target table.
            * @param columnname of sorted descendant column. 
            * @param index of user.
            * @param val of returned data value.
            */
        indexRanking(tablename, columnname, index, val) {
                return sql.all(`SELECT ${val} FROM ${tablename} ORDER BY ${columnname} DESC`)
                                    .then(async x => x[index][val])
        }




        /**
            *   Pull Author ID ranking based on given descendant column order.
            * @param tablename of target table.
            * @param columnname of sorted descendant column. 
            */
        authorIndexRanking(tablename, columnname) {
                return sql.all(`SELECT userId FROM ${tablename} ORDER BY ${columnname} DESC`)
                                    .then(async x => x.findIndex(z => z.userId === this.id))
        }




        /**
            *   Pull packages from packagelist.
            */
        get packageCollections() {
                return sql.get(`SELECT * FROM packagelist`).then(async parsed => parsed) 
        }



        /**
            *   Pull total user collection size.
            */
        get userSize() {
                return sql.all(`SELECT * FROM userdata`)
                                    .then(async x => x.length )
        }


        /**
            *   Pull user collection of data.
            * @this.id
            */
        get userDataQuerying() {
                return sql.get(`SELECT * FROM userdata WHERE userId = ${this.id}`)
                                    .then(async parsed => parsed)
        }


        /**
            *   Pull user badges container of data.
            * @this.id
            */
        get badgesQuerying() {
                return sql.get(`SELECT * FROM userbadges WHERE userId = ${this.id}`)
                                    .then(async parsed => parsed)
        }


        /**
            *   Pull all the registered user data.
            * @this.id
            */
        get queryingAll() {
                return sql.all(`SELECT userId FROM userdata ORDER BY currentexp DESC`)
                                    .then(async parsed => parsed)
        }


        /**
            *   Pull all the available tables.
            * @no params
            */
        get listedTables() {
                return sql.all(`SELECT * FROM sqlite_master WHERE type='table'`)
                                    .then(async parsed => parsed)
        }


        /**
            *   Referenced to @userDataQuerying.
            * @this.userDataQuerying
            */
        get userdata() {
            return this.userDataQuerying;   
        }


        /**
            *   Referenced to @badgesQuerying.
            * @this.badgesQuerying
            */
        get badges() {
            return this.badgesQuerying; 
        }


        /**
            *   Pull user ranking data counted from all indexes.
            * @this.queryingAll
            */
        get ranking() {
            return this.queryingAll
                            .then(async data => data.findIndex(x => x.userId === this.id));
        }

}

module.exports = databaseUtils;
