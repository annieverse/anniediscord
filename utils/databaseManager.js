
const sql = require('sqlite');
sql.open('.data/database.sqlite');
  /**
	*	Accessing database globally.
	*	{databaseUtils}
	*/
class databaseUtils {

	/**
	  *	id represent userId in userdata column.
	  * @this.id
	  */
	constructor(id) {
		this.id = id;
	}


	/**
	  *	Getting keys from object
	  * @src: an object of data to be pulled from.
	  */
	storingKey(src) {
		let container = [];
		for(let i in src) { container.push(i) }
			return container;
		}


	/**
	  *	Pull user collection of data.
	  * @this.id
	  */
	get querying() {
			return sql.get(`SELECT * FROM userdata WHERE userId = ${this.id}`).then(async parsed => parsed)
		}

	/**
	  *	Pull all the registered user data.
	  * @this.id
	  */
	get queryingAll() {
			return sql.all(`SELECT userId FROM userdata ORDER BY currentexp DESC`).then(async parsed => parsed)
		}	


	/**
	  *	Referenced to @querying.
	  * @this.querying
	  */
	get userdata() {
		return this.querying;	
		}


	/**
	  *	Pull user ranking data counted from all indexes.
	  * @this.queryingAll
	  */
	get ranking() {
		return this.queryingAll.then(async data => data.findIndex(x => x.userId === this.id));
	}

};

module.exports = databaseUtils;
