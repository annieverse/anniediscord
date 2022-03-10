/**
 * Table that will be initalized on startup/upon call.
 * @param {knex} knex A knex instance
 * @return {knex.schema}
 */
 exports.up = function(knex) {
  /* eslint-disable */
  return new Promise(async (resolve, reject) => {
    try {
      /**
       * -------------------------
       * USERS BRANCH
       * -------------------------
       */
      const users = await knex.schema.hasTable(`users`)
      if (!users) await knex.schema.createTable(`users`, table => {
        table.string(`id`).primary().notNullable()
        table.string(`name`, 32).notNullable()
        table.integer(`locale_id`).defaultTo(0)
        table.integer(`gender_id`).defaultTo(0)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.foreign(`locale_id`)
          .references(`locales.id`)
          .onDelete(`SET NULL`)
        table.foreign(`gender_id`)
          .references(`genders.id`)
          .onDelete(`SET NULL`)
      })
      const userAbouts = await knex.schema.hasTable(`user_abouts`)
      if (!userAbouts) await knex.schema.createTable(`user_abouts`, table => {
        table.string(`user_id`).notNullable()
        table.string(`guild_id`).notNullable()
        table.string(`content`, 250)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.primary([`user_id`, `guild_id`])
        table.foreign(`user_id`)
          .references(`users.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`guild_id`)
          .references(`guilds.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })
      const userReputations = await knex.schema.hasTable(`user_reputations`)
      if (!userReputations) await knex.schema.createTable(`user_reputations`, table => {
        table.string(`user_id`).notNullable()
        table.string(`guild_id`).notNullable()
        table.integer(`total`).defaultTo(0)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.timestamp(`given_at`).defaultTo(knex.fn.now())
        table.primary([`user_id`, `guild_id`])
        table.foreign(`user_id`)
          .references(`users.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`guild_id`)
          .references(`guilds.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })
      const userBanners = await knex.schema.hasTable(`user_banners`)
      if (!userBanners) await knex.schema.createTable(`user_banners`, table => {
        table.string(`user_id`).notNullable()
        table.string(`guild_id`).notNullable()
        table.string(`image_id`)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.primary([`user_id`, `guild_id`])
        table.foreign(`user_id`)
          .references(`users.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`guild_id`)
          .references(`guilds.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })
      const userReminders = await knex.schema.hasTable(`user_reminders`)
      if (!userReminders) await knex.schema.createTable(`user_reminders`, table => {
        table.string(`id`).primary().notNullable()
        table.string(`user_id`).notNullable()
        table.string(`guild_id`).notNullable()
        table.text(`message`, `longtext`)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.foreign(`user_id`)
          .references(`users.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`guild_id`)
          .references(`guilds.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })
      const userQuests = await knex.schema.hasTable(`user_quests`)
      if (!userQuests) await knex.schema.createTable(`user_quests`, table => {
        table.string(`user_id`).notNullable()
        table.string(`guild_id`).notNullable()
        table.integer(`recent_quest_id`)
        table.integer(`accumulated_quest_taken`).defaultTo(0)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.primary([`user_id`, `guild_id`])
        table.foreign(`user_id`)
          .references(`users.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`guild_id`)
          .references(`guilds.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })
      const userInventories = await knex.schema.hasTable(`user_inventories`)
      if (!userInventories) await knex.schema.createTable(`user_inventories`, table => {
        table.string(`user_id`).notNullable()
        table.string(`guild_id`).notNullable()
        table.integer(`item_id`).notNullable()
        table.integer(`quantity`).defaultTo(0)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.primary([`user_id`, `guild_id`, `item_id`])
        table.foreign(`user_id`)
          .references(`users.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`guild_id`)
          .references(`guilds.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`item_id`)
          .references(`items.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })
      const userExp = await knex.schema.hasTable(`user_exp`)
      if (!userExp) await knex.schema.createTable(`user_exp`, table => {
        table.string(`user_id`).notNullable()
        table.string(`guild_id`).notNullable()
        table.float(`total`).defaultTo(0)       
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.primary([`user_id`, `guild_id`])
        table.foreign(`user_id`)
          .references(`users.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`guild_id`)
          .references(`guilds.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })
      const userDailies = await knex.schema.hasTable(`user_dailies`)
      if (!userDailies) await knex.schema.createTable(`user_dailies`, table => {
        table.string(`user_id`).notNullable()
        table.string(`guild_id`).notNullable()
        table.integer(`total_streak`).defaultTo(0)
        table.integer(`current_streak`).defaultTo(0)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.primary([`user_id`, `guild_id`])
        table.foreign(`user_id`)
          .references(`users.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`guild_id`)
          .references(`guilds.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })

      /**
       * -------------------------
       * RELATIONSHIPS BRANCH
       * -------------------------
       */
      const relationships = await knex.schema.hasTable(`relationships`)
      if (!relationships) await knex.schema.createTable(`relationships`, table => {
        table.increments(`id`).primary().notNullable()
        table.string(`name`)
        table.string(`gender_id`)
        table.string
      })
        
      /**
       * -------------------------
       * LOCALE BRANCH
       * -------------------------
       */
      const locale = await knex.schema.hasTable('locales')
      if (!locale) {
        await knex.schema.createTable('locales', table => {
          table.increments('id').primary().notNullable()
          table.string('name')
          table.string('alias', 5)
          table.timestamp('created_at').defaultTo(knex.fn.now())
          table.timestamp('updated_at').defaultTo(knex.fn.now())
        })
        knex(`locales`).insert([
          { name: 'English', alias: 'en' },
          { name: 'French', alias: 'fr' },
          { name: 'Indonesia', alias: 'id' }
        ])
      }
      
      /**
       * -------------------------
       * GUILDS BRANCH
       * -------------------------
       */
      const guilds = await knex.schema.hasTable(`guilds`)
      if (!guilds) await knex.schema.createTable(`guilds`, table => {
        table.string(`id`).primary().notNullable()
        table.string(`name`).notNullable()
        table.text(`about`, `longtext`)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
      })
      const guildConfigurations = await knex.schema.hasTable(`guild_configurations`)
      if (!guildConfigurations) await knex.schema.createTable(`guild_configurations`, table => {
        table.string(`guild_id`).notNullable()
        table.string(`code`).notNullable()
        //  Why not json?
        //  reason is, most of the registered configs are having diverse types. not inherently json
        //  so we need to stringify the value to store the configs, and then parse it when we need it
        table.text(`value`, `longtext`)
        table.string(`set_by_user_id`).notNullable()
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.primary([`guild_id`, `code`])
        table.foreign(`guild_id`)
          .references(`guilds.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`set_by_user_id`)
          .references(`users.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })

      /**
       * -------------------------
       * QUESTS BRANCH
       * -------------------------
       */
      const quests = await knex.schema.hasTable(`quests`)
      if (!quests) await knex.schema.createTable(`quests`, table => {
        table.increments(`id`).primary().notNullable()
        table.string(`author_id`).notNullable()
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.foreign(`author_id`)
          .references(`users.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })
      const questLocales = await knex.schema.hasTable(`quest_locales`)
      if (!questLocales) await knex.schema.createTable(`quest_locales`, table => {
        table.increments(`id`).primary().notNullable()
        table.integer(`quest_id`).notNullable()
        table.string(`name`).notNullable()
        table.text(`description`, `longtext`).notNullable()
        table.specificType(`answer`, `string[]`).notNullable()
        table.string(`locale`, 5).notNullable()
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.foreign(`quest_id`)
          .references(`quests.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })
      const questRewards = await knex.schema.hasTable(`quest_rewards`)
      if (!questRewards) await knex.schema.createTable(`quest_rewards`, table => {
        table.increments(`id`).primary().notNullable()
        table.integer(`quest_id`).notNullable()
        table.integer(`item_id`).notNullable().defaultTo(52)
        table.integer(`quantity`).defaultTo(1)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.foreign(`quest_id`)
          .references(`quests.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`item_id`)
          .references(`items.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })
      const questLog = await knex.schema.hasTable(`quest_log`)
      if (!questLog) await knex.schema.createTable(`quest_log`, table => {
        table.increments(`id`).primary().notNullable()
        table.integer(`quest_id`).notNullable()
        table.string(`user_id`).notNullable()
        table.string(`guild_id`).notNullable()
        table.string(`answer`)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.foreign(`quest_id`)
          .references(`quests.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`user_id`)
          .references(`users.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`guild_id`)
          .references(`guilds.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })

      /**
       * -------------------------
       * ITEMS BRANCH
       * -------------------------
       */
      const items = await knex.schema.hasTable(`items`)
      if (!items) await knex.schema.createTable(`items`, table => {
        table.increments(`id`).primary().notNullable()
        table.string(`name`).notNullable()
        table.text(`description`, `longtext`)
        table.string(`alias`)
        table.integer(`type_id`).notNullable()
        table.integer(`rarity_id`).notNullable()
        table.integer(`bound`).notNullable().defaultTo(0)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.foreign(`type_id`)
          .references(`item_types.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`rarity_id`)
          .references(`item_rarities.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })
      const itemTypes = await knex.schema.hasTable(`item_types`)
      if (!itemTypes) await knex.schema.createTable(`item_types`, table => {
        table.increments(`id`).primary().notNullable()
        table.string(`name`).notNullable()
        table.string(`alias`)
        table.integer(`max_size`).notNullable().defaultTo(0)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
      })
      const itemRarities = await knex.schema.hasTable(`item_rarities`)
      if (!itemRarities) await knex.schema.createTable(`item_rarities`, table => {
        table.increments(`id`).primary().notNullable()
        table.string(`name`).notNullable()
        table.integer(`level`).unique().notNullable()
        table.string(`hex_color`).defaultTo(`#000000`)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
      })
      const itemGacha = await knex.schema.hasTable(`item_gacha`)
      if (!itemGacha) await knex.schema.createTable(`item_gacha`, table => {
        table.increments(`id`).primary().notNullable()
        table.integer(`item_id`).notNullable()
        table.integer(`quantity`).notNullable().defaultTo(1)
        table.float(`weight`).notNullable().defaultTo(1)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.foreign(`item_id`)
          .references(`items.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })
      const itemLog = await knex.schema.hasTable(`item_log`)
      if (!itemLog) await knex.schema.createTable(`item_log`, table => {
        table.string(`id`).notNullable()
        table.string(`user_id`).notNullable()
        table.string(`guild_id`).notNullable()
        table.integer(`item_id`).notNullable()
        table.integer(`quantity`).notNullable()
        table.string(`type`).notNullable()
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.foreign(`user_id`)
          .references(`users.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`guild_id`)
          .references(`guilds.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
        table.foreign(`item_id`)
          .references(`items.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })

      /**
       * -------------------------
       * AFFILIATES BRANCH
       * -------------------------
       */
      const affiliates = await knex.schema.hasTable(`affiliates`)
      if (!affiliates) await knex.schema.createTable(`affiliates`, table => {
        table.string(`guild_id`).primary().notNullable()
        table.text(`description`, `longtext`)
        table.text(`notes`, `longtext`)
        table.string(`invite_link`)
        table.timestamp(`created_at`).defaultTo(knex.fn.now())
        table.timestamp(`updated_at`).defaultTo(knex.fn.now())
        table.foreign(`guild_id`)
          .references(`guilds.id`)
          .onDelete(`CASCADE`)
          .onUpdate(`CASCADE`)
      })

      /**
       * -------------------------
       * BUFFS BRANCH
       * -------------------------
       */
      const buffs = await knex.schema.hasTable(`buffs`)
      if (!buffs) {
        await knex.schema.createTable(`buffs`, table => {
          table.increments(`id`).primary().notNullable()
          table.integer(`buff_id`)
          table.timestamp(`created_at`).defaultTo(knex.fn.now())
        })
      }


      resolve()
    }
    catch(e) {
      reject(e)
    }
  })
}

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists(`users`)
    .dropTableIfExists(`guilds`)
    .dropTableIfExists(`guild_configurations`)
    .dropTableIfExists(`commissions`)
}