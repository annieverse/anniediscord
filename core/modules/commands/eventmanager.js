/* eslint-disable no-undef */
/* eslint-disable no-empty */
/* eslint-disable no-inner-declarations */
/* eslint-disable no-case-declarations */
const databaseManager = require(`../../utils/databaseManager.js`)

class addEvent extends databaseManager {
	constructor(Stacks) {
		super()
		this.stacks = Stacks
		this.required_roles = this.stacks.message.member.roles.find(r => Object.keys(this.stacks.roles.events).some(i => this.stacks.roles.events[i] === r.id))
	}

	/**
     * add a zero if number is less then 10
     * @param {number} i 
     */
	addZero(i) {
		if (i < 10) {
			i = `0` + i
		}
		return i
	}

	/**
     * deletes messages around a msg, limit of 2
     * @param {object} message 
     */
	deleteMessages(message) {
		message.channel.fetchMessages({ around: message.id, limit: 2 }).then(msgs => message.channel.bulkDelete(msgs))
	}
	/**
     * adds a event to the db
     */
	addEvent() {
		if (!this.required_roles) return reply(`I'm sorry but you do not have permission to use this command`)
		const { message, multicollector, collector, reply } = this.stacks

		let eventName
		let category
		let desc
		let prizes
		let organizers
		let date, dateEnd

		reply(`event category please?`)
		collector.on(`collect`, (msg) => {
			category = msg.content.toLowerCase()
			this.deleteMessages(msg)
			reply(`event name please?`)
			const secondCollector = multicollector(msg)
			secondCollector.on(`collect`, async secondMsg => {
				eventName = secondMsg.content

				let parsed = await this.pullRowData(`event_data`, `'${eventName}'`, `name`)
				if (parsed === undefined) parsed = { event: `placeholder` }
				if (parsed.event === eventName) return reply(`I'm sorry but that event already exists please start over and choose a different name`)

				this.deleteMessages(secondMsg)
				reply(`Now the date you want this to start, formated like this please: 1/5/19 or Mar 20 2019 [month/date/year]`, { footer: `The current date and time is: ${(new Date()).toString()}` })
				const thirdCollector = multicollector(secondMsg)

				thirdCollector.on(`collect`, thirdMsg => {
					// Handle message
					date = thirdMsg.content + ` `
					// Next Collector
					reply(`Now the time formated like this please: 12:00 [hour:minutes] [24 hour format]`, { footer: `The current date and time is: ${(new Date()).toString()}` })

					this.deleteMessages(thirdMsg)
					const forthCollector = multicollector(thirdMsg)

					forthCollector.on(`collect`, forthMsg => {
						date += forthMsg.content

						try {
							date = new Date(date)
						} catch (error) {
							message.channel.send(error.message)
						}

						reply(`Who will be runing this event, or who will be the organizer for this event?`, { footer: `Enter Me for yourself or just enter who ever it is :)` })

						this.deleteMessages(forthMsg)
						const fifthCollector = multicollector(forthMsg)

						fifthCollector.on(`collect`, fifthMsg => {
							if (fifthMsg.content.toLowerCase() === `me`) {
								organizers = fifthMsg.author
							} else {
								organizers = fifthMsg.content
							}
							reply(`What is a brief description for this event?\n If you enter "n/a" the description will be "Please Check the event announcement page for more details."`)

							this.deleteMessages(fifthMsg)
							const sixthCollector = multicollector(fifthMsg)

							sixthCollector.on(`collect`, sixthMsg => {
								if (sixthMsg.content.toLowerCase() === `n/a`) {
									desc = `Please Check the event announcement page for more details.`
								} else {
									desc = sixthMsg.content
								}

								reply(`What prizes will be given for this event?\n If you enter "n/a" the description will be "Please Check the event announcement page for more details."`)

								this.deleteMessages(sixthMsg)
								const seventhCollector = multicollector(sixthMsg)

								seventhCollector.on(`collect`, seventhMsg => {
									if (seventhMsg.content.toLowerCase() === `n/a`) {
										prizes = `Please Check the event announcement page for more details.`
									} else {
										prizes = seventhMsg.content
									}

									reply(`When would you like the event to end?\nIf one week please enter "1 week"\n Formated like this please: 1/5/2019 or Mar 20 2019 [month/date/year]`, { footer: `The current date and time is: ${(new Date()).toString()}` })

									this.deleteMessages(seventhMsg)
									const eighthCollector = multicollector(seventhMsg)

									eighthCollector.on(`collect`, eighthMsg => {
										if (eighthMsg.content.toLowerCase() === `1 week`) {
											let tempDate = new Date(date.valueOf())
											tempDate.setDate(date.getDate() + 7)
											dateEnd = tempDate.valueOf()
											try {
												dateEnd = new Date(dateEnd)
											} catch (error) {
												message.channel.send(error.message)
											}
											this.deleteMessages(eighthMsg)
											reply(`${date.toDateString()} At ${this.addZero(date.getHours())}:${this.addZero(date.getMinutes())}, with the name of the event being __${eventName}__. Is this correct?`, { footer: `y / n` })
											const tenthCollector = multicollector(msg)
											tenthCollector.on(`collect`, tenthMsg => {
												if (tenthMsg.content.toLowerCase() === `y`) {
													this.addValues(`event_data`, `name, desc, category, prizes, start_time, length, organizers`, `'${eventName}', '${desc}', '${category}', '${prizes}', ${date.valueOf()}, ${dateEnd.valueOf()}, '${organizers}'`)
													reply(`The event __${eventName}__ has been added and will display when the time is close.`)
												} else {
													reply(`Please start over, this event has not been added.`)
												}
												tenthCollector.stop()
												try {
													ninthCollector.stop()
												} catch (err) {

												}
												eighthCollector.stop()
												seventhCollector.stop()
												sixthCollector.stop()
												fifthCollector.stop()
												forthCollector.stop()
												thirdCollector.stop()
												secondCollector.stop()
												collector.stop()
											})
										} else {
											// Handle message
											dateEnd = eighthMsg.content + ` `
											// Next Collector
											reply(`Now the time formated like this please: 12:00 [hour:minutes] [24 hour format]`, { footer: `The current date and time is: ${(new Date()).toString()}` })
											const ninthCollector = multicollector(eighthMsg)

											ninthCollector.on(`collect`, ninthMsg => {
												dateEnd += ninthMsg.content

												try {
													dateEnd = new Date(dateEnd)
												} catch (error) {
													message.channel.send(error.message)
												}

												this.deleteMessages(eighthMsg)
												reply(`${date.toDateString()} At ${this.addZero(date.getHours())}:${this.addZero(date.getMinutes())}, with the name of the event being __${eventName}__. Is this correct?`, { footer: `y / n` })
												const tenthCollector = multicollector(msg)
												tenthCollector.on(`collect`, tenthMsg => {
													if (tenthMsg.content.toLowerCase() === `y`) {
														this.addValues(`event_data`, `name, desc, category, prizes, start_time, length, organizers`, `'${eventName}', '${desc}', '${category}', '${prizes}', ${date.valueOf()}, ${dateEnd.valueOf()}, '${organizers}'`)
														reply(`The event __${eventName}__ has been added and will display when the time is close. If you would like this event to repeat please run the update command.`)
													} else {
														reply(`Please start over, this event has not been added.`)
													}
													tenthCollector.stop()
													try {
														ninthCollector.stop()
													} catch (err) {

													}
													eighthCollector.stop()
													seventhCollector.stop()
													sixthCollector.stop()
													fifthCollector.stop()
													forthCollector.stop()
													thirdCollector.stop()
													secondCollector.stop()
													collector.stop()
												})
											})
										}
									})
								})
							})

						})

					})
				})
			})
		})
	}

