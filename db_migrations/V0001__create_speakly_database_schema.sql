-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    banner_url TEXT,
    bio TEXT,
    status TEXT,
    status_emoji VARCHAR(10),
    is_online BOOLEAN DEFAULT FALSE,
    ghost_mode BOOLEAN DEFAULT FALSE,
    has_verification BOOLEAN DEFAULT FALSE,
    balance DECIMAL(10, 2) DEFAULT 0,
    raccoon_coins INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица чатов
CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('private', 'group', 'channel', 'saved')),
    name VARCHAR(100),
    avatar_url TEXT,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Участники чатов
CREATE TABLE IF NOT EXISTS chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    is_blocked BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_id, user_id)
);

-- Сообщения
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    sender_id INTEGER REFERENCES users(id),
    reply_to INTEGER REFERENCES messages(id),
    content TEXT,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text', 'voice', 'video', 'photo', 'sticker', 'gift', 'money', 'circle')),
    file_url TEXT,
    duration INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Реакции на сообщения
CREATE TABLE IF NOT EXISTS message_reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id),
    user_id INTEGER REFERENCES users(id),
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

-- Друзья
CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    friend_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
);

-- Подарки в магазине
CREATE TABLE IF NOT EXISTS shop_gifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    price INTEGER NOT NULL,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- Подарки пользователей
CREATE TABLE IF NOT EXISTS user_gifts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    gift_id INTEGER REFERENCES shop_gifts(id),
    sender_id INTEGER REFERENCES users(id),
    quantity INTEGER DEFAULT 1,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Стикеры
CREATE TABLE IF NOT EXISTS stickers (
    id SERIAL PRIMARY KEY,
    created_by INTEGER REFERENCES users(id),
    image_url TEXT NOT NULL,
    name VARCHAR(100),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Плейлисты музыки
CREATE TABLE IF NOT EXISTS music_playlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Треки в плейлистах
CREATE TABLE IF NOT EXISTS playlist_tracks (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER REFERENCES music_playlists(id),
    track_id VARCHAR(100) NOT NULL,
    track_name VARCHAR(200) NOT NULL,
    artist VARCHAR(200),
    duration INTEGER,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Транзакции
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER REFERENCES users(id),
    to_user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('money', 'gift', 'raccoon_coins')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SMS коды для регистрации
CREATE TABLE IF NOT EXISTS sms_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Звонки
CREATE TABLE IF NOT EXISTS calls (
    id SERIAL PRIMARY KEY,
    caller_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    call_type VARCHAR(20) CHECK (call_type IN ('voice', 'video')),
    status VARCHAR(20) CHECK (status IN ('ringing', 'active', 'ended', 'missed', 'declined')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration INTEGER
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_chat_id ON chat_members(chat_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gifts_user_id ON user_gifts(user_id);

-- Начальные данные для магазина подарков
INSERT INTO shop_gifts (name, emoji, price, category) VALUES
('Роза', '🌹', 100, 'flowers'),
('Букет роз', '💐', 500, 'flowers'),
('Сердце', '❤️', 50, 'love'),
('Кольцо', '💍', 5000, 'jewelry'),
('Торт', '🎂', 200, 'food'),
('Шампанское', '🍾', 300, 'drinks'),
('Подарок', '🎁', 150, 'gifts'),
('Плюшевый мишка', '🧸', 400, 'toys'),
('Звезда', '⭐', 1000, 'premium'),
('Корона', '👑', 10000, 'premium'),
('Бриллиант', '💎', 50000, 'premium'),
('Ракета', '🚀', 2000, 'special'),
('Огонь', '🔥', 100, 'special'),
('Енот', '🦝', 500, 'animals'),
('Единорог', '🦄', 3000, 'fantasy')
ON CONFLICT DO NOTHING;