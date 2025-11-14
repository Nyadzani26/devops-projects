# For SQLAlchemy models

from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base

class User(Base):
    """
    User model for authentication and authorization.
    - Stores admin user credentials
    - Used for JWT authentication
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Certificates(Base):
    """
    Certificates model for storing details.
    - Track all certificates that wiil be uploaded on the portfolio
    - Includes metadata and file path to the certificate image
    """

    __tablename__ = "certificates"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    issuer = Column(String, nullable=False)
    issue_date = Column(DateTime, nullable=False)
    expiry_date = Column(DateTime, nullable=True)
    credential_id = Column(String, nullable=True)       
    verify_url = Column(String, nullable=True)         
    image_path = Column(String, nullable=False)
    tags = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())