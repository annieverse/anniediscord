/**
 * Main module
 * @SwitchTheme Switching theme for booster user
 */
class SwitchTheme {
	constructor(Stacks) {
        this.stacks = Stacks
        this.darkTheme = [`dark`, `black`, `darktheme`, `dark_profileskin`, `nightmode`, `night`]
        this.lightTheme = [`light`, `white`, `lighttheme`, `light_profileskin`, `lightmode`, `day`]
	}
	async execute() {
		const { reply, isVIP, args, bot:{db}, meta:{author}, code:{SWITCH_THEME} } = this.stacks
        
        //  Returns if user not categorized as server booster
        if (!isVIP) return reply(SWITCH_THEME.UNAVAILABLE)
        //  Returns if user didn't specify any keyword
        if (!args[0]) return reply(SWITCH_THEME.MISSING_KEYWORD)

        //  Set to dark_profileskin if matched
        if (this.darkTheme.includes(args[0])) {
            db.setTheme(`dark_profileskin`, author.id)
            return reply(SWITCH_THEME.SET_NIGHTMODE)
        }

        //  Set to light_profileskin if matched
        if (this.lightTheme.includes(args[0])) {
            db.setTheme(`light_profileskin`, author.id)
            return reply(SWITCH_THEME.SET.SET_LIGHTMODE)
        }

        //  Handle if no theme match with the keyword
        return reply(SWITCH_THEME.NO_MATCHING_KEYWORD)
	}
}


module.exports.help = {
	start: SwitchTheme,
	name: `switchingTheme`,
	aliases: [`theme`, `switch`, `themeswitch`, `switchtheme`],
	description: `Switching theme for booster user`,
	usage: `theme`,
	group: `User`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}