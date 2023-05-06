
--  Log branches (independent/unlinked)
CREATE TABLE commands_log (
  log_id SERIAL PRIMARY KEY,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT,
  channel_id TEXT,
  guild_id TEXT,
  command_alias TEXT,
  resolved_in TEXT,
  FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (guild_id) REFERENCES guilds (guild_id) ON DELETE CASCADE ON UPDATE CASCADE
)
CREATE TABLE resource_log (
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    log_id SERIAL PRIMARY KEY,
    uptime INTEGER,
    ping REAL,
    cpu REAL,
    memory REAL
)
CREATE TABLE quest_log (
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quest_id INTEGER,
    user_id TEXT,
    guild_id TEXT,
    answer TEXT,
    PRIMARY KEY (quest_id, user_id, guild_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (quest_id) REFERENCES quests(quest_id) ON DELETE CASCADE ON UPDATE CASCADE
)


--  User branches
CREATE TABLE users (
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT PRIMARY KEY,
    name TEXT,
    bio TEXT DEFAULT 'Hi! I''m a new user!',
    verified INTEGER DEFAULT 0,
    lang TEXT DEFAULT 'en',
    receive_notification INTEGER DEFAULT -1
)
CREATE TABLE user_dailies (
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT,
  total_streak INTEGER DEFAULT 0,
  guild_id TEXT,
  PRIMARY KEY(user_id, guild_id),
  FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
  FOREIGN KEY(guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE ON UPDATE CASCADE
)
CREATE TABLE user_exp (
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    current_exp INTEGER DEFAULT 0,
    booster_id INTEGER,
    booster_activated_at TIMESTAMP,
    guild_id TEXT,
    PRIMARY KEY(user_id, guild_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(booster_id) REFERENCES items(item_id) ON DELETE CASCADE ON UPDATE CASCADE
    FOREIGN KEY(guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE ON UPDATE CASCADE
)
CREATE TABLE user_reputations (
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_giving_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT,
  total_reps INTEGER DEFAULT 0,
  recently_received_by TEXT,
  guild_id TEXT,
  PRIMARY KEY(user_id, guild_id),
  FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
  FOREIGN KEY(recently_received_by) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
  FOREIGN KEY(guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE ON UPDATE CASCADE
)
CREATE TABLE user_inventories (
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    item_id INTEGER,
    quantity INTEGER DEFAULT 0,
    in_use INTEGER DEFAULT 0,
    guild_id TEXT,
    PRIMARY KEY(user_id, item_id, guild_id),
    FOREIGN KEY(item_id) REFERENCES items(item_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
)
CREATE TABLE user_relationships (
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id_a TEXT,
    user_id_b TEXT,
    relationship_id TEXT,
    guild_id TEXT,
    PRIMARY KEY(user_id_a, user_id_b, guild_id),
    FOREIGN KEY(user_id_a) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(user_id_b) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(relationship_id) REFERENCES relationships(relationship_id) ON DELETE CASCADE ON UPDATE CASCADE
)
CREATE TABLE user_quests (
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    guild_id TEXT,
    next_quest_id INTEGER,
    PRIMARY KEY(user_id, guild_id),
    FOREIGN KEY(next_quest_id)
        REFERENCES quests(quest_id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY(user_id)
        REFERENCES users(user_id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY(guild_id)
        REFERENCES guilds(guild_id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
CREATE TABLE user_reminders (
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reminder_id SERIAL PRIMARY KEY,
  user_id TEXT,
  message TEXT,
  remind_at TIMESTAMP,
  FOREIGN KEY(user_id)
    REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
)
CREATE TABLE user_self_covers (
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cover_id TEXT,
    user_id TEXT,
    guild_id TEXT,
    PRIMARY KEY(user_id, guild_id),
    FOREIGN KEY(user_id)
        REFERENCES users(user_id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY(guild_id)
        REFERENCES guilds(guild_id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
CREATE TABLE user_gender(
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT PRIMARY KEY,
    gender TEXT,
    FOREIGN KEY(user_id)
    REFERENCES users(user_id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
CREATE TABLE user_durational_buffs(
    buff_id SERIAL PRIMARY KEY,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name TEXT,
    type TEXT,
    multiplier INTEGER,
    duration INTEGER,
    user_id TEXT,
    guild_id TEXT,
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE ON UPDATE CASCADE
)


--  Guilds/server branches
CREATE TABLE guilds (
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guild_id TEXT PRIMARY KEY,
  name TEXT,
  bio TEXT
)
CREATE TABLE guild_configurations (
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    config_id SERIAL PRIMARY KEY,
    config_code TEXT,
    guild_id TEXT,
    customized_parameter TEXT,
    set_by_user_id TEXT,
    FOREIGN KEY(guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(set_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
)


--  Item branches
CREATE TABLE items (
  registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  item_id SERIAL PRIMARY KEY,
  name TEXT,
  description TEXT,
  alias TEXT,
  type_id INTEGER,
  rarity_id INTEGER,
  bind TEXT DEFAULT '0',
  usable INTEGER DEFAULT 0,
  response_on_use TEXT,
  owned_by_guild_id TEXT,

  CONSTRAINT fk_items_rarity_id
    FOREIGN KEY (rarity_id)
    REFERENCES item_rarities(rarity_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  
  CONSTRAINT fk_items_type_id
    FOREIGN KEY (type_id)
    REFERENCES item_types(type_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
)
CREATE TABLE item_gacha (
  gacha_id SERIAL PRIMARY KEY,
  item_id INTEGER,
  quantity INTEGER DEFAULT 1,
  weight REAL,
  FOREIGN KEY(item_id)
    REFERENCES items(item_id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
)
CREATE TABLE item_types (
  type_id SERIAL PRIMARY KEY,
  name TEXT,
  alias TEXT,
  max_stacks INTEGER DEFAULT 9999,
  max_use INTEGER DEFAULT 9999
)
CREATE TABLE item_rarities (
  rarity_id SERIAL PRIMARY KEY,
  name TEXT,
  level INTEGER UNIQUE,
  color TEXT DEFAULT '#000000'
)
CREATE TABLE item_effects (
  effect_id SERIAL PRIMARY KEY,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  item_id INTEGER REFERENCES items(item_id) ON UPDATE CASCADE ON DELETE CASCADE,
  guild_id TEXT REFERENCES guilds(guild_id) ON UPDATE CASCADE ON DELETE CASCADE,
  effect_ref_id INTEGER,
  parameter TEXT
)


--  Miscellaneous master with no direct name links
CREATE TABLE quests (
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  quest_id SERIAL PRIMARY KEY,
  reward_amount INTEGER,
  name TEXT,
  description TEXT,
  correct_answer TEXT
)
CREATE TABLE relationships (
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  relationship_id SERIAL PRIMARY KEY,
  name TEXT
)
CREATE TABLE affiliates (
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guild_id TEXT NOT NULL REFERENCES guilds(guild_id),
  description TEXT DEFAULT 'Another awesome server!',
  invite_link TEXT,
  notes TEXT
)
CREATE TABLE autoresponders (
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ar_id SERIAL PRIMARY KEY,
  guild_id TEXT REFERENCES guilds(guild_id),
  user_id TEXT REFERENCES users(user_id),
  trigger TEXT,
  response TEXT
)
CREATE TABLE custom_rewards (
  registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reward_id SERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL REFERENCES guilds(guild_id),
  set_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  reward TEXT NOT NULL,
  reward_name TEXT NOT NULL
)