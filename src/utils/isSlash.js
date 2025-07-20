"use strict"
/**
 * Decides if Not a application command <Message> : Is a application command <ChatInputCommandInteraction>
 * @param {Object} instance 
 * @returns 
 */
const isSlash = (instance) => {
    if (instance.hasOwnProperty(`resource`)) {
        return instance.resource.message.applicationId === null || instance.resource.message.applicationId === undefined ? false : true
    } else {
        return instance.applicationId === null || instance.applicationId === undefined ? false : true
    }

}
module.exports = isSlash