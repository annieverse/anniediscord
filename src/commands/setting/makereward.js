"use strict"
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
    PermissionFlagsBits,
    MessageFlags
} = require(`discord.js`)
const { isInteractionCallbackResponse } = require(`../../utils/appCmdHelp`)

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
    server_specific: false,
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
    }],
    type: ApplicationCommandType.ChatInput,
    async Iexecute(client, reply, interaction, options, locale) {
        // Test if the delete sub command was executed
        if (options.getSubcommand() === `delete`) return this.deletePackage(client, reply, interaction, options, locale)

        // Test if the list sub command was executed
        if (options.getSubcommand() === `list`) return this.listPackages(client, reply, interaction, options, locale)

        // Test if any other parameter was entered and if it wasn't exit the commands and let the user know
        if (!options.getInteger(`roles`) && !options.getInteger(`items`) && !options.getInteger(`ac`)) return await reply.send(locale(`MAKEREWARD.OTHER_OPTION`))

        // Create the cooldown for the command so a user cant start two instances of the command
        const sessionID = `REWARD_REGISTER:${interaction.member.id}@${interaction.guild.id}`
        if (await client.db.databaseUtils.doesCacheExist(sessionID)) return await reply.send(locale(`MAKEREWARD.SESSION_STILL_ACTIVE`), { ephemeral: true })
        client.db.databaseUtils.setCache(sessionID, `1`, { EX: 60 * 3 })

        // Set the name for the package
        const packageName = (options.getString(`package_name`)).toLowerCase()

        // Get all currently available packages for the guild to test against, so there are none with duplicate names.
        const packages = await client.db.customRewardUtils.getCustomRewards(interaction.guild.id)
        if (packages.length >= 25) return await reply.send(locale(`MAKEREWARD.MAX_PACKAGES`))

        const packages_collection = new Collection()

        const rewardSchema = new customReward(packageName)
        packages.forEach(element => {
            packages_collection.set(element.reward_name, rewardSchema.unpack(element.reward))
        })
        if (packages_collection.has(packageName)) return await reply.send(locale(`MAKEREWARD.NAME_EXISTS`))

        // Set up varibles to hold the values we want to add to the schema
        let roles = []
        let items = []
        let acAmount = 0

        // Set up varibles to control the flow of input
        let roleAmount = 0
        let itemAmount = 0
        let phase = 0
        let endPhase = 0
        let addingRole = false

        let roleListener = null

        // This varible is to keep track of messages that the user will see
        // Needs to be empty so we can add values only when we want them to show
        let trackingMessageContent = {
            start: `${locale(`MAKEREWARD.TRACK_MSG_START`)} ${packageName}`
        }

        // Set up and send the message that will be updated as choices are made.
        let trackingMessage = await reply.send(trackingMessageContent.start, {
            simplified: true
        })

        // Check if the input for amount of ac was given and if yes set the amount and update the tracking message
        if (options.getInteger(`ac`)) {
            acAmount = options.getInteger(`ac`)
            updateTrackerMessage(`ac`, `${locale(`MAKEREWARD.AC_SET_TO`)} ${acAmount}`)
            // Check that no other options were inputed and send to completion method
            if (!options.getInteger(`roles`) && !options.getInteger(`items`)) return confirmOrCancel()
        }

        // Test if the option for amount of roles was entered otherwise test if the option for amount of items was entered
        if (options.getInteger(`roles`)) {
            roleAmount = options.getInteger(`roles`) // how many roles maximum should there be
            updateTrackerMessage(`roles`, `(0/${roleAmount}) ${locale(`MAKEREWARD.ROLES_SELECTED`)}`)
            if (options.getInteger(`items`)) {
                endPhase = 1
                itemAmount = options.getInteger(`items`)
                updateTrackerMessage(`items`, `(0/${itemAmount}) ${locale(`MAKEREWARD.ITEMS_SELECTED`)}`)
            }
            phaseOne()
        } else if (options.getInteger(`items`)) {
            phase = 1 // Set the starting phase to skip the role method.
            endPhase = 1
            itemAmount = options.getInteger(`items`) // how many items maximum should there be
            updateTrackerMessage(`items`, `(0/${itemAmount}) ${locale(`MAKEREWARD.ITEMS_SELECTED`)}`)
            phaseTwo()
        }

        async function phaseOne() {
            const roleOptions = await setRoleOptions(interaction) // get available roles to select from
            // End phase if there are no roles available
            if (!roleOptions.size || roleOptions.size === 0) {
                roles = []
                updateTrackerMessage(`roles`, locale(`MAKEREWARD.NO_ROLES_MENU`))
                await await reply.send(locale(`MAKEREWARD.NO_ROLES`), { ephemeral: true })
                phase++
                // Test to see if we need to go to item select, if not go to the confirmation method
                if (endPhase === phase) return phaseTwo()
                updateTrackerMessage(`footer`, locale(`MAKEREWARD.TRANSACTION_CANCEL`))
                return confirmOrCancel()
            }

            const roleButtonCustomId = `${sessionID}_role_${interaction.id}`
            const cancelButtonCustomId = `${sessionID}_cancel_${interaction.id}`
            const finishedButtonCustomId = `${sessionID}_finished_${interaction.id}`
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(roleButtonCustomId)
                        .setLabel(`Role`)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(finishedButtonCustomId)
                        .setLabel(`Finished`)
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(cancelButtonCustomId)
                        .setLabel(`Cancel`)
                        .setStyle(ButtonStyle.Danger)
                )
            const role_adding = await reply.send(locale(`MAKEREWARD.ADD_ROLES`), { components: row })
            const member = interaction.user.id
            const filter = interaction => [roleButtonCustomId, cancelButtonCustomId, finishedButtonCustomId].some(id => id === interaction.customId) && interaction.user.id === member
            // const filter = interaction => (interaction.customId === roleButtonCustomId || interaction.customId === cancelButtonCustomId || interaction.customId === finishedButtonCustomId) && interaction.user.id === member
            const buttonCollector = isInteractionCallbackResponse(role_adding) ? role_adding.resource.message.createMessageComponentCollector({ filter, time: 30000 }) : role_adding.createMessageComponentCollector({ filter, time: 30000 })

            // Send a message to the users if they try to use the command when they didn't iniate it
            buttonCollector.on(`ignore`, async (i) => {
                i.reply({ content: locale(`MAKEREWARD.IGNORE`), flags: MessageFlags.Ephemeral })
            })

            // What to do when the collector times out or gets called by .stop()
            buttonCollector.on(`end`, async (collected, reason) => {
                if (reason != `time`) return confirmOrCancel()
                const message = await interaction.fetchReply()
                try {
                    if (roleListener) roleListener.stop(`timeout`)
                    message.edit({ components: [] })
                    role_adding.delete().catch(e => client.logger.warn(`Error has been handled -1.1\n${e}`))
                    client.db.databaseUtils.delCache(sessionID)
                    await reply.send(locale(`MAKEREWARD.TIME_EXPIRED`), { ephemeral: true })
                } catch (error) {
                    client.logger.error(`[makereward.js]\n${error}`)
                }
            })


            buttonCollector.on(`collect`, async i => {
                if (i.customId === cancelButtonCustomId) {
                    updateTrackerMessage(`footer`, locale(`MAKEREWARD.NO_ROLES_ADDED`))
                    roles = []
                    role_adding.delete().catch(e => client.logger.warn(`Error has been handled -2\n${e}`))
                    return buttonCollector.stop()
                }

                if (i.customId === finishedButtonCustomId) {
                    return buttonCollector.stop()
                }

                if (addingRole) return i.reply(locale(`MAKEREWARD.ROLE_ATTEMPT`))

                addingRole = true
                const finializedSelection = []
                const modalId = `${sessionID}_${i.id}_${interaction.member.id}`
                const modal = new ModalBuilder()
                    .setCustomId(modalId)
                    .setTitle(`Role creation`)
                const roleInput = new TextInputBuilder()
                    .setCustomId(`roleInput`)
                    // The label is the prompt the user sees for this input
                    .setLabel(locale(`MAKEREWARD.ROLE_ID_NAME`))
                    // Short means only a single line of text
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                // Have to add to a action row to add component to the modal
                const firstActionRow = new ActionRowBuilder().addComponents(roleInput)
                modal.addComponents(firstActionRow)

                // reset the timer for the listener so the user has more time
                buttonCollector.resetTimer({ time: 30000 })

                await i.showModal(modal)
                const filter = (interaction) => interaction.customId === modalId && interaction.member.id === member

                // Create local vars; these will be updated later with values
                let rawAnswer
                let roleTry = 1
                try {
                    rawAnswer = await interaction.awaitModalSubmit({ filter, time: 30000 })
                } catch (error) {
                    client.logger.error(`Error has been handled -3\n${error}`)
                }

                // ignore if the modal wasn't submited
                if (!rawAnswer) return
                rawAnswer.deferUpdate()

                const answerRole = rawAnswer.fields.getTextInputValue(`roleInput`).toLowerCase()

                //  Find best match
                let roleID = answerRole
                let has_role = roleOptions.has(answerRole)
                if (!has_role) {
                    for (const [key, value] of roleOptions) {
                        if (value.name.toLowerCase() === answerRole) {
                            has_role = true
                            roleID = key
                            break
                        }
                    }
                }
                if (!has_role) {
                    roleTry++
                    updateTrackerMessage(`footer`, `${locale(`MAKEREWARD.NO_ROLES_ATTEMPT_START`)} ${roleTry} ${locale(`MAKEREWARD.NO_ROLES_OR_ITEMS_ATTEMPT_END`)}`)
                    if (roleTry > 3) {
                        updateTrackerMessage(`items`, `(${finializedSelection.length}/${roleAmount}) ${locale(`MAKEREWARD.ITEMS_SELECTED`)} ${formatSelectedItem(items)}`)
                        buttonCollector.stop()
                    }
                } else {
                    // The role has been confirmed and now can continue

                    let role = roleOptions.get(roleID)
                    // Confirm the item and then assign the quantity
                    const roleConfirmationRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`confirm`)
                                .setLabel(locale(`MAKEREWARD.ROLE_OR_ITEM_CONFIRM`))
                                .setStyle(ButtonStyle.Success),
                        )
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancel`)
                                .setLabel(locale(`MAKEREWARD.ROLE_CANCEL`))
                                .setStyle(ButtonStyle.Danger)
                        )
                    const confirmationRole = await reply.send(locale(`MAKEREWARD.ROLE_FOUND`), {
                        socket: { roleName: role.name },
                        components: [roleConfirmationRow]
                    })
                    const rolefilter = roleInteraction => [`confirm`, `cancel`].some(id => id === roleInteraction.customId) && roleInteraction.user.id === member
                    roleListener = isInteractionCallbackResponse(confirmationRole) ? confirmationRole.resource.message.createMessageComponentCollector({
                        rolefilter,
                        componentType: ComponentType.Button,
                        time: 60 * 1000
                    }) : confirmationRole.createMessageComponentCollector({
                        rolefilter,
                        componentType: ComponentType.Button,
                        time: 60 * 1000
                    })

                    roleListener.on(`collect`, async button => {
                        function rolesHitMax() {
                            roles = finializedSelection
                            role_adding.delete().catch(e => client.logger.warn(`Error has been handled -4\n${e}`))
                            roleListener.stop()
                            return buttonCollector.stop()
                        }

                        await button.deferUpdate()
                        await confirmationRole.delete().catch(e => client.logger.warn(`Error has been handled -5\n${e}`))
                        if (button.customId === `confirm`) {
                            if (finializedSelection.length === roleAmount) return rolesHitMax() // Check before to avoid possibly duplicating record
                            finializedSelection.push(role.id)
                            updateTrackerMessage(`roles`, `(${finializedSelection.length}/${roleAmount}) ${locale(`MAKEREWARD.ROLES_SELECTED`)} ${formatSelectedRoles(roleOptions)}`)
                            if (finializedSelection.length === roleAmount) return rolesHitMax() // Check again to end the phase
                        } else {
                            updateTrackerMessage(`footer`, locale(`MAKEREWARD.ROLE_TRY_AGAIN`))
                        }
                    })

                    // Send a message to the users if they try to use the command when they didn't iniate it
                    roleListener.on(`ignore`, async (i) => {
                        i.reply({ content: locale(`MAKEREWARD.IGNORE`), flags: MessageFlags.Ephemeral })
                    })

                    // What to do when the collector for the role confirmation ends.
                    roleListener.on(`end`, async (collected, reason) => {
                        addingRole = false
                        if (reason == `time`) return await confirmationRole.delete().catch(e => client.logger.warn(`Error has been handled -6\n${e}`))
                        if (reason == `timeout`) return await confirmationRole.delete().catch(e => client.logger.warn(`Error has been handled -6\n${e}`))
                        return
                    })

                }
            })
        }

        /**
         * Allow the user to find an item and then go to confirming the package.
         */
        async function phaseTwo() {
            // Setup the local values that will be updated later
            let itemTry = 1

            // Setup the constant values that wont be changed then test to make sure that there are items available and if not, end the phase and move to the confirmation method.
            const itemNames = []
            const availableItems = await client.db.shop.getItem(null, interaction.guild.id)
            // End phase if there are no items available
            if (!availableItems.length) {
                items = []
                updateTrackerMessage(`items`, locale(`MAKEREWARD.NO_ITEMS_MENU`))
                return await reply.send(locale(`MAKEREWARD.NO_ITEMS_AVAIL`), { ephemeral: true })
            }

            // Create the buttons and collector for adding an item
            const itemButtonCustomId = `${sessionID}_item_${interaction.id}`
            const cancelButtonCustomId = `${sessionID}_cancel_${interaction.id}`
            const finishedButtonCustomId = `${sessionID}_finished_${interaction.id}`

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(itemButtonCustomId)
                        .setLabel(`Item`)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(finishedButtonCustomId)
                        .setLabel(`Finished`)
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(cancelButtonCustomId)
                        .setLabel(`Cancel`)
                        .setStyle(ButtonStyle.Danger)
                )
            const item_adding = await reply.send(locale(`MAKEREWARD.ADD_ITEMS`), { components: row })
            const member = interaction.user.id
            const filter = interaction => [itemButtonCustomId, cancelButtonCustomId, finishedButtonCustomId].some(id => id === interaction.customId) && interaction.user.id === member
            const buttonCollector = isInteractionCallbackResponse(item_adding) ? item_adding.resource.message.createMessageComponentCollector({ filter, time: 30000 }) : item_adding.createMessageComponentCollector({ filter, time: 30000 })

            // Send a message to the users if they try to use the command when they didn't iniate it
            buttonCollector.on(`ignore`, async (i) => {
                i.reply({ content: locale(`MAKEREWARD.IGNORE`), flags: MessageFlags.Ephemeral })
            })

            // What to do when the collector for adding an item ends
            buttonCollector.on(`end`, async (collected, reason) => {
                if (reason != `time`) return confirmOrCancel()
                const message = await interaction.fetchReply()
                try {
                    message.edit({ components: [] })
                    item_adding.delete().catch(e => client.logger.warn(`Error has been handled -7\n${e}`))
                    client.db.databaseUtils.delCache(sessionID)
                    await reply.send(locale(`MAKEREWARD.TIME_EXPIRED`), { ephemeral: true })
                } catch (error) {
                    client.logger.error(`[makereward.js]\n${error}`)
                }
            })


            buttonCollector.on(`collect`, async i => {
                if (i.customId === cancelButtonCustomId) {
                    updateTrackerMessage(`footer`, locale(`MAKEREWARD.NO_ITEMS_ADDED`))
                    items = []
                    item_adding.delete().catch(e => client.logger.warn(`Error has been handled -8\n${e}`))
                    return buttonCollector.stop()
                }
                if (i.customId === finishedButtonCustomId) {
                    return buttonCollector.stop()
                }
                const modalId = `${sessionID}_${i.id}_${interaction.member.id}`
                const modal = new ModalBuilder()
                    .setCustomId(modalId)
                    .setTitle(locale(`MAKEREWARD.ITEM_CREATION_TITLE`))
                const itemNameInput = new TextInputBuilder()
                    .setCustomId(`itemNameInput`)
                    // The label is the prompt the user sees for this input
                    .setLabel(locale(`MAKEREWARD.ITEM_NAME`))
                    // Short means only a single line of text
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                const itemQuantityInput = new TextInputBuilder()
                    .setCustomId(`itemQuantityInput`)
                    // The label is the prompt the user sees for this input
                    .setLabel(locale(`MAKEREWARD.ITEM_QUANTITY`))
                    // Short means only a single line of text
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                // Add to action rows before adding to modal
                const firstActionRow = new ActionRowBuilder().addComponents(itemNameInput)
                modal.addComponents(firstActionRow)
                const secondActionRow = new ActionRowBuilder().addComponents(itemQuantityInput)
                modal.addComponents(secondActionRow)

                // reset the timer for the listener so the user has more time
                buttonCollector.resetTimer({ time: 30000 })

                await i.showModal(modal)
                const filter = (interaction) => interaction.customId === modalId && interaction.member.id === member
                let rawAnswer
                try {
                    rawAnswer = await interaction.awaitModalSubmit({ filter, time: 30000 })
                } catch (error) {
                    client.logger.error(`Error has been handled -9\n${error}`)
                }

                // ignore if the modal wasn't submited
                if (!rawAnswer) return
                rawAnswer.deferUpdate()

                // Grab the user inputs from the modal once submited.
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
                    updateTrackerMessage(`footer`, `${locale(`MAKEREWARD.NO_ITEMS_ATTEMPT_START`)} ${itemTry} ${locale(`MAKEREWARD.NO_ROLES_OR_ITEMS_ATTEMPT_END`)}`)

                    if (itemTry > 3) {
                        updateTrackerMessage(`items`, `(${items.length}/${items.length}) ${locale(`MAKEREWARD.ITEMS_SELECTED`)} ${formatSelectedItem(items)}`)
                        buttonCollector.stop()
                    }
                } else {
                    // Confirm the item and then assign the quantity
                    const itemConfirmationRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`confirm`)
                                .setLabel(locale(`MAKEREWARD.ROLE_OR_ITEM_CONFIRM`))
                                .setStyle(ButtonStyle.Success),
                        )
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancel`)
                                .setLabel(locale(`MAKEREWARD.ITEM_CANCEL`))
                                .setStyle(ButtonStyle.Danger)
                        )
                    const confirmationItem = await reply.send(locale(`MAKEREWARD.ITEM_FOUND`), {
                        socket: { itemName: item.name },
                        components: [itemConfirmationRow]
                    })
                    const itemfilter = iteminteraction => [`confirm`, `cancel`].some(id => id === iteminteraction.customId) && iteminteraction.user.id === member
                    const itemListener = isInteractionCallbackResponse(confirmationItem) ? confirmationItem.resource.message.createMessageComponentCollector({
                        itemfilter,
                        componentType: ComponentType.Button,
                        time: 60 * 1000
                    }) : confirmationItem.createMessageComponentCollector({
                        itemfilter,
                        componentType: ComponentType.Button,
                        time: 60 * 1000
                    })

                    itemListener.on(`collect`, async button => {
                        function itemsHitMax() {
                            updateTrackerMessage(`footer`, locale(`MAKEREWARD.TRANSACTION_CANCEL`))
                            item_adding.delete().catch(e => client.logger.warn(`Error has been handled -10\n${e}`))
                            itemListener.stop()
                            return buttonCollector.stop()
                        }
                        await button.deferUpdate()
                        await confirmationItem.delete().catch(e => client.logger.warn(`Error has been handled -11\n${e}`))

                        if (button.customId === `confirm`) {
                            if (items.length === itemAmount) return itemsHitMax() // Check before to avoid possibly duplicating record
                            let quantity = 1
                            let testQuantity = parseInt(answerQuantity)
                            // Test to make sure the quantity is a number and if yes set to that value, if not set to 1.
                            if (Number.isInteger(testQuantity) && testQuantity > 0) {
                                quantity = testQuantity
                            } else {
                                // Assign the quantity as 1 if the quantity entered wasnt an integer or is a negative integer
                                await reply.send(locale(`MAKEREWARD.NAN_QUANTITY`), {
                                    deleteIn: 5000,
                                    ephemeral: true
                                })
                            }

                            items.push([JSON.stringify(item), quantity])
                            itemNames.push(item.name)
                            updateTrackerMessage(`items`, `(${items.length}/${itemAmount}) ${locale(`MAKEREWARD.ITEMS_SELECTED`)} ${formatSelectedItem(items)}`)
                            if (items.length === itemAmount) return itemsHitMax() // Check again to end the phase 
                            updateTrackerMessage(`footer`, locale(`MAKEREWARD.ITEM_ADD_ANOTHER`))
                            itemListener.stop()
                        } else {
                            updateTrackerMessage(`footer`, locale(`MAKEREWARD.ITEM_ADD_TRY`))
                        }
                    })

                    // Send a message to the users if they try to use the command when they didn't iniate it
                    itemListener.on(`ignore`, async (i) => {
                        i.reply({ content: locale(`MAKEREWARD.IGNORE`), flags: MessageFlags.Ephemeral })
                    })

                    // What to do when the item collector ends
                    itemListener.on(`end`, async () => {
                        return confirmationItem.delete().catch(e => client.logger.warn(`Error has been handled -12\n${e}`))
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
            await trackingMessage.resource.message.edit({
                components: [confirmationRow]
            })
            const filter = i => [`confirm`, `cancel`].some(id => id === i.customId) && i.user.id === interaction.member.id
            const confirmOrCancelListener = isInteractionCallbackResponse(trackingMessage) ? trackingMessage.resource.message.createMessageComponentCollector({
                filter,
                componentType: ComponentType.Button,
                time: 60 * 1000
            }) : trackingMessage.createMessageComponentCollector({
                filter,
                componentType: ComponentType.Button,
                time: 60 * 1000
            })

            confirmOrCancelListener.on(`collect`, async button => {
                await button.deferUpdate()
                if (button.customId === `confirm`) {
                    let dataRole = []
                    roles.forEach(element => {
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
                    updateTrackerMessage(`footer`, locale(`MAKEREWARD.SUCCESSFUL`))
                    client.db.customRewardUtils.recordReward(interaction.guild.id, interaction.user.id, pack, packageName)
                    confirmOrCancelListener.stop()
                } else {
                    updateTrackerMessage(`footer`, locale(`MAKEREWARD.SUBMIT_CANCEL`))
                    confirmOrCancelListener.stop()
                }

            })

            confirmOrCancelListener.on(`end`, async () => {
                client.db.databaseUtils.delCache(sessionID)
                return await trackingMessage.resource.message.edit({
                    components: []
                })
            })
        }

        /**
         * Update message as choice are made
         * @returns {void}
         */
        async function updateTrackerMessage(section, content) {
            if (!section) return new TypeError(`Parameter 'section' is missing in function 'updateTrackerMessage' in makereward.js`)
            if (!content) return new TypeError(`Parameter 'content' is missing in function 'updateTrackerMessage' in makereward.js`)
            trackingMessageContent[section] = content
            let finalizedTrackingMessageContent = Object.values(trackingMessageContent).join(`\n`)
            return await trackingMessage.resource.message.edit({
                content: finalizedTrackingMessageContent
            })
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
            if (roles.length < 1) return ``
            let formated = ``
            roles.forEach(element => {
                let tempObj = r.get(element)
                formated += `\n**Role:** ${tempObj.name}`
                tempObj = null
            })
            return formated
        }

    },
    async listPackages(client, reply, interaction, options, locale) {
        const packages_raw = await client.db.customRewardUtils.getCustomRewards(interaction.guild.id)
        if (packages_raw.length < 1) return await reply.send(locale(`MAKEREWARD.NO_PACKAGES`))
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

        async function formatPackage(packageName, pack) {
            const acReward = pack.acReward
            const roles = []
            const items = []
            if (pack.roles.length > 0) {
                const rawRoleIds = pack.roles.map(a => JSON.parse(a.id))
                for (const roleId of rawRoleIds) {
                    await interaction.guild.roles.fetch(roleId)
                    let rawRole = interaction.guild.roles.cache.get(roleId)
                    let role = `Role: ${rawRole.name}`
                    roles.push(role)
                }
            }
            if (pack.item.length > 0) {
                const rawItems = pack.item
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
            header: `${locale(`MAKEREWARD.LIST_PKG_HEADER`)} ${interaction.guild.name}`
        })
    },
    async autocomplete(client, interaction) {
        /**
         * Fill choices with the available packages found in DB
         */
        if (interaction.options.getSubcommand() !== `delete`) return
        const focusedValue = interaction.options.getFocused()
        const packages_raw = await client.db.customRewardUtils.getCustomRewards(interaction.guild.id)
        if (packages_raw.length < 1) return await interaction.respond([{ name: `No Packages Available`, value: `none` }])
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

        if (packageName === `none`) return await reply.send(locale(`MAKEREWARD.NO_PACKAGES`), { ephemeral: true })

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
        let confirmationMessage = await reply.send(locale(`MAKEREWARD.DELETE_CONFIRM`), { socket: { packageName: packageName } })
        confirmationMessage = isInteractionCallbackResponse(confirmationMessage) ? confirmationMessage.resource.message : confirmationMessage
        let confirmationMessageContent = `_ _`
        confirmationMessage.edit({
            components: [confirmationRow]
        })
        const filter = i => (i.customId === `confirm` || i.customId === `cancel`) && i.user.id === interaction.member.id
        const confirmOrCancelListener = isInteractionCallbackResponse(confirmationMessage) ? confirmationMessage.resource.message.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 60 * 1000
        }) : confirmationMessage.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 60 * 1000
        })
        confirmOrCancelListener.on(`collect`, async xyx => {
            await xyx.deferUpdate()
            let whatButtonWasPressed = xyx.customId
            if (whatButtonWasPressed === `confirm`) {
                confirmationMessageContent = locale(`MAKEREWARD.DELETE_SUCCESS`)
                client.db.customRewardUtils.deleteReward(interaction.guild.id, packageName)
                confirmOrCancelListener.stop()
            } else {
                confirmationMessageContent = locale(`MAKEREWARD.DELETE_FAIL`)
                confirmOrCancelListener.stop()
            }

        })

        confirmOrCancelListener.on(`end`, async () => {
            return await confirmationMessage.edit({
                content: confirmationMessageContent,
                components: [],
                embeds: []
            })
        })
    }
}