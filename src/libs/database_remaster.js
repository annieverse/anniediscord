const SqliteClient = require(`better-sqlite3`)
const Redis = require(`async-redis`)
const logger = require(`pino`)({
	name: `DATABASE`,
	level: `debug`
})
const getBenchmark = require(`../utils/getBenchmark`)
const fs = require(`fs`)
const {
	join
} = require(`path`)
const relationshipPairs = require(`../config/relationshipPairs.json`)
const {
	table
} = require("console")

/**
 * Centralized Class for handling various database tasks 
 * for Annie.
 */
class Database {

	/**
	 * New Version starting from 11/22/2021
	 * Please follow this format:
	 * Each function pertaining to a command should be inside of a comment break meaning
	 * /**
	 * Start of XX command
	 *  */
	/*	<functions>
		/**
	 	* End of XX command
	 *  */

	/**
	 * Verify each table exists and if it doesn't create the table
	 */
	async verifyTables() {
		TABLES = [
			affiliates_table = `CREATE TABLE IF NOT EXISTS affiliates (
		'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		'guild_id' TEXT NOT NULL,
		'description' TEXT DEFAULT 'Another awesome guild!',
		'invite_link' TEXT,
		'notes' TEXT)`,
			command_log_table = `CREATE TABLE IF NOT EXISTS commands_log (

				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'log_id' INTEGER PRIMARY KEY AUTOINCREMENT,
				'user_id' TEXT,
				'channel_id' TEXT,
				'guild_id' TEXT,
				'command_alias' TEXT,
				'resolved_in' TEXT
	 
				)`,
			guilds_table = `CREATE TABLE IF NOT EXISTS guilds (

				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'guild_id' TEXT PRIMARY KEY,
				'name' TEXT,
				'bio' TEXT
	 
				)`,
			guilds_configurations_table = `CREATE TABLE IF NOT EXISTS guild_configurations (

				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'config_id' INTEGER PRIMARY KEY AUTOINCREMENT,
				'config_code' TEXT,
				'guild_id' TEXT,
				'customized_parameter' TEXT,
				'set_by_user_id' TEXT,
	
				FOREIGN KEY(guild_id)
				REFERENCES guilds(guild_id)
					ON DELETE CASCADE
					ON UPDATE CASCADE
	
				FOREIGN KEY(set_by_user_id)
				REFERENCES users(user_id)
					   ON UPDATE CASCADE
					ON DELETE SET NULL
	
				)`,
			item_gacha_table = `CREATE TABLE IF NOT EXISTS item_gacha (

				'gacha_id' INTEGER PRIMARY KEY AUTOINCREMENT,
				'item_id' INTEGER,
				'quantity' INTEGER DEFAULT 1,
				'weight' REAL,
	 
				 FOREIGN KEY(item_id)
				 REFERENCES items(item_id)
					 ON DELETE CASCADE
					 ON UPDATE CASCADE
	 
				)`,
			item_rarities_table = `CREATE TABLE IF NOT EXISTS item_rarities (

				'rarity_id' INTEGER PRIMARY KEY AUTOINCREMENT,
				'name' TEXT,
				'level' INTEGER UNIQUE,
				'color' TEXT DEFAULT '#000000'
	 
				)`,
			item_types_table = `CREATE TABLE IF NOT EXISTS item_types (

				'type_id' INTEGER PRIMARY KEY AUTOINCREMENT,
				'name' TEXT,
				'alias' TEXT,
				'max_stacks' INTEGER DEFAULT 9999,
				'max_use' INTEGER DEFAULT 9999
	 
				)`,
			items_table = `CREATE TABLE IF NOT EXISTS items (

				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'item_id' INTEGER PRIMARY KEY AUTOINCREMENT,
				'name' TEXT,
				'description' TEXT,
				'alias' TEXT,
				'type_id' INTEGER,
				'rarity_id' INTEGER,
				'bind' TEXT DEFAULT 0,
	 
				FOREIGN KEY (rarity_id) 
				REFERENCES item_rarities(rarity_id)
						ON UPDATE CASCADE
						ON DELETE SET NULL,
	 
				FOREIGN KEY (type_id) 
				REFERENCES item_types(type_id)
						ON UPDATE CASCADE
						ON DELETE SET NULL
	 
				)`,
			quest_log_table = `CREATE TABLE IF NOT EXISTS quest_log (
		'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		'quest_id' INTEGER,
		'user_id' TEXT,
		'guild_id' TEXT,
		'answer' TEXT)`,
			quests_table = `CREATE TABLE IF NOT EXISTS quests (
		'registered_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		'updated_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		'quest_id'	INTEGER PRIMARY KEY AUTOINCREMENT,
		'reward_amount'	INTEGER,
		'name'	TEXT,
		'description'	TEXT,
		'correct_answer'	TEXT
	)`,
			relationships_table = `CREATE TABLE IF NOT EXISTS relationships (

				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'relationship_id' INTEGER PRIMARY KEY AUTOINCREMENT,
				'name' TEXT
	 
				)`,
			resource_log_table = `CREATE TABLE IF NOT EXISTS resource_log (

				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'log_id' INTEGER PRIMARY KEY AUTOINCREMENT,
				'uptime' INTEGER,
				'ping' REAL,
				'cpu' REAL,
				'memory' REAL
	 
				)`,
			shop_table = `CREATE TABLE IF NOT EXISTS shop (

				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'shop_id' INTEGER PRIMARY KEY AUTOINCREMENT,
				'item_id' INTEGER,
				'item_price_id' INTEGER,
				'price' INTEGER DEFAULT 100,
	 
				FOREIGN KEY (item_id) 
				REFERENCES items(item_id)
						ON UPDATE CASCADE
						ON DELETE CASCADE,
	 
				FOREIGN KEY (item_price_id) 
				REFERENCES items(item_id)
						ON UPDATE CASCADE
						ON DELETE CASCADE
	 
				)`,
			sqlite_sequence_table = `CREATE TABLE IF NOT EXISTS sqlite_sequence(name,seq)`,
			user_dailies_table = `CREATE TABLE IF NOT EXISTS user_dailies (

				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'user_id' TEXT PRIMARY KEY,
				'total_streak' INTEGER DEFAULT 0,
	 
				FOREIGN KEY(user_id)
				REFERENCES users(user_id) 
					ON DELETE CASCADE
					ON UPDATE CASCADE
	 
				)`,
			user_exp_table = `CREATE TABLE IF NOT EXISTS user_exp (

				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'user_id' TEXT PRIMARY KEY,
				'current_exp' INTEGER DEFAULT 0,
				'booster_id' INTEGER,
				'booster_activated_at' TIMESTAMP,
	 
				FOREIGN KEY(user_id) 
				REFERENCES users(user_id) 
					ON DELETE CASCADE
					ON UPDATE CASCADE
	 
				FOREIGN KEY(booster_id) 
				REFERENCES items(item_id) 
					ON DELETE CASCADE
					ON UPDATE CASCADE
	 
				)`,
			user_inventories_table = `CREATE TABLE IF NOT EXISTS user_inventories (
		   
				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'user_id' TEXT,
				'item_id' INTEGER,
				'quantity' INTEGER DEFAULT 0,
				'in_use' INTEGER DEFAULT 0,
	
				PRIMARY KEY (user_id, item_id),
	
				FOREIGN KEY(user_id) 
				REFERENCES users(user_id) 
					ON DELETE CASCADE
					ON UPDATE CASCADE,
	
				FOREIGN KEY(item_id) 
				REFERENCES items(item_id) 
					ON DELETE CASCADE
					ON UPDATE CASCADE
	
				)`,
			user_quests_table = `CREATE TABLE IF NOT EXISTS user_quests (
		'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		'user_id' TEXT,
		'guild_id' TEXT,
		'next_quest_id' INTEGER,

		PRIMARY KEY(user_id, guild_id)

		FOREIGN KEY(next_quest_id)
		REFERENCES quests(quest_id) 
		   ON DELETE CASCADE
		   ON UPDATE CASCADE

		FOREIGN KEY(user_id)
		REFERENCES users(user_id) 
		   ON DELETE CASCADE
		   ON UPDATE CASCADE

		FOREIGN KEY(guild_id)
		REFERENCES guilds(guild_id) 
		   ON DELETE CASCADE
		   ON UPDATE CASCADE)`,
			user_relationships_table = `CREATE TABLE IF NOT EXISTS user_relationships (

				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'user_id_A' TEXT,
				'user_id_B' TEXT,
				'relationship_id' TEXT,
	 
				PRIMARY KEY(user_id_A, user_id_B),
	 
				FOREIGN KEY(user_id_A)
				REFERENCES users(user_id)
						ON DELETE CASCADE
						ON UPDATE CASCADE
	 
				FOREIGN KEY(user_id_B)
				REFERENCES users(user_id)
						ON DELETE CASCADE
						ON UPDATE CASCADE
	 
				FOREIGN KEY(relationship_id)
				REFERENCES relationships(relationship_id)
						ON DELETE CASCADE
						ON UPDATE CASCADE
				)`,
			user_reminders_table = `CREATE TABLE IF NOT EXISTS user_reminders (

		'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		'reminder_id' TEXT PRIMARY KEY,
		'user_id' TEXT,
		'message' TEXT,
		'remind_at' TEXT,

		FOREIGN KEY(user_id)
		REFERENCES users(user_id) 
			ON DELETE CASCADE
			ON UPDATE CASCADE

		)`,
			user_reputations_table = `CREATE TABLE IF NOT EXISTS user_reputations (

				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'last_giving_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'last_received_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'user_id' TEXT PRIMARY KEY,
				'total_reps' INTEGER DEFAULT 0,
				'recently_received_by' TEXT,
	 
				FOREIGN KEY(user_id) 
				REFERENCES users(user_id) 
					ON DELETE CASCADE
					ON UPDATE CASCADE
	 
				)`,
			user_self_covers_table = `CREATE TABLE IF NOT EXISTS user_self_covers (
		'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		'cover_id' TEXT,
		'user_id' TEXT,
		'guild_id' TEXT,
		PRIMARY KEY(user_id, guild_id),
		FOREIGN KEY(user_id)
		REFERENCES users(user_id) 
		   ON DELETE CASCADE
		   ON UPDATE CASCADE)`,
			user_socialmedias = `CREATE TABLE IF NOT EXISTS user_socialmedias (

				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'socialmedia_id' INTEGER PRIMARY KEY AUTOINCREMENT,
				'user_id' TEXT,
				'url' TEXT,
				'account_type' TEXT,
	 
				FOREIGN KEY(user_id)
				REFERENCES users(user_id)
						ON DELETE CASCADE
						ON UPDATE CASCADE
	 
				)`,
			users_table = `CREATE TABLE IF NOT EXISTS users (

				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'last_login_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'user_id' TEXT PRIMARY KEY,
				'name' TEXT,
				'bio' TEXT DEFAULT "Hi! I'm a new user!",
				'verified' INTEGER DEFAULT 0,
				'lang' TEXT DEFAULT 'en',
				'receive_notification' INTEGER DEFAULT -1
	 
				)`,
			trading_trades_table = `CREATE TABLE IF NOT EXISTS trading_trades (
				'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				'user_id' TEXT NOT NULL,
				'guild_id' TEXT NOT NULL,
				'trade_id' REAL UNIQUE NOT NULL,
				'status' TEXT NOT NULL,
				'channel' TEXT NOT NULL UNIQUE DEFAULT 0)`,
			trading_transaction_table = `CREATE TABLE IF NOT EXISTS trading_transaction (
					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'user_one_id' TEXT NOT NULL,
					'user_two_id' TEXT NOT NULL,
					'guild_id' TEXT NOT NULL,
					'trade_id' TEXT NOT NULL,
					'user_one_item' TEXT NOT NULL,
					'user_two_item' TEXT NOT NULL)`,
			trading_blocked_users_table = `CREATE TABLE IF NOT EXISTS trading_blocked_users (
						'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
						'user_id' TEXT NOT NULL UNIQUE,
						'blocked' INTEGER DEFAULT 0,
						'reason' TEXT DEFAULT 'The Moderator didnt supply a reason, if you would like to appeal this block please address it to the mods on the server or owner.')`,
			user_posts_table = `CREATE TABLE IF NOT EXISTS user_posts (

							'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
							'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
							'post_id' INTEGER PRIMARY KEY AUTOINCREMENT,
							'user_id' TEXT,
							'channel_id' TEXT,
							'guild_id' TEXT,
							'url' TEXT,
							'caption' TEXT,
							'total_likes' INTEGER DEFAULT 0,
							'recently_liked_by' TEXT,
				 
							FOREIGN KEY(user_id)
							REFERENCES users(user_id)
								 ON DELETE CASCADE
								 ON UPDATE CASCADE
				 
							)`,


		]

		logger.info(`Verifing all tables that are requirred are present. This may take a while...`)
		for (table in TABLES) {
			await this._query(table, `run`, [])
		}

		logger.info(`All Table that are requirred have been verified`)
	}
}

module.exports = Database