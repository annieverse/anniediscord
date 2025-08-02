"use strict"
const { CommandInteraction, InteractionCallbackResponse } = require(`discord.js`)

/**
 * Decides if InteractionCallbackResponse
 * @param {Object} instance 
 * @link https://discord.com/developers/docs/resources/channel#message-object-message-types
 * @link https://discord.js.org/docs/packages/discord.js/14.21.0/InteractionCallbackResponse:Class
 * @link https://discord.js.org/docs/packages/discord.js/14.21.0/Message:Class
 * @returns 
 */
const isInteractionCallbackResponse = (instance) => {
    return instance instanceof InteractionCallbackResponse
}

/**
 * Not a application command <Message> : Is a application command <ChatInputCommandInteraction>
 * @param {Object} instance 
 * @link https://discord.com/developers/docs/resources/channel#message-object-message-types
 * @link https://discord.js.org/docs/packages/discord.js/14.21.0/InteractionCallbackResponse:Class
 * @link https://discord.js.org/docs/packages/discord.js/14.21.0/Message:Class
 */
const isSlash = (instance) => {
    return instance instanceof CommandInteraction
}
module.exports = { isInteractionCallbackResponse, isSlash }