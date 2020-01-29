/**
 * Main module
 * @DatabaseFile retrieve database file.
 */
class DatabaseFile {
	constructor(Stacks) {
		this.stacks = Stacks
	}


	/**
     *	Initializer method
     */
	async execute() {
		const { isDev, code, reply, name, meta:{author} } = this.stacks

		//  Returns if user has no dev authority
        if (!isDev) return reply(code.GETLOG.UNAUTHORIZED)

        //  Output attachment
        return reply(code.GETLOG.RETURNING, {
            socket: [name(author.id)],
            simplified: true,
            image: `./.data/database.sqlite`,
            prebuffer: true
        })
	}
}

module.exports.help = {
	start: DatabaseFile,
	name:`retrieveDatabaseFile`,
	aliases: [`getdb`, `getdbfile`, `dbfile`, `sqlite`],
	description: `Retrieve most recent database`,
	usage: `>getdb`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: false
}