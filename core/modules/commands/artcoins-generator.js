const User = require(`../../utils/userSelector`)

/**
 * Main module
 * @ArtcoinsGenerator Admin command to add artcoins
 */
class ArtcoinsGenerator {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	//  Init
	async execute() {
		const { pause, message, multicollector, command, commandfile, name, args, collector, palette, emoji, isEventManager,isEventMember, isAdmin, trueInt, reply, commanifier, code, bot:{db} } = this.stacks
		
		let userNames = []
		
		//  Returns if user doesn't have admin authority
		if (!isEventMember && !isAdmin && !isEventManager) return reply(code.UNAUTHORIZED_ACCESS)
		//if (!message.content.includes(`[` && `]`)) return reply(code.ADDAC.WRONG_FORMAT,{footer:`Include the \`[]\``})
		//let users = message.content.substring(message.content.indexOf(`[`) + 1, message.content.indexOf(`]`))
		let users = message.content.slice(command.length+2)
		let usersarr
		if (message.content.includes(`,`)) {
			usersarr = users.split(`,`)
		} else {
			usersarr = []
			usersarr.push(users.slice(command+1))
		}
		
		//  Returns if user not specifying any parameters
		if (!args[0]) return reply(code.ADDAC.SHORT_GUIDE)

		//  Confirmation
		reply(code.ADDAC.CONFIRMATION, {
			socket: [emoji(`artcoins`), users],
			color: palette.golden,
			notch: true
		})
			.then(async confirmation => {
				collector.on(`collect`, async msg => {
					let input = msg.content.toLowerCase()
					let amount = trueInt(input)

					//  Close connections
					confirmation.delete()
					collector.stop()
                

					//  Returns if input is a negative value
					if (!amount) return reply(code.ADDAC.NEGATIVE_VALUES)

					reply(`Please enter \`y\` to confirm`).then( async proceed =>{
						
						let secondCollector = multicollector(msg)
						secondCollector.on(`collect`, async (secondmsg) => {
							let inputtwo = secondmsg.content.toLowerCase()

							proceed.delete()
							secondCollector.stop()

							if (inputtwo != `y`) reply(code.ADDAC.TRANSACTION_CLOSED)

							//  Storing new balance value
							for (let index = 0; index < usersarr.length; index++) {
								try 
								{
									const element = usersarr[index]
									let userSelectorMetadata = {
										args: [element],
										message: message,
										commandfile: commandfile
									}
									let currentAuthor = await new User(userSelectorMetadata).getUser()
									db.setUser(currentAuthor.id).storeArtcoins(amount)
									userNames.push(name(currentAuthor.id))
									pause(3000)
								}
								catch(error)
								{
									null
								}
							}

							let userNamesCombined = userNames.join(`, `)
							
							//  Successful
							return reply(code.ADDAC.SUCCESSFUL, {
								socket: [
									userNamesCombined,
									emoji(`artcoins`),
									commanifier(amount)]
							})
						})
					})
				})
			})
	}
}


module.exports.help = {
	start: ArtcoinsGenerator,
	name: `artcoins-generator`,
	aliases: [`addac`, `addacs`, `addartcoin`],
	description: `Add artcoins to specific user.`,
	usage: `addac @user <amount>`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: false
}