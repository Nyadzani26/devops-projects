import os, sys
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from app.database import SessionLocal, Base, engine
from app.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Delete existing admin if exists
        db.query(User).filter(User.username == "admin").delete()
        db.commit()
        
        # Create new admin with properly hashed password
        password = "admin123"
        hashed = pwd_context.hash(password)
        
        u = User(username="admin", hashed_password=hashed)
        db.add(u)
        db.commit()
        print(f"✅ Admin user created successfully!")
        print(f"   Username: admin")
        print(f"   Password: admin123")
        print(f"   Hash (first 50 chars): {hashed[:50]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()