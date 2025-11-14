import os, sys
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

from app.database import SessionLocal, Base, engine
from app.models import User
from app.auth import get_password_hash

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            u = User(username="admin", hashed_password=get_password_hash("admin"))
            db.add(u)
            db.commit()
            print("Seeded default admin: admin/admin")
        else:
            print("Admin already exists")
    finally:
        db.close()

if __name__ == "__main__":
    seed()