	/**
     * set the status to ended
     * @param {string} event 
     */
	async endEvent(event) {
		if (!this.required_roles) return reply(`I'm sorry but you do not have permission to use this command`)
		const { reply } = this.stacks
		// Make sure an event exists
		let parsed = await this.pullRowData(`event_data`, `'${event}'`, `name`)
		if (parsed === undefined) return reply(`There are no events currently cataloged.`)
		if (parsed.name !== event) return reply(`There are no events currently cataloged.`)
		try {
			this.updateValue(`event_data`, `active`, `1`, `name`, `${event}`)
		} catch (error) {
			reply(error.message)
		}
		return reply(`The event, __${event}__ has had it's status changed to in-active`)
	}

	/**
     * remove the selected event
     * @param {string} event 
     */
	async removeEvent(event) {
		if (!this.required_roles) return reply(`I'm sorry but you do not have permission to use this command`)
		const { reply } = this.stacks
		// Make sure an event exists
		let parsed = await this.pullRowData(`event_data`, `'${event}'`, `name`)
		if (parsed === undefined) return reply(`There are no events currently cataloged.`)
		if (parsed.name !== event) return reply(`There are no events currently cataloged.`)

		try {
			this.removeRowData(`event_data`, `'${event}'`, `name`)
		} catch (error) {
			reply(error.message)
		}
		reply(`The event, __${event}__ has been removed`)
	}

