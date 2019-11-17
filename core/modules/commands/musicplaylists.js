class musicplaylists {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async execute() {
		const {reply} = this.stacks
		let add = [
			`[Kpop](https://www.youtube.com/playlist?list=PLMYFChto7e10Q91tnvHqcTt5UKCQ871qA&jct=oKoPw3U3aPENK5fPx0Uo6u0mRVIxZg)`,
			`[Jazz](https://www.youtube.com/playlist?list=PLMYFChto7e11wc1Pp1MHrkM83MvIJRRKo&jct=XrQCh-EKvUGp1mJ0GsRIscp-PvFKRA)`,
			`[Random Good Songs](https://www.youtube.com/playlist?list=PLMYFChto7e13e9OUockq4MNxB27kwr_fl&jct=2YkQqcCXD6tA-JobP0nGo5LfT-vUpQ)`,
			`[Chill Songs](https://www.youtube.com/playlist?list=PLMYFChto7e135PfeUFmYIaWE1MU3R-6cI&jct=O1ceAwIz0vFaGSKCRtq8N9xuDa0O4Q)`,
			`[Classical](https://www.youtube.com/playlist?list=PLMYFChto7e13dGT6rRHBPpcxjUe567N1g&jct=80CyhD9fe547ydi5Td0gBdpHH5CKdQ)`,
			`[Weeb](https://www.youtube.com/playlist?list=PLMYFChto7e13a8tghaNtQDQsuEO0NIq4q&jct=OQsuGKUXuaM-cJzZ2NSso7JRVYJm3w)`,
			`[Meme](https://www.youtube.com/playlist?list=PLMYFChto7e12G_bOcZ2ZEIS5_tHeQJnWj&jct=9TMbtghZNYdlbNrz1qz9xfr0jULy1Q)`,
			`[American](https://www.youtube.com/playlist?list=PLMYFChto7e13iMnW4E_i3Wtll11sZtc7x&jct=i0gp0kV_0lP806fqPP-8W-VZblq34w)`,
			`[kchill/Korean Chill](https://www.youtube.com/playlist?list=PLMYFChto7e13_ftED0mSNliYHmrAGP2MD&jct=o85XFsT9sNTfAdvjjLCnosJ3iyva6A)`
		]

		let playlistHomepage = `[Playlists](https://www.youtube.com/channel/UCySgzXyxBXx6fz57KizxcDA/playlists?disable_polymer=1)`

		reply(`Here are song playlists you can add to (Just click the link and confirm):
			\n{0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}
			\nHere is a link to the playlist home page where u can grab any of the playlist links:
			\n{9}`,{
				socket:[
					add[0], add[1], add[2], add[3], add[4], add[5], add[6], add[7], add[8], playlistHomepage
				]
			})
	}
}

module.exports.help = {
	start: musicplaylists, 
	name:`musicplaylists`, 
	aliases: [`playlists`,`playlist`], 
	description: `links for being able to add to a playlist and grab a playlist link`,
	usage: `playlists`,
	group: `general`,
	public: true,
	require_usermetadata: false,
	multi_user: false,
	special_channels: [`459938699606491147`]
}