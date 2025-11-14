import sys
import os
from datetime import datetime
from sqlalchemy.orm import Session

# Add the project root to the Python path (one level up from this file)
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

# Import app modules
from app.database import engine, SessionLocal, Base
from app.models import User, Certificates

def test_database_connection():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database connection successful!")
        print("✅ Tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_add_user():
    db = SessionLocal()
    try:
        test_user = User(
            username="testadmin",
            hashed_password="hashedpassword123"
        )
        db.add(test_user)
        db.commit()
        print("✅ Test user added successfully!")
        return True
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to add test user: {e}")
        return False
    finally:
        db.close()

def test_add_certificate():
    db = SessionLocal()
    try:
        test_cert = Certificates(
            title="AWS Certified Solutions Architect",
            issuer="Amazon Web Services",
            issue_date=datetime.now(),
            expiry_date=datetime(2025, 12, 31),
            credential_id="AWS12345678",
            verify_url="https://aws.amazon.com/certification/",
            image_path="static/certificates/aws_cert.jpg",
            tags="aws,cloud,devops"
        )
        db.add(test_cert)
        db.commit()
        print("✅ Test certificate added successfully!")
        return True
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to add test certificate: {e}")
        return False
    finally:
        db.close()

def run_tests():
    print("\n🔍 Running database tests...\n")
    os.makedirs("static/certificates", exist_ok=True)

    if not test_database_connection():
        return

    print("\nTesting user creation...")
    test_add_user()

    print("\nTesting certificate creation...")
    test_add_certificate()

    print("\n✅ All tests completed!")

if __name__ == "__main__":
    run_tests()