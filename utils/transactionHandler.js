   const sql = require(`sqlite`);
   sql.open(`.data/database.sqlite`);


   // Supporting transaction workflow. Initialized on each different category.
   class Transaction {
       constructor(itemname, type, msg, user) {
           this.itemname = itemname;
           this.type = type;
           this.message = msg;
           this.author = user;
       }


       // Adding role
       Roles(data) {
           return this.message.guild.members.get(this.author.id).addRole(this.message.guild.roles.find(n => n.name === data.name));
       }


       // Updating profile interface
       Skins(data) {
           sql.run(`UPDATE userdata 
                            SET interfacemode ="${data.alias}" 
                            WHERE userId = ${this.author.id}`);
       }


       //  Updating cover alias.
       Covers(data) {
           sql.run(`UPDATE userdata 
                            SET cover = "${data.alias}"
                            WHERE userId = ${this.author.id}`);
       }


       // Updating badges column
       Badges(data) {
           sql.run(`UPDATE userbadges 
                                SET ${slotkey[slotvalue.indexOf(null)]} = "${data.alias}" 
                                WHERE userId = ${this.author.id}`);
       }

       // Applying EXP booster.
       Exp_booster(data) {
           sql.run(`UPDATE usercheck 
                                SET expbooster = "${data.alias}",
                                    expbooster_duration = ${Date.now()}
                                WHERE userId = ${this.author.id}`);
       }


       // Parsing ticket-model item
       Tickets(data) {
           return this[data.unique_type](data)
       }


       // Updating multiple badges.
       multiple_badges(src, user) {
           let idx = parseInt(slotvalue.indexOf(null));
           for (let i in src) {
               sql.run(`UPDATE userbadges 
                                        SET ${slotkey[idx + parseInt(i)]} ="${src[parseInt(i)]}" 
                                        WHERE userId = ${user.id}`);
           }
       }



       //  Withdrawing the balance
       withdraw(price, currency) {
           sql.run(`UPDATE userinventories 
                     SET ${currency} = ${currency} - ${parseInt(price)} 
                     WHERE userId = ${this.author.id}`);
       }


       // Returns key-value
       lookfor(src) {
           for (let i in src) {
               if (src[i][`upper(name)`] === this.itemname.toUpperCase()) {
                   return src[i]
               }
           }
       }


       // Returns an object of target item.
       get request_query() {
           return sql.all(`SELECT name, upper(name), alias, type, unique_type, price, price_type, desc, status, rarity 
                                        FROM itemlist 
                                        WHERE status = "sell" 
                                        AND type = "${this.type}"`)
               .then(rootgroup => this.lookfor(rootgroup))
       }


       // Get item obj.
       get pull() {
           return this.request_query;
       }
   }


   module.exports = Transaction;