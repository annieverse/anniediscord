const {Attachment} = require(`discord.js`)
const fs = require(`fs`)

class uploadFile {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async uploadFile() {
		const { message} = this.stacks
		const https = require(`https`)
		const file = fs.createWriteStream(`./core/images/${this.stacks.message.attachments.first().filename}`)
		https.get(this.stacks.message.attachments.first().url, function (response) {
			response.pipe(file)
		})
		let filepath = `./core/images/${message.attachments.first().filename}`
		return filepath
	}

	async removeFile(path){
		const { bot: { logger } } = this.stacks
		fs.unlink(path, (err) => {if (err) return logger.error(err)})
	}

	async bufferFile(file){
		const { message, bot: { logger } } = this.stacks
		fs.readFile(file, async function (err, buffer) {
			if (err){
				logger.error(err)
				await this.removeFile(file)
			}
			// Save buffer to database here
			message.channel.send(new Attachment(buffer, message.attachments.first().filename))
		})
	}

	async delay(ms) {
		return new Promise(function (resolve) { return setTimeout(resolve, ms) })
	}

	async execute() {
		const {message,reply} = this.stacks

		// Make sure the message contains a file
		if (message.attachments.size === 0) return reply(`I'm sorry but it seems you didnt include an attachment with your request`)

		// upload the file and save filepath in varible
		//let filepath = await this.uploadFile()
		await this.uploadFile()
		// wait for file to be uploaded
		await this.delay(5000)

		// buffer image
		//await this.bufferFile(filepath)

		//remove the file from the filesystem (to save on disk space)
		//await this.removeFile(filepath)

		return reply(`Your image file has been upload and saved`)
	}
}

module.exports.help = {
	start: uploadFile, 
	name:`uploadfile`, 
	aliases: [`fileupload`], 
	description: `attach an image with the command line and it will be uploaded`,
	usage: `uploadfile`,
	group: `Developer`,
	public: false,
	require_usermetadata: true,
	multi_user: true
}