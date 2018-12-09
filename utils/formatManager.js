const Discord = require('discord.js');
const moment = require('moment');

  /**
  * Misc utils.
  * {formatterUtils}
  */
class formatterUtils {


  /**
	* Formatting each paragraph.
	* @timestamp of given unix time.
	*/
 formatedTime(timestamp) {
	  return moment(timestamp).format("dddd, Do MMMM YYYY");
	}

   /**
	* Formatting number into K format.
	* @num of given value
	*/   
 formatK(num) {
		return num > 999999 ? (num/1000000).toFixed(0) + 'M' : num > 999 ? (num/1000).toFixed(0) + 'K' : num
	}


  /**
	* Getting percentage.
	* @portion of portion value;
	* @total of whole percent
	*/
 getPercentage(portion, total) {
		return (Math.floor((portion * 100) / total)).toFixed();
	}   

  /**
	* Replace comma in a string of number.
	* @number of given value
	*/
 threeDigitsComa(number) {
		return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}


  /**
	* Adding ordinal suffix behind the given number.
	* @i of given number.
	*/
 ordinalSuffix(i) {
		var j = i % 10,
			k = i % 100;
		if (j == 1 && k != 11) {
			return i + "st";
		}
		if (j == 2 && k != 12) {
			return i + "nd";
		}
		if (j == 3 && k != 13) {
			return i + "rd";
		}
		return i + "th";
	   }


  /**
	* Wrapped simple discord message embed.
	* @color of given hex code.
	* @content of message content.
  * @message of discord message listener
	*/
 embedWrapper(message, color, content) {
    let embed = new Discord.RichEmbed()
            .setColor(color)
            .setDescription(content)
        	return message.channel.send(embed);
    }


}


module.exports = formatterUtils;