	/**
     * Look up data on any event if it exists
     * @param {string} event 
     */
	async eventLookUp(event) {
		const { reply } = this.stacks
		// Make sure an event exists
		let parsed = await this.pullRowData(`event_data`, `'${event}'`, `name`)
		if (parsed === undefined) return reply(`There are no events currently cataloged.`)
		if (parsed.name !== event) return reply(`There are no events currently cataloged with that event name.`)

		let date = new Date(parsed.start_time)
		let end_date = new Date(parsed.length)
		let desc = parsed.desc
		let organizers = parsed.organizers
		let prizes = parsed.prizes
		let type = parsed.category
		let repeat = parsed.repeat_after
		repeat === 0 ? repeat = `Doesn't repeat` : repeatMaybe()
		function repeatMaybe() {
			try {
				let repeatdate = new Date(date.valueOf() + repeat)
				return repeat = `Repeats on ${repeatdate.toDateString()}`
			} catch (err) {
				return `Doesn't repeat`
			}
		}
		return reply(`The event you found from your search is:\n
            Name: ${parsed.name}\n
            Date: Starting on ${date.toDateString()} At ${this.addZero(date.getHours())}:${this.addZero(date.getMinutes())} and Ending on ${end_date.toDateString()} At ${this.addZero(end_date.getHours())}:${this.addZero(end_date.getMinutes())}\n
            Description: ${desc}\n
            Organizers: ${organizers}\n
            Prizes: ${prizes}\n
            Type of Event: ${type}\n
            ${repeat}`, { deleteIn: 10000 })
	}

	/**
     * shows all the cataloged events
     */
	async showAllEvents() {
		const { reply } = this.stacks
		let data = await this.pullData(`event_data`)
		// Make sure an event exists
		if (data[0] === undefined) return reply(`There are no events currently cataloged.`)
		let res = ``
		data.forEach(element => {
			let date = new Date(element.start_time)
			res += `Event: __${element.name}__, Date: ${date.toDateString()} Starting At ${this.addZero(date.getHours())}:${this.addZero(date.getMinutes())}\n`
		})

		return reply(res)
	}

