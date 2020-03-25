const Command = require(`../../libs/commands`)
/**
 * Free theme switcher for donator
 * @author klerikdust
 */
class SwitchTheme extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
        super(Stacks)
    }
    
    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, bot:{db, locale:{SWITCH_THEME}} }) {
        const darkThemeStrings = [`dark`, `black`, `darktheme`, `dark_profileskin`, `nightmode`, `night`]
        const lightThemeStrings = [`light`, `white`, `lighttheme`, `light_profileskin`, `lightmode`, `day`]
        await this.requestUserMetadata(2)
        
        //  Returns if user not categorized as server booster/doanor
        if (!this.user.meta.premiumUser) return reply(SWITCH_THEME.UNAVAILABLE)
        //  Returns if user didn't specify any keyword
        if (!this.args[0]) return reply(SWITCH_THEME.MISSING_KEYWORD)

        if (darkThemeStrings.includes(this.args[0])) {
            db.setTheme(`dark`, this.user.id)
            return reply(SWITCH_THEME.SET_NIGHTMODE)
        }

        if (lightThemeStrings.includes(this.args[0])) {
            db.setTheme(`light`, this.user.id)
            return reply(SWITCH_THEME.SET_LIGHTMODE)
        }

        //  Handle if no theme match with the keyword
        return reply(SWITCH_THEME.NO_MATCHING_KEYWORD)
	}
}


module.exports.help = {
	start: SwitchTheme,
	name: `switchingTheme`,
	aliases: [`theme`, `themeswitch`, `switchtheme`],
	description: `Free theme switcher for donator`,
	usage: `theme <Night/Day>`,
    group: `User`,
    permissionLevel: 0,
	public: true,
	multiUser: false
}