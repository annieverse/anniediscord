class userFinding {
	constructor(message, target) {
		this.message = message;
		this.target = target;
	};

	 async resolve(){
	      const userPattern = /^(?:<@!?)?([0-9]+)>?$/;
	      if(userPattern.test(this.target)) this.target = this.target.replace(userPattern, '$1');
	      let members = this.message.guild.members;

	      const filter = member => member.user.id === this.target
	          || member.displayName.toLowerCase() === this.target.toLowerCase()
	          || member.user.username.toLowerCase() === this.target.toLowerCase()
	          || member.user.tag.toLowerCase() === this.target.toLowerCase();

	          return members.filter(filter).first();
	  	}
 }


module.exports = {
  userFinding,
};
