const fsn = require("fs-nextra");
	/**
	* Managing utils for profile card.
	* {profileManger}
	*/
class profileManager {


	/**
		* Formatting each paragraph.
		* @string of user description
		*/
	paragraphFormat(string) {
			return {
						first: string.substring(0, 55),
						second: string.substring(55, 110),
						third: string.substring(110, 165)
					};
	}


	/**
		* Check whether string is null or reserved.
		* @string of user description
		*/
	checkDesc(string) {
			return string === null ? `A proud member of AAU!` : string;
	}


	/**
		* Check whether int is null or reserved.
		* @int of user reputation
		*/
	checkRep(int) {
			return int === null ? 0 : int;
	}


	/**
		* Check if data is Light or Dark.
		* @data of user interfacemode
		*/
	checkInterface(data) {
			return data === 'Light' ? 'Light' : data === 'Dark' ? 'Dark' : 'Light';
	}
	
	 
	/**
		* Check if string has alphanumeric character.
		* @data of user interfacemode
		*/
	checkAlphanumeric(string) {
			const format = /^[a-z0-9]+$/i;
			return format.test(string) === true ? 'Roboto' : 'KosugiMaru';
	} 


	/**
		* Check length of the character.
		* @char of given username
		*/
	checkPosition(char) {
			return char.length <= 4 ? 120 : char.length <= 6 ? 80 : 0;
	}


	/**
		* Check and adjust the size of the text.
		* @name length of user username.
		*/
	checkUsernameLength(name) {
		 return {
			get profiler() { return name.length > 10 ? 26 - (name.length - 10) : 26; },
			get welcomer() { return name.length > 10 ? 74 - (name.length - 10) : 74; }
			};       
	}
	

	/**
		* Check if string has alphanumeric character.
		* @current of user currentexp.
		* @max of user maxexp.
		* @curve of user nextexpcurve.
		* @barLength is the width size of the given rectangle.
		*/
	barSize(current, max, curve, barlength) {
			curve === 150 ? curve = max : curve;
			current = curve === 150 ? max-(max-current) : curve-(max-current);      
			return Math.floor(   ( (Math.floor( (current * 100) / curve).toFixed()) / 100 ) * barlength  );
	}


	/**
		* Load badges of given @id.
		* @id of the filename
		*/
	getBadge(id) {
			return fsn.readFile(`./images/badges/${id}.jpg`);
	}


	/**
		* Load cover of given @id.
		* @id of the filename
		*/
	getAsset(id) {
			return fsn.readFile(`./images/${id}.jpg`);
	}


};

module.exports = profileManager;    