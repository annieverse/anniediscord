/* eslint-disable no-unused-vars*/
/* eslint-disable no-useless-escape*/
/**
 * 	Evaluate line of code on air
 * 	@author klerikdust
 */
module.exports = {
	name: `eval`,
	aliases: [`ev`, `evl`, `exec`],
	description: `Evaluate line of code on air`,
	usage: `eval <LineOfCode>`,
	permissionLevel: 4,
	multiUser: false,
	async execute(client, reply, message, arg, locale) {
		const initTime = process.hrtime()
		try {
			let evaled = await eval(arg)
			if (typeof evaled !== `string`) evaled = require(`util`).inspect(evaled)
			return reply.send(locale.EXEC_CODE, {
				socket: {
					time: client.getBenchmark(initTime),
					result: evaled.slice(0, 2000)
				}
			})
		} catch (err) {
			return reply.send(locale.ERROR, {
				socket: {
					error: err
				}
			})
		}
	}
}