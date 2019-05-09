const fsn = require("fs-nextra");
	/**
	* Managing utils for profile card.
	* {profileManger}
	*/
class profileManager {


	  /**
		* Formatting each paragraph.
		* @string of user description.
		* @numlines of paragraph.
		*/
 formatString(string, numlines) {
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
		* Check whether badges is null or reserved.
		* @id of badge name
		*/
	checkBadges(id) {
			return id === null ? null : this.getBadge(id);
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
			get profiler() { return name.length > 10 ? 26 - ( Math.floor((name.length - 11) / 2) ) : 26; },
			get welcomer() { return name.length > 8 ? 74 - (2 * (name.length - 10)) : 74; },
      		get leveler() { return name.length > 10 ? 30 - (name.length - 10) : 30; },
		};       
	}
	

	/**
		* @current of user currentexp.
		* @max of user maxexp.
		* @curve of user nextexpcurve.
		* @barLength is the width size of the given rectangle.
		*/
	barSize(current, max, curve, barlength) {
			//curve === 150 ? curve = max : curve;
			//current = curve === 150 ? max-(max-current) : (curve-(max-current)); 
      //PanCurrent, user.max)
      if (curve === 150){
        return Math.floor(   ( (Math.floor( (current * 100) / max).toFixed()) / 100 ) * barlength  );
      }else{
        return Math.floor(   ( (Math.floor( (current * 100) / curve).toFixed()) / 100) * barlength  );
      }
	}


	/**
		* Load badges of given @id.
		* @id of the filename
		*/
	getBadge(id) {
			return fsn.readFile(`./images/badges/${id}.jpg`);
	}


	/**
		* Load image of given @id.
		* @id of the filename
		*/
	getAsset(id) {
			return fsn.readFile(`./images/${id}.png`);
	}

	/**
		* Load cover of given @id.
		* @id of the filename
		*/
	getCoverAsset(id) {
			return fsn.readFile(`./images/covers/${id}.png`);
	}


};

module.exports = profileManager;    