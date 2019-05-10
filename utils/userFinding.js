
module.exports.resolve = async (message, target) => {
	      const userPattern = /^(?:<@!?)?([0-9]+)>?$/;
	      if(userPattern.test(target)) target = target.replace(userPattern, '$1');
	      let members = message.guild.members;

	      const filter = member => member.user.id === target
	          || member.displayName.toLowerCase() === target.toLowerCase()
	          || member.user.username.toLowerCase() === target.toLowerCase()
	          || member.user.tag.toLowerCase() === target.toLowerCase();
			 
	          return members.filter(filter).first();
	  	}