	/**
     * update the name or date/time of a event
     */
	async updateEvent() {
		if (!this.required_roles) return reply(`I'm sorry but you do not have permission to use this command`)
		const { multicollector, collector, reply } = this.stacks
		let options = {
			name: ``,
			desc: ``,
			category: ``,
			prizes: ``,
			start_time: ``,
			length: ``,
			organizers: ``,
			repeat_after: ``,
			active: ``,
			occurance: ``
		}
		let defaultValues = {
			desc: `Please Check the event announcement page for more details.`,
			prizes: `Please Check the event announcement page for more details.`,
			organizers: `<@&507362015254413313>`,
			repeat_after: `0`,
			active: `0`,
			occurance: `0`
		}
		reply(`What Event would you like to edit?`, { footer: `please give the name of the event` })
		collector.on(`collect`, async (msg) => {
			// Handle message
			options.name = msg.content

			let parsed = await this.pullRowData(`event_data`, `'${options.name}'`, `name`)
			if (parsed === undefined) parsed = { event: `placeholder` }
			if (parsed.name !== options.name) return reply(`There are no events currently cataloged with that event name.`)
			options.name = parsed.name
			options.desc = parsed.desc
			options.category = parsed.category
			options.prizes = parsed.prizes
			options.start_time = parsed.start_time
			options.length = parsed.length
			options.organizers = parsed.organizers
			options.repeat_after = parsed.repeat_after
			options.active = parsed.active
			options.occurance = parsed.occurance

			this.deleteMessages(msg)

			reply(`What field would you like to edit?\n[name, description, category, prizes, start, end, organizers, repeat, active, occurance]`)
			const secondCollector = multicollector(msg)
			secondCollector.on(`collect`, secondMsg => {
				let field
				switch (secondMsg.content.toLowerCase()) {
				case `name`:
					field = `name`
					reply(`Please give the name you would like to change the event to.`)
					break
				case `description`:
					field = `desc`
					reply(`Please give a new description.`)
					break
				case `category`:
					field = `category`
					reply(`Please give the new category you would like this event to have.`)
					break
				case `prizes`:
					field = `prizes`
					reply(`Please give the the new prizes or enter 'n/a' for the default message.`)
					break
				case `start`:
					field = `start_time`
					reply(`Please give the new time like this: 8/13/2019 11:30`)
					break
				case `end`:
					field = `length`
					reply(`Please give the new time like this: 8/13/2019 11:30 or enter 1 week for a week from the start time.`)
					break
				case `organizers`:
					field = `organizers`
					reply(`Please give the updated organizers you would like this event to have, or enter 'n/a' for the default message.`)
					break
				case `repeat`:
					field = `repeat_after`
					reply(`Please give the amount of time you would like the event to happen again after.\nFormated like this : 1 days or 1 weeks, <number> <days or weeks>`)
					break
				case `active`:
					field = `active`
					reply(`Please say if you want the event to be active. yes or no`)
					break
				case `occurance`:
					field = `occurance`
					reply(`Assign what number the event is. For example, event 'Weekly event 24' needs to be changed to 'Weekly event 26' the number is what changes.`, { footer: `please input a number.` })
					break
				}
				this.deleteMessages(secondMsg)
				reply(`What would you like to change it to?`)
				const thirdCollector = multicollector(secondMsg)
				thirdCollector.on(`collect`, thirdMsg => {
					switch (field) {
					case `name`:
						options.name = thirdMsg.content
						reply(`Is this new value correct? \`${options.name}\``, { footer: `y or n` })
						break
					case `desc`:
						options.desc = thirdMsg.content
						reply(`Is this new value correct? \`${options.desc}\``, { footer: `y or n` })
						break
					case `category`:
						options.category = thirdMsg.content.toLowerCase()
						reply(`Is this new value correct? \`${options.category}\``, { footer: `y or n` })
						break
					case `prizes`:
						thirdMsg.content.toLowerCase() === `n/a` ? defaultValues.prizes : options.prizes = thirdMsg.content
						reply(`Is this new value correct? \`${options.prizes}\``, { footer: `y or n` })
						break
					case `start_time`:
						try {
							let newDate = new Date(thirdMsg.content)
							options.start_time = newDate.valueOf()
						} catch (error) {

						}
						reply(`Is this new value correct? \`${newDate.toDateString()} At ${this.addZero(newDate.getHours())}:${this.addZero(newDate.getMinutes())}\``, { footer: `y or n` })
						break
					case `length`:
						thirdMsg.content.toLowerCase() === `1 week` ? oneWeek() : newDateObject()
						function newDateObject() {
							try {
								let _newDateObject = new Date(thirdMsg.content)
								options.start_time = _newDateObject.valueOf()
							} catch (error) {

							}
						}
						function oneWeek() {
							try {
								let _newDate = new Date(options.start_time)
								let updateDate = _newDate.setDate(_newDate.getDate() + 7)
								options.length = updateDate.valueOf()
							} catch (error) {

							}
						}
						let new_Date = new Date(options.start_time)
						reply(`Is this new value correct? \`${new_Date.toDateString()} At ${this.addZero(new_Date.getHours())}:${this.addZero(new_Date.getMinutes())}\``, { footer: `y or n` })
						break
					case `organizers`:
						thirdMsg.content.toLowerCase() === `n/a` ? defaultValues.organizers : options.organizers = thirdMsg.content
						break
					case `repeat_after`:
						reply(`Please give the amount of time you would like the event to happen again after.\nFormated like this : 1 days or 1 weeks, <number> <days or weeks>`)
						let args = thirdMsg.content.split(` `)
						args[1].toLowerCase() === `days` ? repeatDay(args[0]) : args.toLowerCase() === `weeks` ? repeatWeek(args[0]) : errorHasOccured()
						function repeatDay(num) {
							let oneday = 86400000
							return options.repeat_after = oneday * num
						}
						function repeatWeek(num) {
							let oneweek = 604800000
							return options.repeat_after = oneweek * num
						}
						function errorHasOccured() {
							thirdCollector.stop()
							secondCollector.stop()
							collector.stop()
							reply(`please start over, you have enter a format that is not accepted.`)
						}
						reply(`Is this new value correct? \`${thirdMsg.content}\``, { footer: `y or n` })
						break
					case `active`:
						thirdMsg.content.toLowerCase() === `yes` ? options.active = defaultValues.active : thirdMsg.content.toLowerCase() === `no` ? options.active = 1 : errorHasOccured()
						reply(`Is this new value correct? \`${thirdMsg.content}\``, { footer: `y or n` })
						break
					case `occurance`:
						options.occurance = thirdMsg.content
						reply(`Is this new value correct? \`${options.occurance}\``, { footer: `y or n` })
						break
					}
					this.deleteMessages(thirdMsg)
					const forthCollector = multicollector(thirdMsg)
					forthCollector.on(`collect`, forthMsg => {
						if (forthMsg.content.toLowerCase() === `y`) {
							switch (field) {
							case `name`:
								this.updateValue(`event_data`, `name`, `${options.name}`, `name`, `${parsed.name}`)
								break
							case `desc`:
								this.updateValue(`event_data`, `desc`, `${options.desc}`, `name`, `${parsed.name}`)
								break
							case `category`:
								this.updateValue(`event_data`, `category`, `${options.category}`, `name`, `${parsed.name}`)
								break
							case `prizes`:
								this.updateValue(`event_data`, `prizes`, `${options.prizes}`, `name`, `${parsed.name}`)
								break
							case `start_time`:
								this.updateValue(`event_data`, `start_time`, `${options.start_time}`, `name`, `${parsed.name}`)
								break
							case `length`:
								this.updateValue(`event_data`, `length`, `${options.length}`, `name`, `${parsed.name}`)
								break
							case `organizers`:
								this.updateValue(`event_data`, `organizers`, `${options.organizers}`, `name`, `${parsed.name}`)
								break
							case `repeat_after`:
								this.updateValue(`event_data`, `repeat_after`, `${options.repeat_after}`, `name`, `${parsed.name}`)
								break
							case `active`:
								this.updateValue(`event_data`, `active`, `${options.active}`, `name`, `${parsed.name}`)
								break
							case `occurance`:
								this.updateValue(`event_data`, `occurance`, `${options.occurance}`, `name`, `${parsed.name}`)
								break
							}
							reply(`The new value has been updated for the event __${parsed.name}__`)
						} else {
							reply(`Please start over, this event has not been edited.`)
						}
						this.deleteMessages(forthMsg)
						forthCollector.stop()
						thirdCollector.stop()
						secondCollector.stop()
						collector.stop()
					})
				})
			})
		})
	}

