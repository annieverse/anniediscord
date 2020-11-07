# Change Logs

___

## **11/07/20 | 7.6.1 ->**

* b5240fa refactor(quest): increase listen limit and added cancel option.

## **11/06/20 | 7.6.0 ->**

* 0543774 feat(artquest): beta
* 4c8d049 refactor(setrel): clear define prefix
* 874af83 refactor(serverInfo): removes presence tracker
* 6fc763d refactor(cardCollection): hide preview for cards under 10 elements in single page
* 0e7f569 refactor: simplified commandpedia to improve ux
* e7c16bb fix(level): fail ref
* d9a8d72 fix(profile): fail ref

## **11/03/20 | 7.5.1 ->**

* 127e6ce fix: userKeyword dependant on some commands
* 4ca29b5 refactor(commandLib): added rawArgs property to keep the userKeyword present

## **11/01/20 | 7.5.0 ->**

* 685adfe feat(faceGenerate): ai-generated character face provided by TWDNE
* 56bfe2c feat(affiliates): affiliates manager
* 408c846 refactor: attach affiliate link on some commands
* 7c639ff refactor(commandLib): ommits tokenized userKeywords from fullArgs set
* cbf21f6 refactor(pay): adapt args with the new user structure
* cfccfb7 refactor(userSearch): changed algorithm to fit with limited member gateway
* ccb8461 refactor(cartcoin): replace flow to button based

## **10/29/20 | 7.4.8 ->**

* 580333a chores: deprecate unused settings
* e58ec4a refactor: adds notice on setting commands
* 0f240ee fix(exp): user cache
* bdebda5 fix(stats): user fetch
* 8485958 fix(leaderboard): cache users

## **10/23/20 | 7.4.7 ->**

308ea78 refactor(command): improved cd register
56e4981 refactor(pay): shared ui, reduced tax and lvl requirement
1d89d58 refactor(commands): added invisible property and fixes to some command usage string
5477f7e refactor(stats): display general annie status for non-developer
1f9fbfa refactor(welcomer): invert theme

## **10/22/20 | 7.4.6 ->**

* e92ede8 fix(balance): display zero qty for null account
* 3076f9a refactor(cardsCollection): added card quantity and paging on every ten cards split

## **10/20/20 | 7.4.5 ->**

* e7d7a73 assets: upscale new cards
* 279d766 build(pixiv): use forked package

## **10/17/20 | 7.4.4 ->**

* 919ae2f fix(pixiv): added user-agent on auth

## **10/08/20 | 7.4.3 ->**

* df22526 fix(event): fail to trigger guildDelete
* d2f2add refactor(leaderboard): ommits non-existant member from top ten result set
* b926133 refactor(avatar): upscale displayed user avatar

## **10/05/20 | 7.4.2 ->**

* 7191353 fix(welcomer): fail to fill guild socket
* 44691af fix(setCover): apply effect to current guild instance

## **10/05/20 | 7.4.1 ->**

* 0ce8c49 fix(exp): rank doesnt get assigned on levelup

## **10/04/20 | 7.4.0 ->**

