let config = {}

config.user = {
    level: 1,
    description: `Regular user.`,
    permissionString: `SEND_MESSAGE`,
    unrestricted: true
}

config.moderator = {
    level: 2,
    description: `Regular user with additonal special access.`,
    permissionString: `MANAGE_MESSAGE`
}

config.administrator = {
    level: 3,
    description: `The highest server privilege in the current server`,
    permissionString: `ADMINISTRATOR`
}

config.developer = {
    level: 4,
    description: `The highest system privilege above everything.`,
    accounts: [`230034968515051520`, `277266191540551680`],
    permissionString: `ADMINISTRATOR`
}

module.exports = config