const customReward = require(`../../libs/customRewards`)
const stringSimilarity = require(`string-similarity`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    Collection,
    ActionRowBuilder,
    ComponentType,
    ButtonBuilder,
    ButtonStyle
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
            required: true
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
        if (!options.getInteger(`roles`) && !options.getInteger(`items`) && !options.getInteger(`ac`)) return reply.send(`Sorry must pick one of the other options`)

        // Set up the schema userd to store the data
        const packageName = (options.getString(`package_name`)).toLowerCase()

        /**
         * TODO
         * Check if package name exists already
         */


        let rewardSchema = new customReward(packageName)
        rewardSchema.setup()

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
        // const sessionId = `REWARD_REGISTER:${interaction.guild.id}@${interaction.member.id}`
        // if (await client.db.redis.exists(sessionId)) return reply.send(`create_SESSION_STILL_ACTIVE`)
        // client.db.redis.set(sessionId, 1, `EX`, 60 * 3)


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

        async function phaseTwo() {
            let itemPriceToggle = true
            let amounttry = 1
            let itemTry = 1
            let currentItem = undefined
            let wasItemConfirmed = false
            let manualEndOrAutomatic = false
            const itemNames = []
            const availableItems = await client.db.getItem(null, interaction.guild.id)

            if (!availableItems.length) {
                trackingMessageContent[`items`] = `(0/0) items selected, There are no items available to add`
                items = []
                return pool.stop()
            }
            trackingMessageContent[`footer`] = `Type cancel if you would like to stop making a package | Type done if you wish to stop the amount of items at however many you made so far.`
            trackingMessageContent[`footer`] = `Please Type the name or id of the item you wish to add`
            updateTrackerMessage()

            const pool = interaction.channel.createMessageCollector({
                filter: m => m.author.id === interaction.member.id,
                time: 60000 * 3
            }) // 3 minutes timeout

            pool.on(`collect`, async m => {
                let input = m.content.toLowerCase()
                await m.delete()
                if (input === `done`) {
                    trackingMessageContent[`items`] = `(${items.length}/${itemAmount}) items selected ${formatSelectedItem(items)}`
                    return pool.stop()
                } else if (input === `cancel`) {
                    manualEndOrAutomatic = true
                    trackingMessageContent[`items`] = `(0/0) items selected`
                    items = []
                    return pool.stop()
                } else if (items.length < itemAmount) {
                    if (itemPriceToggle) {
                        //  Find best match
                        const searchStringResult = stringSimilarity.findBestMatch(input, availableItems.map(i => i.name.toLowerCase()))
                        const item = searchStringResult.bestMatch.rating >= 0.5
                            //  By name
                            ?
                            availableItems.find(i => i.name.toLowerCase() === searchStringResult.bestMatch.target)
                            //  Fallback search by ID
                            :
                            availableItems.find(i => parseInt(i.item_id) === parseInt(input))
                        if (!item || itemNames.includes(item.name)) {
                            itemTry++
                            trackingMessageContent[`footer`] = `No item was found, try again please. After the third try it will automatically set to your current items made or set to zero items. This is your ${itemTry} attempt.`

                            if (itemTry > 3) {
                                trackingMessageContent[`items`] = `(${items.length}/${items.length}) items selected ${formatSelectedItem(items)}`
                                pool.stop()
                            }
                            updateTrackerMessage()
                        } else {

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
                            itemPriceToggle = false
                            const filter = i => (i.customId === `confirm` || i.customId === `cancel`) && i.user.id === interaction.member.id
                            let itemListener = confirmationItem.createMessageComponentCollector({
                                filter,
                                componentType: ComponentType.Button,
                                time: 60 * 1000
                            })
                            itemListener.on(`collect`, async xyx => {
                                await xyx.deferUpdate()
                                let whatButtonWasPressed = xyx.customId
                                if (whatButtonWasPressed === `confirm`) {
                                    currentItem = item
                                    trackingMessageContent[`footer`] = `Please Type the quantity of the item`
                                    itemListener.stop()
                                    wasItemConfirmed = true
                                    updateTrackerMessage()
                                } else {
                                    itemPriceToggle = true
                                    trackingMessageContent[`footer`] = `Please Try a different name for the item`
                                    updateTrackerMessage()
                                    itemListener.stop()
                                }
                            })

                            itemListener.on(`end`, async () => {
                                return await confirmationItem.delete()
                            })
                        }
                    } else if (wasItemConfirmed){
                        let quantity = 1
                        let testQuantity = parseInt(input)
                        if (Number.isInteger(testQuantity) && testQuantity > 0) {
                            quantity = testQuantity
                            itemPriceToggle = true
                            items.push([JSON.stringify(currentItem), quantity])
                            itemNames.push(currentItem.name)
                            trackingMessageContent[`items`] = `(${items.length}/${itemAmount}) items selected ${formatSelectedItem(items)}`
                            trackingMessageContent[`footer`] = `Please Type the name or id of the item you wish to add`
                            if (items.length === itemAmount) pool.stop()
                            updateTrackerMessage()
                        } else {
                            if (amounttry === 0) await reply.send(`I'm sorry that was not a number please try again, After the third try it will default to 1`, {
                                followUp: true,
                                deleteIn: 5000
                            })
                            amounttry++
                            trackingMessageContent[`footer`] = `This is your ${amounttry} attempt for setting the quantity`
                            if (amounttry >= 3) {
                                itemPriceToggle = true
                                items.push([JSON.stringify(currentItem), 1])
                                itemNames.push(currentItem.name)
                                trackingMessageContent[`items`] = `(${items.length}/${itemAmount}) items selected ${formatSelectedItem(items)}`
                                trackingMessageContent[`footer`] = itemPriceToggle ? `Please Type the quantity of the item` : `Please Type the name or id of the item you wish to add`
                            }
                            updateTrackerMessage()
                        }
                    }
                }
            })
            pool.on(`end`, () => {
                
            manualEndOrAutomatic ? trackingMessageContent[`footer`] = `The transaction has been cancelled` : trackingMessageContent[`footer`] = `Please hit the button to confirm the transaction or cancel to stop the transaction`
                updateTrackerMessage()
                return !manualEndOrAutomatic ? confirmOrCancel() : null
            })
        }

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
                    let buffer = rewardSchema.pack(data)
                    trackingMessageContent[`footer`] = `Your package has been added, you can view the packages with '/makereward list'`

                    /**
                     * TODO
                     * Add DB call
                     */

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
         * @returns {Promise}
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
        /**
         * TODO
         * DB call for all available packages
         */

        /**
         * TODO
         * Unpack the packages
         */

        async function formatPackage(packageName, package) {
                let acReward = package.acAmount
                const items = []
                package.item.forEach(element=>{
                    let rawItem = JSON.parse(element.object)
                    let item = `Item: ${rawItem.name} Quantity: ${element.amount}`
                    items.push(item)
                })
                const roles = []
                package.roles.forEach(async element=>{
                    let rawRole = await interaction.guild.roles.fetch(element.id)
                    let role = `Role: ${rawRole.name}`
                    roles.push(role)
                })
                
                let formated = `Package: ${packageName}\nAC: ${acReward}\nRoles:\n${roles.join(`\n`)}Items:\n${items.join(`\n`)}`
                return formated
        }
        
        //await reply.send(packages,{paging:true})
        interaction.reply(`Not yet implemented.`)
    },
    async deletePackage(client, reply, interaction, options, locale) {
        const packageName = (options.getString(`package_name`)).toLowerCase()

        /**
         * TODO
         * Check if a package exists
         */

        /**
         * TODO
         * DB call to remove
         */

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
                confirmOrCancelListener.stop()
            } else {
                confirmationMessageContent = `Your package has not been deleted`
                confirmOrCancelListener.stop()
            }

        })

        confirmOrCancelListener.on(`end`, async () => {
            return await confirmationMessage.edit({
                content: confirmationMessageContent,
                components: []
            })
        })
    }
}