const customReward = require(`../../libs/customRewards`)
const stringSimilarity = require(`string-similarity`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    Collection,
    ActionRowBuilder,
    ComponentType,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits
} = require(`discord.js`)

/**
 * Output bot's latency
 * @author Fryingpan
 */
module.exports = {
    name: `makereward`,
    aliases: [`mr`],
    description: `make a custom reward package`,
    usage: `makereward`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: false,
    default_member_permissions: PermissionFlagsBits.ManageEvents.toString(),
    options: [{
        name: `create`,
        description: `make a new reward package`,
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `package_name`,
            description: `What to call the reward package`,
            required: true,
            type: ApplicationCommandOptionType.String
        }, {
            name: `ac`,
            description: `how much ac to give as reward`,
            required: false,
            type: ApplicationCommandOptionType.Integer,
            min_value: 0,
            max_value: 10000
        }, {
            name: `roles`,
            description: `how many roles do you want to give`,
            required: false,
            type: ApplicationCommandOptionType.Integer,
            min_value: 0,
            max_value: 5
        }, {
            name: `items`,
            description: `how many roles do you want to give`,
            required: false,
            type: ApplicationCommandOptionType.Integer,
            min_value: 0,
            max_value: 5
        }]
    }, {
        name: `delete`,
        description: `delete a package`,
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `package_name`,
            description: `the name of the package name`,
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        }]
    }, {
        name: `list`,
        description: `delete a package`,
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `maketable`,
        description: `make the database table`,
        type: ApplicationCommandOptionType.Subcommand,
        default_member_permissions: PermissionFlagsBits.Administrator.toString()
    }],
    type: ApplicationCommandType.ChatInput,
    async Iexecute(client, reply, interaction, options, locale) {
        if (options.getSubcommand() === `maketable`) return client.db.registerCustomRewardTable()

        // Test if the delete sub command was executed
        if (options.getSubcommand() === `delete`) return this.deletePackage(client, reply, interaction, options, locale)

        // Test if the list sub command was executed
        if (options.getSubcommand() === `list`) return this.listPackages(client, reply, interaction, options, locale)

        // Test if any other parameter was entered and if it wasn't exit the commands and let the user know
        if (!options.getInteger(`roles`) && !options.getInteger(`items`) && !options.getInteger(`ac`)) return reply.send(`Sorry must pick one of the other options`)

        // Set up the schema userd to store the data
        const packageName = (options.getString(`package_name`)).toLowerCase()

        const packages = await client.db.getRewardAmount(interaction.guild.id)
        if (packages.length >= 25) return reply.send(`I'm sorry but you have reached the max amount of packages. Please delete one if you wish to make another one.`)
        
        const packages_collection = new Collection()
        
        const rewardSchema = new customReward(packageName)
        packages.forEach(element => {
            packages_collection.set(element.reward_name, rewardSchema.unpack(element.reward))
        })
        if (packages_collection.has(packageName)) return reply.send(`I'm sorry but you have a package with that name already`)

        // Set up varibles to hold the values we want to add to the schema
        let fin_roles = []
        let items = []
        let acAmount = 0

        // Set up varibles to control the flow of input
        let roleAmount = 0
        let itemAmount = 0
        let phase = 0
        let endPhase = 0

        // This varible is to keep track of messages that the user will see
        // Needs to be empty so we can add values only when we want them to show
        let trackingMessageContent = {
            start: `The package you are creating is named ${packageName}`
        }


        // Create the cooldown for the command so a user cant start two instances of the command
        const sessionID = `REWARD_REGISTER:${interaction.guild.id}@${interaction.member.id}`
        if (await client.db.redis.exists(sessionID)) return reply.send(`create_SESSION_STILL_ACTIVE`)
        client.db.redis.set(sessionID, 1, `EX`, 60 * 3)


        let trackingMessage = await reply.send(Object.values(trackingMessageContent).join(`\n`), {
            simplified: true
        })

        // Check if the input for amount of ac was given and if yes set the amount and update the tracking message
        if (options.getInteger(`ac`)) {
            acAmount = options.getInteger(`ac`)
            trackingMessageContent[`ac`] = `AC amount set to ${acAmount}`
            updateTrackerMessage()
            if (!options.getInteger(`roles`) && !options.getInteger(`items`)) return confirmOrCancel()
        }

        // Test if the option for amount of roles was entered otherwise test if the option for amount of items was entered
        if (options.getInteger(`roles`)) {
            roleAmount = options.getInteger(`roles`) // how many roles maximum should there be
            trackingMessageContent[`roles`] = `(0/${roleAmount}) roles selected`
            if (options.getInteger(`items`)) {
                endPhase = 1
                itemAmount = options.getInteger(`items`)
                trackingMessageContent[`items`] = `(0/${itemAmount}) items selected`
            }
            updateTrackerMessage()
            phaseOne()
        } else if (options.getInteger(`items`)) {
            endPhase = 1
            itemAmount = options.getInteger(`items`) // how many items maximum should there be
            trackingMessageContent[`items`] = `(0/${itemAmount}) items selected`
            phase = 1
            updateTrackerMessage()
            phaseTwo()
        }

        async function phaseOne() {
            const roleOptions = await setRoleOptions(interaction) // get available roles to select from
            
            // End phase if there are no roles available
            if (!roleOptions.size) {
                trackingMessageContent[`roles`] = `(0/0) roles selected, There are no roles available to add`
                items = []
                return reply.send(`Sorry you dont have any roles for me to give try moving my role higher.`, { followUp: true })
            }

            const buttonCustomId = sessionID + `role`
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(buttonCustomId)
                        .setLabel(`Role`)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`finished`)
                        .setLabel(`Finished`)
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`cancel`)
                        .setLabel(`Cancel`)
                        .setStyle(ButtonStyle.Danger)
                )
            const role_adding = await reply.send(`Time to add any roles if you wish.`, { followUp: true, components: row })
            const member = interaction.user.id
            const filter = interaction => (interaction.customId === buttonCustomId || interaction.customId === `cancel` || interaction.customId === `finished`) && interaction.user.id === member
            const buttonCollector = role_adding.createMessageComponentCollector({ filter, time: 30000 })
            buttonCollector.on(`ignore`, async (i) => {
                i.reply({ content: `I'm sorry but only the user who sent this message may interact with it.`, ephemeral: true })
            })
            buttonCollector.on(`end`, async (collected, reason) => {
                if (reason != `time`) return confirmOrCancel()
                const message = await interaction.fetchReply()
                try {
                    message.edit({ components: [] })
                    role_adding.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                    client.db.redis.del(sessionID)
                    reply.send(`Your time has expired, no worries though just excute the makereward command again to add a package`, { ephemeral: true, followUp: true })
                } catch (error) {
                    client.logger.error(`[makereward.js]\n${error}`)
                }
            })
            buttonCollector.on(`collect`, async i => {
                if (i.customId === `cancel`) {
                    trackingMessageContent[`footer`] = `No roles have been added`
                    updateTrackerMessage()
                    fin_roles = []
                    role_adding.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                    return buttonCollector.stop()
                }
                if (i.customId === `finished`) {
                    return buttonCollector.stop()
                }
                const finializedSelection = []
                const modalId = sessionID + `-` + i.id
                const modal = new ModalBuilder()
                    .setCustomId(modalId)
                    .setTitle(`Role creation`)
                const roleInput = new TextInputBuilder()
                    .setCustomId(`roleInput`)
                    // The label is the prompt the user sees for this input
                    .setLabel(`What is the role's name or id?`)
                    // Short means only a single line of text
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                const firstActionRow = new ActionRowBuilder().addComponents(roleInput)
                modal.addComponents(firstActionRow)

                // reset the timer for the listener so the user has more time
                buttonCollector.resetTimer({ time: 30000 })

                await i.showModal(modal)
                const filter = (interaction) => interaction.customId === modalId
                // Create local vars
                let rawAnswer
                let roleTry = 1
                try {
                    rawAnswer = await interaction.awaitModalSubmit({ filter, time: 30000 })
                } catch (error) {
                    client.logger.error(`Error has been handled\n${error}`)
                }

                // ignore if the modal wasn't submited
                if (!rawAnswer) return
                rawAnswer.deferUpdate()
                const answerRole = rawAnswer.fields.getTextInputValue(`roleInput`).toLowerCase()
                //  Find best match
                let roleID = answerRole
                let has_role = roleOptions.has(answerRole)
                if (!has_role) {
                    for (const [key,value] of roleOptions) {
                        if (value.name.toLowerCase() === answerRole) {
                            has_role = true
                            roleID = key
                            break
                          }
                    }
                }
                if (!has_role) {
                    roleTry++
                    trackingMessageContent[`footer`] = `No role was found, try again please. After the third try it will automatically set to your current roles made or set to zero roles. This is your ${roleTry} attempt.`
                    updateTrackerMessage()
                    if (roleTry > 3) {
                        trackingMessageContent[`items`] = `(${finializedSelection.length}/${roleAmount}) items selected ${formatSelectedItem(items)}`
                        buttonCollector.stop()
                    }
                } else {
                    let role = roleOptions.get(roleID)
                    // Confirm the item and then assign the quantity
                    const roleConfirmationRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`confirm`)
                                .setLabel(`Yes thats it`)
                                .setStyle(ButtonStyle.Success),
                        )
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancel`)
                                .setLabel(`No thats not the role`)
                                .setStyle(ButtonStyle.Danger)
                        )
                    const confirmationItem = await reply.send(`The role i found was: ${role.name}, is this correct`, {
                        followUp: true,
                        components: [roleConfirmationRow]
                    })
                    const itemfilter = iteminteraction => (iteminteraction.customId === `confirm` || iteminteraction.customId === `cancel`) && iteminteraction.user.id === member
                    let roleListener = confirmationItem.createMessageComponentCollector({
                        itemfilter,
                        componentType: ComponentType.Button,
                        time: 60 * 1000
                    })
                    roleListener.on(`collect`, async xyx => {
                        await xyx.deferUpdate()
                        await confirmationItem.delete()
                        let whatButtonWasPressed = xyx.customId
                        if (whatButtonWasPressed === `confirm`) {
                            if (finializedSelection.length === roleAmount) {
                                fin_roles = finializedSelection
                                role_adding.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                                roleListener.stop()
                                return buttonCollector.stop()
                            }
                            finializedSelection.push(role.id)
                            trackingMessageContent[`roles`] = `(${finializedSelection.length}/${roleAmount}) roles selected ${formatSelectedRoles(roleOptions)}`
                            updateTrackerMessage()
                            if (finializedSelection.length === roleAmount) {
                                fin_roles = finializedSelection
                                role_adding.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                                roleListener.stop()
                                return buttonCollector.stop()
                            }
                        } else {
                            trackingMessageContent[`footer`] = `Please Hit the role button to try again`
                            updateTrackerMessage()
                        }
                    })
                    roleListener.on(`ignore`, async (i) => {
                        i.reply({ content: `I'm sorry but only the user who sent this message may interact with it.`, ephemeral: true })
                    })
                    roleListener.on(`end`, async () => {
                        return confirmationItem.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                    })

                }
            })
        }
        /**
         * Allow the user to pick from the available roles the bot has access to then move onto phase two to add items if chosen to or go right to confirming the package.
         */
        async function phaseOne1() {
            // Set up the roles
            const roleOptions = await setRoleOptions(interaction) // get available roles to select from
            const optionArray = formatRoleOptions(roleOptions) // format for selection menu
            let rows = rewardSchema.createSelectMenus(optionArray, 5) // create select menus and return as ActionRowBuilder

            // Send the select menus
            let interactionResponse_message = await reply.send(`Please select a total of ${roleAmount} roles.`, {
                followUp: true,
                components: rows,
                simplified: true
            })

            let buttonCreationOnlyOnce = true
            let roleListener
            let roles = {}
            let finializedSelection = []
            trackingMessageContent[`footer`] = `Please confirm or cancel the role selection\nCancel will set the number of role to 0`
            // Create and start the listener for the select menus
            rewardSchema.createlistener(interaction.member.id, interactionResponse_message)
            rewardSchema.on(async (r) => {
                await r.deferUpdate()
                roles[r.customId] = [...r.values]
                // Combine both arrays into one array for easier checking
                finializedSelection = Object.values(roles).flat()

                trackingMessageContent[`roles`] = `(${finializedSelection.length}/${roleAmount}) roles selected ${formatSelectedRoles(roleOptions)}`
                updateTrackerMessage()
                if (buttonCreationOnlyOnce) {
                    let roleConfirmationRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`confirm`)
                                .setLabel(`Confirm`)
                                .setStyle(ButtonStyle.Success),
                        )
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancel`)
                                .setLabel(`Cancel and set the number of roles to 0`)
                                .setStyle(ButtonStyle.Danger)
                        )
                    await trackingMessage.edit({
                        components: [roleConfirmationRow]
                    })
                    const filter = i => (i.customId === `confirm` || i.customId === `cancel`) && i.user.id === interaction.member.id
                    roleListener = trackingMessage.createMessageComponentCollector({
                        filter,
                        componentType: ComponentType.Button,
                        time: 60 * 1000
                    })
                    roleListener.on(`collect`, async xyx => {
                        await xyx.deferUpdate()
                        let whatButtonWasPressed = xyx.customId
                        if (whatButtonWasPressed === `confirm`) {
                            if (finializedSelection.length > roleAmount) {
                                trackingMessageContent[`roles`] = `(${finializedSelection.length}/${roleAmount}) roles selected, **Please unselect ${finializedSelection.length - roleAmount} as you have selected to many** ${formatSelectedRoles(roleOptions)}`
                                updateTrackerMessage()
                            } else {
                                fin_roles = finializedSelection
                                trackingMessageContent[`roles`] = `(${fin_roles.length}/${roleAmount}) roles selected ${formatSelectedRoles(roleOptions)}`
                                trackingMessageContent[`footer`] = ``
                                roleListener.stop()
                            }
                        } else {
                            fin_roles = []
                            trackingMessageContent[`roles`] = `(${fin_roles.length}/${fin_roles.length}) roles selected ${formatSelectedRoles(roleOptions)}`
                            trackingMessageContent[`footer`] = ``
                            roleListener.stop()
                        }
                    })

                    roleListener.on(`end`, async () => {
                        await trackingMessage.edit({
                            content: Object.values(trackingMessageContent).join(`\n`),
                            components: []
                        })
                        rewardSchema.confirmationEnd()
                        phase++
                        if (endPhase === phase) return phaseTwo()
                        trackingMessageContent[`footer`] = `Please hit the button to confirm the transaction or cancel to stop the transaction`
                        updateTrackerMessage()
                        return confirmOrCancel()
                    })
                    buttonCreationOnlyOnce = false
                }

            })
        }

        /**
         * Allow the user to find an item and then go to confirming the package.
         */
        async function phaseTwo() {
            let itemTry = 1
            let currentItem = undefined
            const itemNames = []
            const availableItems = await client.db.getItem(null, interaction.guild.id)
            // End phase if there are no items available
            if (!availableItems.length) {
                trackingMessageContent[`items`] = `(0/0) items selected, There are no items available to add`
                items = []
                return reply.send(`Sorry you dont have any items for me to give try adding one with /setshop add.`, { followUp: true })
            }
            const buttonCustomId = sessionID + `item`
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(buttonCustomId)
                        .setLabel(`Item`)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`finished`)
                        .setLabel(`Finished`)
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`cancel`)
                        .setLabel(`Cancel`)
                        .setStyle(ButtonStyle.Danger)
                )
            const item_adding = await reply.send(`Time to add any items if you wish.`, { followUp: true, components: row })
            const member = interaction.user.id
            const filter = interaction => (interaction.customId === buttonCustomId || interaction.customId === `cancel` || interaction.customId === `finished`) && interaction.user.id === member
            const buttonCollector = item_adding.createMessageComponentCollector({ filter, time: 30000 })
            buttonCollector.on(`ignore`, async (i) => {
                i.reply({ content: `I'm sorry but only the user who sent this message may interact with it.`, ephemeral: true })
            })
            buttonCollector.on(`end`, async (collected, reason) => {
                if (reason != `time`) return confirmOrCancel()
                const message = await interaction.fetchReply()
                try {
                    message.edit({ components: [] })
                    item_adding.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                    client.db.redis.del(sessionID)
                    reply.send(`Your time has expired, no worries though just excute the makereward command again to add a package`, { ephemeral: true, followUp: true })
                } catch (error) {
                    client.logger.error(`[makereward.js]\n${error}`)
                }
            })
            buttonCollector.on(`collect`, async i => {
                if (i.customId === `cancel`) {
                    i.update({ embeds: [await reply.send(`the makereward creation has been cancelled`, { raw: true })], components: [] })
                    client.db.redis.del(sessionID)
                    return buttonCollector.stop()
                }
                if (i.customId === `finished`) {
                    return buttonCollector.stop()
                }
                const modalId = sessionID + `-` + i.id
                const modal = new ModalBuilder()
                    .setCustomId(modalId)
                    .setTitle(`Item creation`)
                const itemNameInput = new TextInputBuilder()
                    .setCustomId(`itemNameInput`)
                    // The label is the prompt the user sees for this input
                    .setLabel(`What is the item's name?`)
                    // Short means only a single line of text
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                const itemQuantityInput = new TextInputBuilder()
                    .setCustomId(`itemQuantityInput`)
                    // The label is the prompt the user sees for this input
                    .setLabel(`What quantity should be given?`)
                    // Short means only a single line of text
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                const firstActionRow = new ActionRowBuilder().addComponents(itemNameInput)
                modal.addComponents(firstActionRow)
                const secondActionRow = new ActionRowBuilder().addComponents(itemQuantityInput)
                modal.addComponents(secondActionRow)

                // reset the timer for the listener so the user has more time
                buttonCollector.resetTimer({ time: 30000 })

                await i.showModal(modal)
                const filter = (interaction) => interaction.customId === modalId
                let rawAnswer
                try {
                    rawAnswer = await interaction.awaitModalSubmit({ filter, time: 30000 })
                } catch (error) {
                    client.logger.error(`Error has been handled\n${error}`)
                }

                // ignore if the modal wasn't submited
                if (!rawAnswer) return
                rawAnswer.deferUpdate()
                const answerName = rawAnswer.fields.getTextInputValue(`itemNameInput`).toLowerCase()
                const answerQuantity = rawAnswer.fields.getTextInputValue(`itemQuantityInput`).toLowerCase()
                //  Find best match
                const searchStringResult = stringSimilarity.findBestMatch(answerName, availableItems.map(i => i.name.toLowerCase()))
                const item = searchStringResult.bestMatch.rating >= 0.5
                    //  By name
                    ?
                    availableItems.find(i => i.name.toLowerCase() === searchStringResult.bestMatch.target)
                    //  Fallback search by ID
                    :
                    availableItems.find(i => parseInt(i.item_id) === parseInt(answerName))
                if (!item) {
                    itemTry++
                    trackingMessageContent[`footer`] = `No item was found, try again please. After the third try it will automatically set to your current items made or set to zero items. This is your ${itemTry} attempt.`

                    if (itemTry > 3) {
                        trackingMessageContent[`items`] = `(${items.length}/${items.length}) items selected ${formatSelectedItem(items)}`
                        buttonCollector.stop()
                    }
                } else {
                    // Confirm the item and then assign the quantity
                    let itemConfirmationRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`confirm`)
                                .setLabel(`Yes thats it`)
                                .setStyle(ButtonStyle.Success),
                        )
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancel`)
                                .setLabel(`No thats not the item`)
                                .setStyle(ButtonStyle.Danger)
                        )
                    const confirmationItem = await reply.send(`The item i found was: ${item.name}, is this correct`, {
                        followUp: true,
                        components: [itemConfirmationRow]
                    })
                    const itemfilter = iteminteraction => (iteminteraction.customId === `confirm` || iteminteraction.customId === `cancel`) && iteminteraction.user.id === member
                    let itemListener = confirmationItem.createMessageComponentCollector({
                        itemfilter,
                        componentType: ComponentType.Button,
                        time: 60 * 1000
                    })
                    itemListener.on(`collect`, async xyx => {
                        await xyx.deferUpdate()
                        await confirmationItem.delete()
                        let whatButtonWasPressed = xyx.customId
                        if (whatButtonWasPressed === `confirm`) {
                            if (items.length === itemAmount) {
                                return buttonCollector.stop()
                            }
                            currentItem = item
                            let quantity = 1
                            let testQuantity = parseInt(answerQuantity)
                            if (Number.isInteger(testQuantity) && testQuantity > 0) {
                                quantity = testQuantity

                            } else {
                                // Assign the quantity as 1 if the quantity entered wasnt an integer or is a negative integer
                                await reply.send(`I'm sorry the quantity you typed in was not a number I will default the amount to 1`, {
                                    followUp: true,
                                    deleteIn: 5000,
                                    ephemeral: true
                                })
                            }
                            items.push([JSON.stringify(currentItem), quantity])
                            itemNames.push(currentItem.name)
                            trackingMessageContent[`items`] = `(${items.length}/${itemAmount}) items selected ${formatSelectedItem(items)}`
                            updateTrackerMessage()
                            if (items.length === itemAmount) {
                                trackingMessageContent[`footer`] = `Please hit the button to confirm the transaction or cancel to stop the transaction`
                                updateTrackerMessage()
                                await item_adding.delete()
                                return buttonCollector.stop()
                            }
                            trackingMessageContent[`footer`] = `Please Hit the Item button to add another item`
                            updateTrackerMessage()
                            itemListener.stop()
                        } else {
                            trackingMessageContent[`footer`] = `Please Hit the Item button to try again`
                            updateTrackerMessage()
                        }
                    })
                    itemListener.on(`ignore`, async (i) => {
                        i.reply({ content: `I'm sorry but only the user who sent this message may interact with it.`, ephemeral: true })
                    })
                    itemListener.on(`end`, async () => {
                        return confirmationItem.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                    })

                }
            })

        }

        /**
         * Commit the package to the database or ignore database call
         */
        async function confirmOrCancel() {
            let confirmationRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirm`)
                        .setLabel(`Confirm`)
                        .setStyle(ButtonStyle.Success),
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`cancel`)
                        .setLabel(`Cancel`)
                        .setStyle(ButtonStyle.Danger)
                )
            await trackingMessage.edit({
                components: [confirmationRow]
            })
            const filter = i => (i.customId === `confirm` || i.customId === `cancel`) && i.user.id === interaction.member.id
            const confirmOrCancelListener = trackingMessage.createMessageComponentCollector({
                filter,
                componentType: ComponentType.Button,
                time: 60 * 1000
            })
            confirmOrCancelListener.on(`collect`, async xyx => {
                await xyx.deferUpdate()
                let whatButtonWasPressed = xyx.customId
                if (whatButtonWasPressed === `confirm`) {
                    let dataRole = []
                    fin_roles.forEach(element => {
                        dataRole.push({
                            id: JSON.stringify(element)
                        })
                    })
                    let dataItem = []
                    items.forEach(element => {
                        dataItem.push({
                            object: element[0],
                            amount: element[1]
                        })
                    })
                    const data = {
                        acReward: acAmount,
                        roles: dataRole,
                        item: dataItem
                    }
                    const pack = rewardSchema.pack(data) // The package is saved as a string that will be read when getting unpacked and turned back into an object.
                    trackingMessageContent[`footer`] = `Your package has been added, you can view the packages with '/makereward list'`

                    client.db.recordReward(interaction.guild.id, interaction.user.id, pack, packageName)
                    client.db.redis.del(sessionID)
                    confirmOrCancelListener.stop()
                } else {
                    trackingMessageContent[`footer`] = `The package has not been added, please run the command again if you wish to add a package.`
                    confirmOrCancelListener.stop()
                }

            })

            confirmOrCancelListener.on(`end`, async () => {
                return await trackingMessage.edit({
                    content: Object.values(trackingMessageContent).join(`\n`),
                    components: []
                })
            })
        }

        /**
         * Update message as choice are made
         * @returns {void}
         */
        async function updateTrackerMessage() {
            let finalizedTrackingMessageContent = Object.values(trackingMessageContent).join(`\n`)
            return await trackingMessage.edit({
                content: finalizedTrackingMessageContent
            })
        }

        /**
         * 
         * @param {Collection} rawOptions   
         * @return {Array}
         */
        function formatRoleOptions(rawOptions) {
            let output = []
            rawOptions.forEach((value, key, map) => {
                let object = {
                    "label": value.name,
                    "value": key,
                    "description": value.name,
                    "emoji": undefined,
                }
                output.push(object)
            })
            return output
        }

        /**
         * Create a collection of all the available roles the bot has adding accces to
         * @return {Collection}
         */
        async function setRoleOptions() {
            const botsHighestRole = interaction.guild.members.me.roles.highest // Highest role the bot has
            const guild_roles_fetch = await interaction.guild.roles.fetch()
            const guild_roles = Array.from(guild_roles_fetch)
            const roleOptions = new Collection()

            // Retrieve the available roles the bot has access to to prevent permission errors
            for (let i = 0; i < guild_roles.length; i++) {
                let role = guild_roles[i][1]
                let role_id = guild_roles[i][0]
                // Only continue if role in question is lower than the highest role the bot has and role is not the default @everyone
                if (role.comparePositionTo(botsHighestRole) < 0 && role != interaction.guild.members.me.roles.guild.roles.everyone) {
                    // Only continue if the role in question is not an integration role (ie. Not another bot role)
                    if (!role.managed) {
                        roleOptions.set(role_id, role)
                    }
                }
            }
            return roleOptions
        }

        /**
         * Format the items to be read nicely
         * @returns {string}
         */
        function formatSelectedItem() {
            if (items.length < 1) return ``
            let formated = ``
            items.forEach(element => {
                let tempObj = JSON.parse(element[0])
                formated += `\n**Item:** ${tempObj.name} **Quantity:** ${element[1]}`
                tempObj = null
            })
            return formated
        }

        /**
         * Format the items to be read nicely
         * @returns {string}
         */
        function formatSelectedRoles(r) {
            if (fin_roles.length < 1) return ``
            let formated = ``
            fin_roles.forEach(element => {
                let tempObj = r.get(element)
                formated += `\n**Role:** ${tempObj.name}`
                tempObj = null
            })
            return formated
        }

    },
    async listPackages(client, reply, interaction, options, locale) {
        const packages_raw = await client.db.getRewardAmount(interaction.guild.id)
        if (packages_raw.length < 1) return reply.send(`I'm sorry you dont seem to have any packages. try to make one with /makereward create`)
        const packages_collection = new Collection()
        packages_raw.forEach(element => {
            let rewardSchema = new customReward(element.reward_name)
            packages_collection.set(element.reward_name, rewardSchema.unpack(element.reward))
            rewardSchema = null
        })
        const packages = []
        for (const raw_package of packages_collection) {
            packages.push(await formatPackage(raw_package[0], raw_package[1]))
        }

        async function formatPackage(packageName, package) {
            const acReward = package.acReward
            const roles = []
            const items = []
            if (package.roles.length > 0) {
                const rawRoleIds = package.roles.map(a => JSON.parse(a.id))
                for (const roleId of rawRoleIds) {
                    await interaction.guild.roles.fetch(roleId)
                    let rawRole = interaction.guild.roles.cache.get(roleId)
                    let role = `Role: ${rawRole.name}`
                    roles.push(role)
                }
            }
            if (package.item.length > 0) {
                const rawItems = package.item
                for (const i of rawItems) {
                    let item_raw = JSON.parse(i.object)
                    let item = `Item: ${item_raw.name} Quantity: ${i.amount}`
                    items.push(item)
                }
            }

            let formated_acReward = ``
            let formated_roles = ``
            let formated_items = ``

            if (acReward > 0) formated_acReward = `\n**AC:** ${acReward}`
            if (roles.length > 0) formated_roles = `\n**Roles:**\n${roles.join(`\n`)}`
            if (items.length > 0) formated_items = `\n**Items:**\n${items.join(`\n`)}`
            let formated = `**Package: ${packageName}**\n` + formated_acReward + formated_roles + formated_items
            return formated
        }

        return await reply.send(packages, {
            paging: true,
            header: `Custom reward packages for ${interaction.guild.name}`
        })
    },
    async autocomplete(client, interaction){
        /**
         * Fill choices with the available packages found in DB
         */
        if (interaction.options.getSubcommand() !== `delete`) return
        const focusedValue = interaction.options.getFocused()
        const packages_raw = await client.db.getRewardAmount(interaction.guild.id)
        if (packages_raw.length < 1) return await interaction.respond(`I'm sorry you dont have any packages made currently`)
        const packages_collection = new Collection()
        packages_raw.forEach(element => {
            let rewardSchema = new customReward(element.reward_name)
            packages_collection.set(element.reward_name, rewardSchema.unpack(element.reward))
            rewardSchema = null
        })
		const choices = Array.from(packages_collection.keys())
        const filtered = choices.filter(choice => choice.startsWith(focusedValue))
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		)
    },
    async deletePackage(client, reply, interaction, options, locale) {
        const packageName = (options.getString(`package_name`)).toLowerCase()

        let confirmationRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm`)
                    .setLabel(`Confirm`)
                    .setStyle(ButtonStyle.Success),
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`cancel`)
                    .setLabel(`Cancel`)
                    .setStyle(ButtonStyle.Danger)
            )
        let confirmationMessage = await reply.send(`Please confirm the deletion of package: ${packageName}`)
        let confirmationMessageContent = `_ _`
        confirmationMessage.edit({
            components: [confirmationRow]
        })
        const filter = i => (i.customId === `confirm` || i.customId === `cancel`) && i.user.id === interaction.member.id
        const confirmOrCancelListener = confirmationMessage.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 60 * 1000
        })
        confirmOrCancelListener.on(`collect`, async xyx => {
            await xyx.deferUpdate()
            let whatButtonWasPressed = xyx.customId
            if (whatButtonWasPressed === `confirm`) {
                confirmationMessageContent = `Your package has been deleted`
                client.db.deleteReward(interaction.guild.id, packageName)
                confirmOrCancelListener.stop()
            } else {
                confirmationMessageContent = `Your package has not been deleted`
                confirmOrCancelListener.stop()
            }

        })

        confirmOrCancelListener.on(`end`, async () => {
            return await confirmationMessage.edit({
                content: confirmationMessageContent,
                components: [],
                embeds:[]
            })
        })
    }
}