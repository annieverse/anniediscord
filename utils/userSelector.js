`use-strict`;

/**
 * Handles user selection.
 * @utils as userFinding function source
 * @args as a chunks of message
 */
class userSelector {
    constructor(meta) {
        this.args = meta.args;
        this.utils = meta.utils;
        this.message = meta.message;
        this.cmd = meta.commandfile.help;
    }

    async get(){
        return !this.args[0] || !this.cmd.multi_user ? this.message.author : await this.utils.userFinding(this.args[0]);
    }
}

module.exports = userSelector