const Command = require(`../../libs/commands`)
/**
 * Unequip sticker from user's profile.
 * Revised by klerikdust.
 * @author sunnyrainyworks
 */
class RemoveSticker extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here
     */
    async execute({ reply, bot:{db, locale:{REMOVE_STICKER}} }) {
		await this.requestUserMetadata(1)
		const res = await db.removeSticker(this.user.id)

		//  Tell user if no equipped stickers have been found
		if (res.changes < 1) return reply(REMOVE_STICKER.NO_CHANGES)
		//  Successfully unequipped all stickers
		return reply(REMOVE_STICKER.SUCCESSFUL, {color: `lightgreen`})
	}

}

module.exports.help = {
	start: RemoveSticker, 
	name:`removeSticker`, 
	aliases: [`removesticker`,`stickerremove`, `rmvsticker`], 
	description: `Unequip sticker from user's profile.`,
	usage: `removesticker`,
	group: `Manager`,
	permissionLevel: 0,
	multiUser: false
}