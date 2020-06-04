# ModMail Plugin

## What is this?
---
This plugin is a very useful and simple function for a bot to use on any server. It aids your moderators and helps deter those random Moderator/Admin pings in your general text chats.

This function works in a couple of ways:
> Definitions

- Moderator = Anyone that has access to the channel acts as a moderator. So the server just has to allow the correct roles to access the channel, which adopts the perms from the category.
- Thread = the current conversation, session from starting to end. Indicated by the first message starting it and the command `close` to end it.

> The process: <br> When a user direct messages (dm) the bot, the bot will then make a new channel on the server or a specified server. From there, any message entered from that channel is sent to the user's dm. Which acts as the moderator talking through the bot to the user. </br>

---
## How are the conversations stored and can they be accessed again?
---

The conversations are stored in an SQLite database and can be seen again using the corresponding command.

Images are saved on the bot's hosts server but have a limit on how many can be saved at once. If storage gets filled you can delete the files you don't need to free up some space. If you think this won't be a problem for you, perfect. If you think this will be a problem you can turn this function off and images won't be saved to the file system. For that path, in order to save the image, you will need to repost the given images to a channel and then post a link to the message so your link is recorded and you can click on it when you go back to relook at the conversation.

---
## How to install into your bot
---

Make sure to have a command handler that can handle folders. 

Make a folder called ModMail in your commands folder. Inside of this folder will contain all of our files needed for making a functional ModMail system.

In addition to this folder with the files, I will give you, you will need to either make or add some code to a couple of other files.

> files


- Check the files attached

---
## Custom config settings
---
- guildId <required>
- category <required>
- mentionRole <optional> The role Id, if none supplied, @here will be used
- repsonseMessage <optional> if nothing supplied, this will be used: Thank you for your message! Our mod team will reply to you here as soon as possible.

---
## Commands that can be used anywhere
---
- modlogs
- showlog
- block
- unblock
- is_blocked
- delete
---
### Commands that can be only used inside of a thread
---
- close
- anon

---
### What Each command does
---
> modlogs

When used, you can see how many logs each user has.

Usage: 
when in thread = modlogs
when not in thread = modlogs \<user> 

> showlog

When used, you can see the conversation that took place in an old thread

Usage: showlog \<log id>

> block

When used, can block a user from sending messages to the bot

Usage: 
when in thread = block
when not in thread = block \<user>


> unblock

When used, can unblock a user and let the user send messages to the bot again

Usage: 
when in thread = unblock
when not in thread = unblock \<user>


> is_blocked

When used, you can see if a user is blocked

Usage: isblocked \<user>


> close

When used, the thread will end and the conversation will be recorded

Usage: close


> anon

When used, this will toggle the thread to be anonymous which means mods will not know who is talking

Usage: anon \<message>


> delete

When used, the selected thread will be deleted from the records

Usage: delete \<ThreadId>