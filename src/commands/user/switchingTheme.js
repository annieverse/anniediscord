const Command = require(`../../libs/commands`)
/**
 * Theme switcher for donator
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
	async execute({ reply, bot:{db} }) {
        const darkThemeStrings = [`dark`, `black`, `darktheme`, `dark_profileskin`, `nightmode`, `night`]
        const lightThemeStrings = [`light`, `white`, `lighttheme`, `light_profileskin`, `lightmode`, `day`]
        await this.requestUserMetadata(2)
        
        //  Returns if user not categorized as server booster/donator
        if (!this.user.premium) return reply(this.locale.SWITCH_THEME.UNAVAILABLE, {color: `red`})
        //  Returns if user didn't specify any keyword
        if (!this.fullArgs) return reply(this.locale.SWITCH_THEME.MISSING_KEYWORD, {color: `red`})

        if (darkThemeStrings.includes(this.fullArgs)) {
            db.setTheme(`dark`, this.user.id)
            return reply(this.locale.SWITCH_THEME.SET_NIGHTMODE, {color: `lightgreen`})
        }

        if (lightThemeStrings.includes(this.fullArgs)) {
            db.setTheme(`light`, this.user.id)
            return reply(this.locale.SWITCH_THEME.SET_LIGHTMODE, {color: `lightgreen`})
        }

        //  Handle if no theme match with the keyword
        return reply(this.locale.SWITCH_THEME.NO_MATCHING_KEYWORD)
	}
}


module.exports.help = {
	start: SwitchTheme,
	name: `switchingTheme`,
	aliases: [`theme`, `themeswitch`, `switchtheme`],
	description: `Theme switcher for donator`,
	usage: `theme <Night/Day>`,
    group: `User`,
    permissionLevel: 0,
	multiUser: false
}