/*
 *This is only a template, easy to pull from when making a new command
 *
 */
class commandName {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async execute() {
		const {reply, bot:{db}} = this.stacks
		try {
			let userdataData = await db._query(`SELECT * FROM userbadges WHERE slot1 IS NOT NULL and 
			slot2 IS NOT NULL or slot3 IS NOT NULL or slot4 IS NOT NULL or slot5 IS NOT NULL or slot6 IS NOT NULL or slotanime IS NOT NULL`
			,`all`
			)
			for (let index = 0; index < userdataData.length; index++) {
				let item = userdataData[index].slot1
				if (item == (null || undefined)) return
				let coverId = await db._query(`SELECT itemId FROM itemlist WHERE alias = ?`, `get`, [item])
				await db._transforInventory({ itemId: coverId.itemId, value: 1, userId: userdataData[index].userId })
			}		
			for (let index = 0; index < userdataData.length; index++) {
				let item = userdataData[index].slot2
				if (item == (null || undefined)) return
				let coverId = await db._query(`SELECT itemId FROM itemlist WHERE alias = ?`, `get`, [item])
				await db._transforInventory({ itemId: coverId.itemId, value: 1, userId: userdataData[index].userId })
			}
			for (let index = 0; index < userdataData.length; index++) {
				let item = userdataData[index].slot3
				if (item == (null || undefined)) return
				let coverId = await db._query(`SELECT itemId FROM itemlist WHERE alias = ?`, `get`, [item])
				await db._transforInventory({ itemId: coverId.itemId, value: 1, userId: userdataData[index].userId })
			}
			for (let index = 0; index < userdataData.length; index++) {
				let item = userdataData[index].slot4
				if (item == (null || undefined)) return
				let coverId = await db._query(`SELECT itemId FROM itemlist WHERE alias = ?`, `get`, [item])
				await db._transforInventory({ itemId: coverId.itemId, value: 1, userId: userdataData[index].userId })
			}
			for (let index = 0; index < userdataData.length; index++) {
				let item = userdataData[index].slot5
				if (item == (null || undefined)) return
				let coverId = await db._query(`SELECT itemId FROM itemlist WHERE alias = ?`, `get`, [item])
				await db._transforInventory({ itemId: coverId.itemId, value: 1, userId: userdataData[index].userId })
			}
			for (let index = 0; index < userdataData.length; index++) {
				let item = userdataData[index].slot6
				if (item == (null || undefined)) return
				let coverId = await db._query(`SELECT itemId FROM itemlist WHERE alias = ?`, `get`, [item])
				await db._transforInventory({ itemId: coverId.itemId, value: 1, userId: userdataData[index].userId })
			}
			for (let index = 0; index < userdataData.length; index++) {
				let item = userdataData[index].slotanime
				if (item == (null || undefined)) return
				let coverId = await db._query(`SELECT itemId FROM itemlist WHERE alias = ?`, `get`, [item])
				await db._transforInventory({ itemId: coverId.itemId, value: 1, userId: userdataData[index].userId })
			}
			
			userdataData = await db._query(`SELECT userId,cover FROM userdata WHERE cover != ? AND cover IS NOT NULL`
				, `all`
				, [`defaultcover1`])
			for (let index = 0; index < userdataData.length; index++) {
				let coverId = await db._query(`SELECT itemId FROM itemlist WHERE alias = ?`, `get`, [userdataData[index].cover])
				await db._transforInventory({ itemId: coverId.itemId, value: 1, userId: userdataData[index].userId })
			}
		} catch (error) {
			return reply(error.stack)
		}
		reply(`all done!`)
	}
}

module.exports.help = {
	start: commandName, 
	name:`transferdata`, // This MUST equal the filename
	aliases: [], // More or less this is what the user will input on discord to call the command
	description: `No function just a place holder for commands`,
	usage: `TemplateCommand`,
	group: `Admin`,
	public: false,
	require_usermetadata: true,
	multi_user: true
}