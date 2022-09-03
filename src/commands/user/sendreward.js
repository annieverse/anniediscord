const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits } = require(`discord.js`)
const customReward = require(`../../libs/customRewards`)
/**
 * Command's Class description
 * @author yourname
 */
module.exports = {
    name: `sendreward`,
    aliases: [],
    description: `Send a package made from 'makereward' to a user`,
    usage: `sendreward <user>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: false,
    messageCommand: false,
    default_member_permissions: PermissionFlagsBits.ManageEvents.toString(),
    options: [{
        name: `user`,
        description: `The user you would like to send to`,
        required: true,
        type: ApplicationCommandOptionType.User
    },{
        name: `package_name`,
        description: `The name of the reward package`,
        required: true,
        type: ApplicationCommandOptionType.String,
        autocomplete: true
    }],
    type: ApplicationCommandType.ChatInput,
    async autocomplete(client, interaction){
        /**
         * Fill choices with the available packages found in DB
         */
        const focusedValue = interaction.options.getFocused()
		const choices = [`faq`, `install`, `collection`, `call`, `count`]
        const filtered = choices.filter(choice => choice.startsWith(focusedValue))
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const user = options.getUser(`user`)
        const package = options.getString(`package_name`)
        interaction.reply(`{you} typed ${user}`)
        /**
         * TODO
         * retrive the buffer from the DB
         * add rewards to user
         */
         let rewardSchema = new customReward(package)
         rewardSchema.setup()
        //  let rawObject = rewardSchema.unpack(buffer)
         interaction.reply(`not yet implemented`)
    }
}
