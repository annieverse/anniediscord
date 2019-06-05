module.exports = (bot, oldUser, newUser) => {

  function getRoles(r) {
      return bot.guilds.get('459891664182312980').roles.find(n => n.name === r)
  }
  
  let ticket = getRoles('Nickname Changer');
  if( newUser.roles.has(ticket.id) && (oldUser.nickname !== newUser.nickname) ) {
    console.log(`${newUser.nickname} used the nickname changer ticket.`)
    newUser.removeRole(ticket);
  }
}