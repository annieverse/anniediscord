const sql = require(`sqlite`)
sql.open(`.data/database.sqlite`)
const databaseManager = require(`./databaseManager`)
const events = require(`./event-metadata`)


// Supporting transaction workflow. Initialized on each different category.
class Transaction {
	constructor({itemname, type, message, author}) {
		this.itemname = itemname
		this.type = type
		this.message = message
		this.author = author
		this.db = new databaseManager(this.author.id)
	}


	// Adding role
	Roles(data) {
		this.message.guild.members.get(this.author.id).addRole(this.message.guild.roles.find(n => n.name === data.name))
	}


	// Updating profile interface
	Skins(data) {
		this.db.updateSkin(data.alias)
	}


	//  Updating cover alias.
	Covers(data) {
		this.db.updateCover(data)
	}


	// Updating badges column
	Badges(data) {
		this.db.updateBadge(data)
	}

	// Updating badges column
	Unique(data) {
		this.db.addItems(data.itemId, 1)
	}

	// Updating badges column
	Sticker(data) {
		this.db.updateSticker(data)
	}

	// Applying EXP booster.
	Exp_booster(data) {
		this.db.updateExpBooster(data.alias)
	}


	// Parsing ticket-model item
	Tickets(data) {
		this[data.unique_type](data)
	}


	//  Withdrawing balance
	withdraw(data) {
		this.db.withdraw(data.price, data.currencyId)
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
		let itemstatus = `sell`
		if (this.message.channel.id == `614819522310045718`) {
			for (var key in events) {
				if (events.hasOwnProperty(key)) {
					if (this.message.channel.name.toLowerCase().includes(key)) {
						itemstatus = key+`-sale`
						break
					}
				}
			}
		}
		return sql.all(`SELECT itemId, name, upper(name), alias, type, unique_type, price, price_type, desc, status, rarity 
                                        FROM itemlist 
                                        WHERE status = "${itemstatus}" 
                                        AND type = "${this.type}"`)
			.then(rootgroup => this.lookfor(rootgroup))
	}


	// Get item obj.
	get pull() {
		return this.request_query
	}
}


module.exports = Transaction