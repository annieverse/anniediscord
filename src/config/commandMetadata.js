/**
 * Below is the required properties for each created commands.
 * If any one of these are missing from the command's properties, they will be ejected from commands pool.
 */
module.exports = [
    //  The commandd name/master name
    `name`,
    //  Aliases/alternative names to invoke the command
    `aliases`,
    //  The descriptive details about what the command does
    `description`,
    //  The templat on how to use the command
    `usage`,
    //  The required permission level. Refer to ./src/libs/permissions for further details
    `permissionLevel`,
]