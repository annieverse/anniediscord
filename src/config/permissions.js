module.exports = {
    user: {
        level: 1,
        description: `Regular user.`,
        permissionString: `SEND_MESSAGE`,
    },
    beta: {
        level: 2,
        description: `Regular user with given access to unreleased feature.`,
        permissionString: `SEND_MESSAGE`,
    },
    moderator: {
        level: 3,
        description: `Server staff with minimal access to admin privileges.`,
        permissionString: `MANAGE_MESSAGE`
    },
    administrator: {
        level: 4,
        description: `The highest privileges in a server.`,
        permissionString: `ADMINISTRATOR`
    },
    developer: {
        level: 5,
        description: `Super user.`,
        accounts: [`230034968515051520`, `277266191540551680`],
        permissionString: `ADMINISTRATOR`
    }
}