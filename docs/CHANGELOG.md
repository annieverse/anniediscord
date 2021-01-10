## [7.10.21](https://github.com/klerikdust/anniediscord/compare/v7.10.20...v7.10.21) (2021-01-10)


### Bug Fixes

* **cmdController:** wrong ref on log ([61d591d](https://github.com/klerikdust/anniediscord/commit/61d591d4283fa933026f6fc673c9df91d85be1f9))

## [7.10.20](https://github.com/klerikdust/anniediscord/compare/v7.10.19...v7.10.20) (2021-01-10)


### Bug Fixes

* **database:** overriden cache on getUserExp ([faa183d](https://github.com/klerikdust/anniediscord/commit/faa183dd0bda4be06a977d6beaf9d150e1fce1d8))

## [7.10.19](https://github.com/klerikdust/anniediscord/compare/v7.10.18...v7.10.19) (2021-01-10)


### Bug Fixes

* **user:** registration flow ([3dc499a](https://github.com/klerikdust/anniediscord/commit/3dc499ac1fa1b9c37eefc68d3c2cc21ec8c44970))

## [7.10.18](https://github.com/klerikdust/anniediscord/compare/v7.10.17...v7.10.18) (2021-01-10)


### Bug Fixes

* **permission:** fails to enumarate available perms ([dadad1b](https://github.com/klerikdust/anniediscord/commit/dadad1bfb0b360a8913c03616831d53e01cb89b9))

## [7.10.17](https://github.com/klerikdust/anniediscord/compare/v7.10.16...v7.10.17) (2021-01-10)


### Bug Fixes

* **permission:** lower levels fail to fetch ([ad8f5ca](https://github.com/klerikdust/anniediscord/commit/ad8f5ca0b0e61cc221ee86bb104d5b7f04c47733))

## [7.10.16](https://github.com/klerikdust/anniediscord/compare/v7.10.15...v7.10.16) (2021-01-09)


### Bug Fixes

* **event:** handles unauthorized dm ([9d291ca](https://github.com/klerikdust/anniediscord/commit/9d291ca612c8d8763e12588e6e736dc937771bf8))

## [7.10.15](https://github.com/klerikdust/anniediscord/compare/v7.10.14...v7.10.15) (2021-01-09)


### Bug Fixes

* **permission:** wrong ref ([20cd545](https://github.com/klerikdust/anniediscord/commit/20cd545b2e953bcdf29868b162677da0e20d1c1a))

## [7.10.14](https://github.com/klerikdust/anniediscord/compare/v7.10.13...v7.10.14) (2021-01-09)


### Performance Improvements

* optimized controllers in message event ([bce7a52](https://github.com/klerikdust/anniediscord/commit/bce7a52a689e48c0745dfa157d046dad1ed03c06))

## [7.10.13](https://github.com/klerikdust/anniediscord/compare/v7.10.12...v7.10.13) (2021-01-07)


### Bug Fixes

* **redis:** stored non-stringified value ([c15c010](https://github.com/klerikdust/anniediscord/commit/c15c010fe28e4f24c3ae724272d20bdb5cda8617))

## [7.10.12](https://github.com/klerikdust/anniediscord/compare/v7.10.11...v7.10.12) (2021-01-06)


### Bug Fixes

* **event:** static presence ([acc7cc8](https://github.com/klerikdust/anniediscord/commit/acc7cc8e62eb57a71719abf2fbfd6d5a373a02a2))

## [7.10.11](https://github.com/klerikdust/anniediscord/compare/v7.10.10...v7.10.11) (2021-01-04)


### Bug Fixes

* **routines:** wrong ref ([9c09236](https://github.com/klerikdust/anniediscord/commit/9c09236a0ad87ff51844481ac93debb2e12440e8))

## [7.10.10](https://github.com/klerikdust/anniediscord/compare/v7.10.9...v7.10.10) (2021-01-04)


### Bug Fixes

* **handler:** uncatched handler on exp framework ([361d479](https://github.com/klerikdust/anniediscord/commit/361d479817aee137d1a3864a3b9c96174eb7712a))
* **routines:** unreachable root node ([dee722a](https://github.com/klerikdust/anniediscord/commit/dee722af4e1ad0220d22ec8fca09624f6c290d37))

## [7.10.9](https://github.com/klerikdust/anniediscord/compare/v7.10.8...v7.10.9) (2021-01-04)


### Bug Fixes

* **cmdLoader:** invalid params field ([86bd3b8](https://github.com/klerikdust/anniediscord/commit/86bd3b82cf1cc9adc78e12aabc90d2c79c7d06b5))

## [7.10.8](https://github.com/klerikdust/anniediscord/compare/v7.10.7...v7.10.8) (2021-01-04)


### Bug Fixes

* **permissions:** refetch perms in cmd controller ([6c69325](https://github.com/klerikdust/anniediscord/commit/6c6932504a00b01e4d195ea9208f02c2963cc0c5))
* **userValidation:** validation ttl too high ([15b0619](https://github.com/klerikdust/anniediscord/commit/15b061952851e8506e4b99f952b1b3425c177fe6))


### Performance Improvements

* eliminates unnecessary blocking-stack ([10c3201](https://github.com/klerikdust/anniediscord/commit/10c3201d8bbf044a463e4be5f815a731c81049ba))

## [7.10.7](https://github.com/klerikdust/anniediscord/compare/v7.10.6...v7.10.7) (2021-01-03)


### Bug Fixes

* **events:** production events ([62e8b74](https://github.com/klerikdust/anniediscord/commit/62e8b7407070eb8a232c998c219d6067f1aff230))


### Performance Improvements

* **messageEvent:** optimized gc and data validation ([c7809bc](https://github.com/klerikdust/anniediscord/commit/c7809bc5bfb7b89ebc3c4cbe638c9f3741c3f229))

## [7.10.6](https://github.com/klerikdust/anniediscord/compare/v7.10.5...v7.10.6) (2021-01-02)


### Performance Improvements

* **cache:** adds ttl cache on exp gain ([d642668](https://github.com/klerikdust/anniediscord/commit/d642668733777412d1ae1e8185740306cf53e56d))

## [7.10.5](https://github.com/klerikdust/anniediscord/compare/v7.10.4...v7.10.5) (2021-01-02)


### Bug Fixes

* **exp:** blocking-flow on update rank ([3abf379](https://github.com/klerikdust/anniediscord/commit/3abf3796c254d0f6029d1fe48b6b39dddc707e80))

## [7.10.4](https://github.com/klerikdust/anniediscord/compare/v7.10.3...v7.10.4) (2021-01-02)


### Bug Fixes

* **quest:** permission handler ([604652a](https://github.com/klerikdust/anniediscord/commit/604652a25808dda276cd6c26267ad029496a20b6))

## [7.10.3](https://github.com/klerikdust/anniediscord/compare/v7.10.2...v7.10.3) (2021-01-02)


### Bug Fixes

* **messageUpdate:** unhandled DM flow ([ab4e017](https://github.com/klerikdust/anniediscord/commit/ab4e017429672d3f5dd8aa55af219ad8100bbe44))

## [7.10.2](https://github.com/klerikdust/anniediscord/compare/v7.10.1...v7.10.2) (2021-01-02)


### Bug Fixes

* **URL:** disconnected on dm sent ([7c606b3](https://github.com/klerikdust/anniediscord/commit/7c606b368dd80b996f75d0ca62cd092759366cad))

## [7.10.1](https://github.com/klerikdust/anniediscord/compare/v7.10.0...v7.10.1) (2021-01-01)


### Bug Fixes

* **event:** reduced blocking-functions in point module ([2af48a3](https://github.com/klerikdust/anniediscord/commit/2af48a37299c353623632d0afa891aed80befac1))

# [7.10.0](https://github.com/klerikdust/anniediscord/compare/v7.9.1...v7.10.0) (2021-01-01)


### Bug Fixes

* **defaultPalette:** fallback on colorless role-rank ([471aebd](https://github.com/klerikdust/anniediscord/commit/471aebd47e34d4a4a62297245d2f77175633bd15))
* **events:** reduce loads on blocking connection ([08094fe](https://github.com/klerikdust/anniediscord/commit/08094fecebfcadedd840a166faf7f8cf0f0d9e09))
* **exp:** missing perm on lvlup perk ([5fea0f1](https://github.com/klerikdust/anniediscord/commit/5fea0f1820cb7e20ad8b9366dcd995e1f6374c42))
* **gacha:** double react exploits ([ef8579a](https://github.com/klerikdust/anniediscord/commit/ef8579af7b7e74e2c05018702cde8105a1cfd9b8))
* **levelUp:** custom cover not applied ([890d0b9](https://github.com/klerikdust/anniediscord/commit/890d0b9b12194ea4d421f506e4bd9cb73859ccff))
* **UI:** ommit unsupported symbols from rank name ([11efb6b](https://github.com/klerikdust/anniediscord/commit/11efb6b7b4d8922817c8d7e39142dc56f0770731))
* **userLookup:** fail to parse user on mention/id. ([b22a3cc](https://github.com/klerikdust/anniediscord/commit/b22a3cc29c88a37e4f644e3194b4a1f3d2547481))


### Features

* **AR:** allows server  to create their own autoresponder. ([f5f09bf](https://github.com/klerikdust/anniediscord/commit/f5f09bf596a9d1649fd6ae5dcb90aed514cf81f4))
* **cancelOpt:** added cancel-button on transaction. ([9a99d01](https://github.com/klerikdust/anniediscord/commit/9a99d01d37d51fa5a30b2080e45522f97427f72c))
* **cancelOpt:** widely-covered commands ([c38dc58](https://github.com/klerikdust/anniediscord/commit/c38dc580bfd9f098d813f4b16fc817061d323842))
* **levelCard:** the displayed exp now is rounded. ([300b762](https://github.com/klerikdust/anniediscord/commit/300b76283fc1c7f4e2827da17d261d4851c29576))

## [7.9.1](https://github.com/klerikdust/anniediscord/compare/v7.9.0...v7.9.1) (2020-12-30)


### Bug Fixes

* **setRank:** undefined position on changed default role name ([8812985](https://github.com/klerikdust/anniediscord/commit/8812985eec9c48c63db5b955050e206c7a349284))

# [7.9.0](https://github.com/klerikdust/anniediscord/compare/v7.8.0...v7.9.0) (2020-12-25)


### Bug Fixes

* **gradient:** increase gradient range on addBackgroundLayer ([68a04b4](https://github.com/klerikdust/anniediscord/commit/68a04b483b5d066c48b74a025b090ba561ecf086))


### Features

* **defaultCover:** added option to use default cover in the setcover command ([f27da6c](https://github.com/klerikdust/anniediscord/commit/f27da6c07c2f552f465ccd64d6564f506659601f))
* **selfUpload:** setcover now allows user to self-upload their own image ([5f51741](https://github.com/klerikdust/anniediscord/commit/5f51741b9acf44a4b89a135c897f5219b3851c7d))
* **ui:** self-upload cover on other prebuild uis ([45f27b6](https://github.com/klerikdust/anniediscord/commit/45f27b6aae2cab0ccc09bafdabf3e041fd93f0f2))

# Change Logs

___

## **11/28/20 | 7.6.13 ->**

* 778eecd build: package test
* 4a726b6 chore: temporarily disable shop
* 5cc06fb style(leaderboard): use primary palette and new banner
* 12ae3aa refactor: ui and ux improvementss
* 4048f36 refactor(vote): improved layosut
* a00f0c7 refactor(setbio): improved flow
* 8e589c0 refactor(setCover): improved response and layout
* 54c81a2 refactor(setExp): improved response
* d82fdb1 refactor(setlvlupmsg): improved ui
* 69b246f refactor(logs): improved flow
* b026729 refactor(setranks): improved flow
* ecde679 refactor(setRelationship): confirm by target user
* 2f614f1 refactor(relationships): improved UI and settings flow
* 51aa484 refactor(relationship): guide on empty card
* b80b9a2 refactor(command): userinvalid color
* 8791560 refactor(gift): improved flow and ui
* 743827d refactor(avatar): added initial message
* 20ed578 refactor(balance): improved ui
* 12f94bf refactor(dailies): improved ui

## **11/24/20 | 7.6.12 ->**

* b2c7fb3 refactor(quest): safeguard and improved ui
* 1bda510 refactor(rep): improved responses
* c07ab1a refactor(cartcoin): improved responses

## **11/23/20 | 7.6.11 ->**

* fde44bf refactor(collection): improved empty collection msg
* 3ac127d refactor(facegen): naming
* 3f8988e refactor(commandpedia): optimized ui
* 5a91ffe refactor(presence): displays splitted data

## **11/21/20 | 7.6.10 ->**

* 1ac0591 style(leaderboard): light background and small element adjustments
* cb1b08a fix(lb): undefined output on new server

## **11/20/20 | 7.6.9 ->**

* refactor(roleDelete): ommits from cache and db when registered ranks or welcomer roles got deleted

## **11/19/20 | 7.6.8 ->**

* d9affd4 refactor(fun): now pat and hug uses purrbot.site API
* 0999b1a refactor(reply): enforces color consistency by only using primary palette

## **11/18/20 | 7.6.7 ->**

* dd5ca1c fix(avatar): unable to display gif-typed avatar

## **11/17/20 | 7.6.6 ->**

* 1fb84e9 refactor: added role safeguard on setrank and setwelcomer

## **11/16/20 | 7.6.5 ->**

* 9fba2e7 refactor(setWelcomer): allows multiple roles assign
* 70aabd0 fix(setWelcomer): append whole arguments
* d8e69fb fix(newGuild): fail to send dm
* 185dbf1 fix(guildCache): rebuild cache on new server

## **11/13/20 | 7.6.4 ->**

* b57843d refactor(user): always validate userdata on command

## **11/12/20 | 7.6.3 ->**

* 7e21587 fix(sellFrags): missing avatar parser

## **11/11/20 | 7.6.2 ->**

* 4529818 fix: invisible rawArg and setCover avatar parser
* 3be0216 chores: removed footer warn on setLogs
* 0be03a4 chores: enabled Welcomer Module

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