* 343ddfe feat(command): display message when perm being handled
* 9b73db4 feat(sellFragment): a command to sell user fragments
* cbdc6fc feat(setExp): command that allows you to enable or disable the exp leveling system
* 95aba94 feat(setLogs): configure logs module
* cd0f376 chores: removed modmail feature
* a0696b9 refactor(events): testable event simulations
* 3f635d9 refactor(setlvlupmsg): adapts new configurations
* 605c0c0 refactor(events): update refs
* df57aee refactor(logSystem): adapts with new guild configurations
* 357ecca refactor(setRank): adapts with new configuration structure
* b0105b8 refactor(setWelcomer): adapts with new configuration structure
* 437aa8f refactor(logs): reorganized flow
* 7616712 refactor(events): adapt new config structure
* 3d7d323 refactor(userLib): extended rank handler
* 71d8408 refactor(messageController): removed modmail flow
* 7c90a8a refactor: resolving conflicts (#318)
* f5ba4c0 refactor(configs): rewrite config identifier

## **09/25/20 | 7.3.2 ->**

* 1d60074 fix(raw): wrong refs
* 7d7c5f2 fix(systemLogs): failed to initialize file
* 719d916 fix(buy): wrong amount calculation when finding item by its id
* 4ff2ba6 fix(gacha): fail to deduct user's balance on ticket purchase
* 38b25af fix(localization): improvised string in vote command
* 6df0f6b refactor(vote): only run in production environment

## **09/24/20 | 7.3.1 ->**

* fix(votes): duplicated events

## **09/23/20 | 7.3.0 ->**

* feat(vote): added vote command with reward

## **09/21/20 | 7.2.5 ->**

* refactor(help): more informative commmandpedia
* fix(commands): skip keyword replacement on command without multiUser property enabled

## **09/18/20 | 7.2.4 ->**

* fix(database): allow direct daily and rep claim for new user
* fix(command): improved naming in .addConfirmationButton()
* refactor(Modmail) Working state
* refactor(config): standardize configurations list
* refactor(command): added .addConfirmButton()
* refactor(command): trimmed used keyword from userLookup for clean arg pool
* build(deps): [security] bump bl from 4.0.2 to 4.0.3

## **09/08/20 | 7.2.3 ->**

* fix(userLookup): differentiate number-typed on second parameter

## **09/08/20 | 7.2.2 ->**

* refactor(userLookup): double filtering on ID searchstring
* fix(userLookup): removed used keyword in the arg

## **09/08/20 | 7.2.1 ->**

* refactor(setRelationship): refreshed homepage
* refactor(pay): improved UX
* refactor(userLookup): improved searchstring algoritm
* refactor(ui): upscale lvlup message
* fix(leaderboard): footer with author having zero points

## **09/06/20 | 7.2.0 ->**

* feat(setCover): quick setting to manage user profile cover
* refactor(ui): lvlup message upscaled resolution
* refactor(setProfile): drop supports for cover action
* refactor(buy): update db methods for cover quick-apply action

## **09/04/20 | 7.1.3 ->**

* fix(ui): lvlup message Y pos

## **09/04/20 | 7.1.2 ->**

* fix(welcomer): rounded module value
* fix(lvlUpMessage): rounded module value
* fix(leaderboard): unable to display user with zero point

## **09/04/20 | 7.1.1 ->**

* refactor(ui): leaderboard components readjusted
* refactor(leaderboard): improved homepage's layout
* refactor(leaderboard): added bal alias for artcoins rank
* fix(leaderboard): fetchable art ranks
* fix(exp): missing ref in getMinimalUserMetadata()

## **09/04/20 | 7.1.0 ->**

* feat(setLevelUpMessage): quick setting to levelup message module
* feat(setWelcomer): easier control for managing welcomer module
* refactor(gacha): added purchase-chaining
* refactor(exp): canvas-based level up message
* refactor(setLevelupMessage): remove uneccessary condition
* refactor(validateUser): added username param
* refactor(help): added thumbnail in the commandpedia section
* refactor(server): merge to system category
* refactor(leaderboard): merge to user category
* refactor(shop): merge to user category
* refactor(manager): renamed category to setting
* fix(serverInfo): undefined methods
* fix(buy): cover auto-equip

## **09/03/20 | 7.0.12 ->**

* fix(gacha, cardCollection): couldnt render card asset

## **09/02/20 | 7.0.11 ->**

* refactor(themeSwitch): renamed command to setTheme
* refactor(help): improved ux
* refactor(cardCollection): added new alias
* fix(setTheme): wrong cmd group

## **08/26/20 | 7.0.10 ->**

* style(asset): added new cover
* fix(locale): random backtick in SWITCH_THEME
* fix(profile): displaying unequipped badges
* refactor(buy): improved UX (experimental)

## **08/24/20 | 7.0.9 ->**

* refactor(shop): improved UI and added footer guide
* refactor(commands): merged social category to user category
* refactor(logs): dropped AFTER_INVITATION msg on guld channel
* refactor(invite): simplified msg
* refactor(inventory): removed footer text
* refactor(inventory): now container sorted by rarity
* refactor(inventory): optimized ui rendering
* refactor(inventory): vertical dimension is automatically scaled depending on the current container size

## **08/21/20 | 7.0.8 ->**

* User now able to use dark theme for free (#297)
* Reduced command cooldown time to 2 seconds (#296)
* Applying privacy in the Help Command (#295)
* fix(joinEvent, pistachio, and en): event join for AAU (#298)
* fix(invite): invite link to requested server (#299)
* build(deps): bump axios from 0.19.2 to 0.20.0 (#300)

## **08/19/20 | 7.0.7 ->**

* fix(command): multi-lang support has been temporarily disabled.

## **08/19/20 | 7.0.6 ->**

* fix(guildMemberUpdate): temporarily disabled due to odd wrong ref
* fix(raw): deprecate old caching method
* fix(pixiv): using await on fs.fileReadSync()

## **08/18/20 | 7.0.5 ->**

* fix(guildMemberUpdate): deprecated var reference.
* fix(profile): unable to render card that has badges in it.
* fix(theme): switcher can't read theme in inventory.
* fix(gacha): deprecated canvas param usage.

## **08/17/20 | 7.0.4 ->**

* fix(presenceUpdate): removed deprecated djs functions.
* refactor(invite): modularized and revised invite message.

## **08/17/20 | 7.0.3 ->**

* fix(welcomer): update code to follow djs v12 structs.

## **08/16/20 | 7.0.2 ->**

* fix(exp): -infinite values on rank update.

## **08/16/20 | 7.0.1 ->**

* fix(ready): wrong caching on presencestatus.
* fix(core): wrong img refs.

## **08/16/20 | 7.0.0 ->**

* Added new modular configurations for EXP System.
* Various canvas-based code has been rewritten to follow djs v12 structure.
* fix(gacha): remove invalid param in UI.itemVisual()
* fix(setRelationship): setrel missing guild_id param.
* fix(relationship): the card is now displayed by the registered date in descendant order.
* fix(level): wrong margin top.
* fix(setRanks): wrong filename.
* style(relationship): simplified UI.
* build(deps): now uses discord.js v12.

## **08/11/20 | 6.2.13 ->**

* fix(gacha): randomize rewards pool on same weight.

## **08/11/20 | 6.2.12 ->**

* docs(package): added bugs section.
* fix(pat): missing name parser.
* perf(assets): compressed img size.
* style(welcomer): update background img.

## **08/09/20 | 6.2.11 ->**

* fix(pat): empty string sockets.
* fix(hug): empty string sockets.
* fix(log): post collecting.
* chores(ready): displays user size in the presence status.
* build(deps): bump superagent from 5.3.1 to 6.0.0.

## **08/08/20 | 6.2.10 ->**

* fix(database): aggregate user relationships data.

## **08/08/20 | 6.2.9 ->**

* fix(setprofiledescription): unreachable command.

## **08/07/20 | 6.2.8 ->**

* docs(ReadMe.md): updates.
* fix(setBoosterColor): wrong lettercase and description.
* fix(setRanks): wrong lettercase and description.

## **08/07/20 | 6.2.7 ->**

* Bug: static clientID in invite command has been fixed.
* Bug: unable to send log messages in a newly added guild has been fixed.
* refactor(logs): added quick guide content in AFTER_INVITATION message.

## **08/06/20 | 6.2.6 ->**

* Bug: module failure on setConfig command has been fixed.
* docs(user_experience): new template.
* refactor(strike): added new alias.

## **08/05/20 | 6.2.5 ->**

* Bug: Unbalanced color contrast on user's profile card has been fixed and adjusted.
* Bug: Unresizable/static image on Cards.addCover() library has been fixed.
* Bug: Missing emojis on title and footer part of Leaderboard command has been fixed.
* refactor(leaderboard): added local-ranking identifier.
* refactor(invite): display notification when dm invite is successfully sent.
* Trimmed-out unused "EN" strings.

* refactor(ready): display help cmd on presence status.

## **08/05/20 | 6.2.4 ->**

* Bug: Routine.resourceUsageLogging() has been updated and now fully-functional.
* refactor(ready): display help cmd on presence status.

## **08/05/20 | 6.2.3 ->**

* Bug: updates user's rank on level up has been fixed.

## **08/04/20 | 6.2.2 ->**

* refactor(setConfig): now uses short-handed syntax.
* refactor(database): changed naming .addGuild() to .registerGuild(). Also updated its function documentation.
* refactor(setGuildBio): improved flow.
* Bug: Guild register function has been fixed.

## **08/03/20 | 6.2.1 ->**

* Bug: Wrong color variable on level card has been fixed.

## **08/02/20 | 6.2.0 ->**

* Bug: setTheme command has been fixed and now can be used by any privilege levels.
* Mute command now checks for manually-configured mute role in the guild.
* Added new unmute command.

## **08/01/20 | 6.1.6 ->**

* Bug: Weeb/Anime Leaderboard has been fixed.
* Bug: Logger lib path in reconnect event has been fixed.
* Rank Role will be updated everytime user leveling up. In order to use it, "custom_rank" module must be enabled in the guild.

## **07/29/20 | 6.1.5 ->**

* Bug: "EN" Localization error for Relationship Command has been fixed.
* Bug: Server booster's dynamic role color has been fixed and fully-functional. May need an additional configuration in order to enable the feature.

## **07/24/20 | 6.1.4 ->**

* Bug: Unreachable commands due to missing guild_id parameter on db method calling has been fixed.
* Removed Benchmark test.
* Reduced binary size of dummy db.
* Routine.databaseBackup() has been deprecated.

## **07/22/20 | 6.1.3 ->**

* Re-added multi-guild parameters on existing db functions. User now may be able to store different account data (exp/inventory/etc) based on guild they are in.
* Bug: Infinite Dailies Claim has been fixed.

## **07/20/20 | 6.1.2 ->**

* Updated test suite for Database lib and Permission Controller.
* Temporarily disabled multi-guild parameter until next update.
* Added developer command for old data restoration.
* Bug: unreachable commands due to missing guild_id column on most db lib methods Fixed.

## **07/20/20 | 6.1.1 ->**

* Bug: Crashing presenceUpdate Fixed.
* Bug: Routine.autoStatus() calling non-existent function Fixed.
* Bug: Artcoins Leaderboard showing the wrong amount Fixed.

## **07/18/20 | 6.1.0 ->**

* Functional Heart Module. Posts will start to receive hearts and record likes. Trending system is still disabled for the time being.
* Nickname Changer almost done. You are able to buy if set up on the server but may not use just yet.
* Added Level Ranks Customization. Add your own roles to use as ranks by using `>setranks`
* Added Server's Custom Configurations. Edit various modules options and fine-tune for your server.
* Bug: Strike Command Fixed. Record recorded last by fixed to show the correct person.
* Bug: Leaderboard Fixed. Fixed your place value so {{rank}} socket doesn't appear.
* Bug: Purchase/Buy Fixed. Double-check the required amount to be paid before proceeding the transaction.
* Bug: Experience System Fixed. Rounded values are now *actually* rounded (no pun intended).

## **06/22/20 | 6.0.2 ->**

* Strike perm level tag added.
* Disable Classrom module.
* Adds Modmail's DM control.
* fix(presenceUpdate): wrong properties path.
* feat: added .registerUser() module in db, now message controller checks for user validality in the users table.

## **06/18/20 | 6.0.1 ->**

* fix(dailies, rep): now only checks user with date data under 23 hours.

## **06/17/20 | 6.0.0 ->**

* Modularized Canvas-Based UI using Annie's custom UI framework.
* Added new item: Matcha Chocolate Bar
* Footer Components (heart) on profile card has been replaced with total amount of artcoins
* Refreshed UI for Level, Relationship and Leaderboard card.
* Cooling-down state for end-user actions now is fully managed by redis.
* Alpha modmail integration
* Command(buy) now accepts item id, item alias and item alias with case-insensitive as the search string.
* Command(shop) now is displayed in paginated-style. You can also filter result by giving additional item type as argument.
* Command(profile) is no longer using paginated-style.
* Command(gacha) UI has been improved. There's an additional visual effect when you pulled and item with rarity above rare.
* Command(systemStatus) the displayed information has minimized. Different information can be accessed by providing additional stat type as argument.
* Command(serverInfo) the displayed information has been updated.
* Command(help) the displayed information should be less confusing now. You also able to see the most popular commands at a glance.
* Command(complaint) complaint has been merged with strike, with omitted auto-penalty action.
* Command(roll) calling has been changed to gacha for single roll and gacha 10 for multi roll
* Command(pixiv) now is displaying the used software name on the work (if any)
* Command(artcoinsGenerator) now is only available to user with developer privilege.
* Command(daily, rep, gift, pay) now are sharing consistent interface and experience.
* Command(post) now is used to display user's portfolio/recently posted work.
* Command(cardCollection, inventory) now are displaying detailed infos of the item.
* Added Command(setprofile) as a centralized command to manage all the profile-related stuff (cover, badges, sticker, etc)
* Added Command(setsocialmedia) as a centralized command to connect your social accounts.
* Added Command(setrelationship) as a centralized command to manage your friends and families tree.
* You can buy more various items on the shop now. (the set price is unofficial and may change in the near future.)
* All items you bought/carry are now visible on your inventory (except card.)
* Moderation Commands are fully functional.
* Fun Commands are fully updated and functional.
* All card buffs (except Poppy) are temporarily disabled.
* Art Feature/Trending System is temporarily disabled.
* DM Notification System is temporarily disabled.
* Marketplace, Artbook, Trading System will be released in the later updates alongside all the previously disabled feature.

THIS VERSION IS FAIRLY UNSTABLE AND USES LIMITED FEATURES.

## **01/22/20 | 5.3.0 ->**

* Added Bot Invite link for cross-server support.
* Improved log system.
* Removed unused image assets.
* Updated .gitignore configuration.
* No longer deleting .git history on a production server.

## **01/15/20 | 5.2.1 ->**

* Fix deployment bug caused by false dir in .gitignore.
* Now userdataSelector module will include user's current ranking.
* Rank/EXP data retrieval in the level card has been optimized.
* Now command handler module will re-fetch the data for both author and the targeted user.
* Profile Card now is available to be used outside of guild role settings.
* Profile Card now is semi-integrated with newest UI Lib.
* Added fetching animation while using profile command.
* UI Lib (Light Theme) colour update.

## **01/14/20 | 5.2.0 ->**

* Updated UI Library
* Custom Rank Configuration
* Support Server ad on message module is no longer displayed.
* Refactored Level Card. (now uses UI Lib and not strictly to roles setting)
* Moderator Notification bug has been resolved.

## **01/11/20 | 5.1.3 ->**

* Fix ghosting command in verification channel.
* Untrack .pixivcaches
* Fix wrong string param in privilege checks.
* Add build & lint script.

## **01/10/20 | 5.1.2 ->**

* Disable .git history deletion on dev environment.
* Ignore verif notification on user with admin/mod privilege.
* Adds 30s cooling-down state for each verification message.
* .isAdmin() and .isModerator() now check by its granted permission(previously by role).

## **01/08/20 | 5.1.1 ->**

* Ignore quotation marks on complaint cmd args.

## **01/05/20 | 5.1.0 ->**

* Set point for correct versioning.
* Ton of UI/UX improvement.
* Added custom UI Library for handling canvas-based interface.
* Support Server ad on Annie's message system.
* Various QoL updates.

## **09/30/19 | 5.0.2 - >**

> **Rank**

* Level cap has been increased to **180**.
* New rank **[Altered Pencilician]**.
* You now able to collect accumulated bonus when skipping level.

> **Cards**

* We've removed auto-disassemble when getting duplicates. It means you now able to collect more than 1 of the same card.
* 5-star now has rainbow frame. 4-star kept using golden frame.
* New Illustration for **Nezuko** and **Shiro** Card (4-star)
* **Nezuko** and **Shiro** have two versions, made by different artist (Ralu & Poppy).
* Added **Ralu** Card (5-star) to Cardpedia, but still unobtainable from Lucky Ticket.
* **Kitomi[Owner Prosperity]** skill name has been changed to **[Princess Prosperity]**. Effect remains unchanged.
* **Naph[White's Cat Paradise]** skill effect has been greatly nerfed (50 FLAT EXP => 15 FLAT EXP).
* **Vezeko[Pleasure of Lewding]** skill name has been changed to **[One Night Pleasure]**.
* **Annie[Charming Talks]** skill effect has been changed as follows :
  * Previous : Unlocked experience gains when using bot command.
  * New : Gain 5% EXP boost in every channel.
* **Ami** Card will be replaced with **Ralu** Card in later update.

> **Inventory**

* Inventory UI has been redesigned.
* Inventory now able to carry up to 42 items.
* We've added native theming for inventory which it's color will follow your current profile skin.
* As a result of optimized inventory system, now your items sorting order works properly now.

> **Profile**

* Level restriction for Portfolio/Timeline card has been removed.

> **Gacha**

* Readjusted rate for **[Magical Paper]**.

> **Bug Fixes**

* Duplicate post in #featured channel has been resolved.
* EXP glitch (instant jump, sudden level down) has been resolved.
* Level up in #roles-request channel has been resolved.
* Expired EXP booster notification has been fixed.
* Not getting any EXP from **Naph[White's Cat Paradise]** has been resolved.

> **Events**

* #inktober channel gives 200~300 Artcoin per submission.

## **09/04/19 | 5.0.1 - >**

* Optimized commands data fetch
* Smart-notification config bug fixes.
* KISS/MAL leaderboard
* Better coverage with CI/CD
* Verified Badge
* Winston's logging system

## **08/24/19 | 5.0.0 - >**

* Kitomi[Owner's Prosperity] effect has been nerfed greatly (150% -> 50%)
* Naph[White's Cat Paradise] effect has been halved. (100EXP -> 50EXP)
* Vezeko[Lewding Pleasure] effect has been halved. (500% -> 250%)
* Pan[Party Time] effect revamp
* Ami[False Utopia] now only collectible.
* Snowy[Silent Ghosty] now only collectible.
* New 5-star card (collectibles)
* Now you are able to gain exp by talking in voice-channel
* Added Profile Sticker.
* Disabled Post Engagement Notification
* New Rank has been added. "Altered Pencilian"
* Nitro Booster role name has been changed to "☆ Shining Rich Star ☆"
* Duplicate card will return you a few amount of artcoins.
* Various bug fixes

## **05/16/19 | 4.0.0 - >**

* Lucky Ticket. (AAU gacha minigame)
* Improved purchase system
* Artcoins migration (userdata => userinventories)
* Custom developer mode to improve team workflow.
* Card Council's Perk.
* Gifting System.
* A new way to boost your exp instantly by eating power capsule.
* Simple >join command to participate in the server event
* Updated ReadMe.md.
* Added user card collection.
* Major structure refactor.
* Various bug fixes.

## **02/26/19 | 2.5.0 - >**

* Redesigned profile card
* Redesigned level card
* Added portfolio card
* Added mail & reward package command to help event team's task more easier.
* Artwork's url collection
* Newly added items
* Event Participant now is in ticket category. (previous: role)
* Various minor bugs fix

## **12/02/18 | 2.4.1 - >**

* Moderator commands updated  
* update: mute command with optional options for a timer and reason  
* Sends a confirmation of the mute action to logs channel and a message to the user being muted that they have been muted in the guild.  
* Added: unmute command with optional option of a reason  
* Sends a confirmation of the unmute action to logs channel     and a message to the user being unmuted that they have been    unmuted in the guild.  

## **12/02/18 | 2.4.0 - >**

* UI card color customization (available in light and dark).  
* update: Minor card re-design.  
* update: Buy command with categorized items.  
* update: Upcoming profile badges.  
* fix: New member role bugs.  
* fix: Novice rank bug.  
* fix: Null item in buy command.  

## **11/24/18 | 2.3.0 - >**

* addRole & removeRole bugs fix.

## **11/22/18 | 2.2.0 - >**

* removeRole bug in index.js has been fixed.

## **11/21/18 | 2.1.0 - >** 

* Deprecation functions bug issue has been solved.

## **11/20/18 | 2.0.0 - >** 

* Custom server profile card  
* Timezone command added.  
* Rep system added.  
* New member's profile will be registered automatically.  
* Major bug fixes.

## **11/12/18 | 1.6.0 - >**

* Flat & Modernize embed  
* Added files property check in help.js;  
* Admin help section bug has been fixed.  
* Added ping command in help section.  
* Removed thumnail from balance/bal command.  
* Removed candies emoji from daily attendance.  
* Unsupported alphanumeric characters in welcomer bug has been fixed.

## **11/07/18 | 1.4.0 - >**

* Welcomer card  
* shop-2 command has been changed to r.shop  
* Minor bug fixes.  

## **11/05/18 | 1.3.8 - >** 

* Ask command bug fixed.  
* Rating values on avatar command has been adjusted.

## **11/03/18 | 1.3.7 - >** 

* Avatar commands got fresh looks.  
* Fun rating system.  
* Advanced user finding algoritm  
* All ranks exp requirements were nerfed byy -15%.  
* xp conversion & 0 ac reward bugs have been fixed.

## **11/01/18 | 1.3.6 - >** 

* VPS moved to glitch.com.  
* Major bug fixes.  
* lb ac, lb xp and invite command.  
* Removed some unused code  
* Added ac bonus on every lvl up.  
* Lvlup message rework.  
* Added typing animation when mention invoked.

## **10/18/18 | 1.3.2 - >**

* New App username [Annie]  
* colorset.json  
* halloween-themed interactions.  
* added xp leaderboard  
* mention response  
* few commands embed  
* update(lvl,info,stats,daily,etcetera)

## **10/13/18 | 1.3.1 -** > 

* Added rolesCheck, wrapped functions, lowercased args & minor bug fixes.

## **09/16/18 | 1.3.0 - >**

* Major changes to all command files & SQLite database structure (by Blox_BlackJack)

## **09/03/18 | 1.2.5 - >**

* Minor bug fixes.

## **09/01/18 | 1.2.0 - >** 

* New exp curves (by The Frying Pan)  
* restructured JSON data  
* New commands (such as cartcoins,addxp and so on)  

## **08/18/18 | 1.1.0 - >**

* Beta phase

## **07/28/18 | 1.0.0 - >**

* Alpha scratch. (by Akane)
