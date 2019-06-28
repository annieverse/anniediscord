`use-strict`;

/**
 * Handles user selection.
 * @utils as userFinding function source
 * @args as a chunks of message
 */
class userSelector {
    constructor(meta) {
        this.args = meta.args;
        this.message = meta.message;
        this.cmd = meta.commandfile.help;
    }

    /**
     * Finds a user by id, or tag or plain name
     * @param target the arg for the user (id, name, mention)
     * @returns {object} user object
     */
    async findUser(target) {
        const userPattern = /^(?:<@!?)?([0-9]+)>?$/;
        if (userPattern.test(target)) target = target.replace(userPattern, '$1');
        let members = this.message.guild.members;

        const filter = member => member.user.id === target ||
            member.displayName.toLowerCase() === target.toLowerCase() ||
            member.user.username.toLowerCase() === target.toLowerCase() ||
            member.user.tag.toLowerCase() === target.toLowerCase();

        return members.filter(filter).first();
    }

    async get(){
        return !this.args[0] || !this.cmd.multi_user ? this.message.author : await this.findUser(this.args[0]);
    }
}

module.exports = userSelector