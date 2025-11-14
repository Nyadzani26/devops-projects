# Database connection and configurations
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite database URL (for the portfolio database)
SQLALCHEMY_DATABASE_URL = "sqlite:///./portfolio.db"

# Create the database engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

# Create sessionmaker for the database
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for the models
Base = declarative_base()

# Dependency for db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

        