# Simple password hashing using SHA256 for development/testing
# WARNING: This is less secure than bcrypt but will work for local development

from hashlib import sha256

def hash_password(password: str) -> str:
    """Hash password using SHA256 (development only)"""
    return sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(plain_password) == hashed_password

# Create admin user
import sqlite3

conn = sqlite3.connect('backend/portfolio.db')
cursor = conn.cursor()

# Create tables
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

# Delete existing admin
cursor.execute('DELETE FROM users WHERE username = ?', ('admin',))

# Create new admin
hashed_pw = hash_password('admin')
cursor.execute('INSERT INTO users (username, hashed_password) VALUES (?, ?)', ('admin', hashed_pw))

conn.commit()
print("✅ Admin user created successfully!")
print("   Username: admin")
print("   Password: admin")
print(f"   Hash: {hashed_pw}")
conn.close()
