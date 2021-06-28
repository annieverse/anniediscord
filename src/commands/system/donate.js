/*
* Command's Class description
* @author Pan
*/
module.exports = {
/**
* Define the file name (without the extension!)
* @type {string}
*/
name: `donate`,
/**
* Define accepted aliases. User will be able to call the command with these alternative names.
* @type {object}
*/
aliases: [],
/**
* Make a short, clear and concise command's description
* @type {string}
*/
description: `Provides link to our donate link if you wish to support us further`,
/**
* Define how to use the command. Include optional arguments/flags if needed
* @type {string}
*/
usage: `donate`,
/**
* Define the minimum permission level to use the command. Refer to ./src/config/permissions.js for more info
* @type {number}
*/
permissionLevel: 0,
/**
* The executed function upon command invocation.
* The standard provided prarameters are writen in sequence below
* [client, reply, message, arg, locale]
* @type {function}
*/
async execute(client, reply, message, arg, locale) {
    // ... Your command ran here.
    reply.send(locale.DONATE)
}

}