/* eslint-disable no-prototype-builtins */
"use strict"
/**
 * Decides if InteractionCallbackResponse
 * @param {Object} instance 
 * @link https://discord.com/developers/docs/resources/channel#message-object-message-types
 * @link https://discord.js.org/docs/packages/discord.js/14.21.0/InteractionCallbackResponse:Class
 * @link https://discord.js.org/docs/packages/discord.js/14.21.0/Message:Class
 * @returns 
 */
const isInteractionCallbackResponse = (instance) => {
    return instance.hasOwnProperty(`resource`)
}

/**
 * Not a application command <Message> : Is a application command <ChatInputCommandInteraction>
 * @param {Object} instance 
 * @link https://discord.com/developers/docs/resources/channel#message-object-message-types
 * @link https://discord.js.org/docs/packages/discord.js/14.21.0/InteractionCallbackResponse:Class
 * @link https://discord.js.org/docs/packages/discord.js/14.21.0/Message:Class
 */
const isSlash = (instance) => {
    return instance.applicationId === null || instance.applicationId === undefined ? false : true // 
}
module.exports = { isInteractionCallbackResponse, isSlash }