	helpCenter() {
		const { args, reply } = this.stacks
		if (args[0] === `add`) {
			return this.addEvent()
		} else if (args[0] === `remove`) {
			return this.removeEvent(args.slice(1).join(` `))
		} else if (args[0] === `lookup`) {
			return this.eventLookUp(args.slice(1).join(` `))
		} else if (args[0] === `end`) {
			return this.endEvent(args.slice(1).join(` `))
		} else if (args[0] === `lookup-all`) {
			return this.showAllEvents()
		} else if (args[0] === `update`) {
			return this.updateEvent()
		} else {
			return reply(this.stacks.code.EVENT_MANAGER.SHORT_GUIDE, {
				footer: `<required>|[optional]`
			})
		}
	}

	publicHelpCenter() {
		const { args, reply } = this.stacks
		if (args[0] === `lookup`) {
			return this.eventLookUp(args.slice(1).join(` `))
		} else if (args[0] === `lookup-all`) {
			return this.showAllEvents()
		} else {
			return reply(this.stacks.code.EVENT_MANAGER.PUBLIC_SHORT_GUIDE, {
				footer: `<required>|[optional]`
			})
		}
	}

	async execute() {
		if (!this.required_roles) {
			return this.publicHelpCenter()
		} else {
			return this.helpCenter()
		}
	}
}

module.exports.help = {
	start: addEvent,
	name: `eventmanager`,
	aliases: [`event`, `e`],
	description: `Add a event with a time to display :)`,
	usage: `event`,
	group: `general`,
	public: true,
	require_usermetadata: false,
	multi_user: false
}