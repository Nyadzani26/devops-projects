# Pydantic models for request validation

from pydantic import BaseModel, HttpUrl, constr
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: constr(strip_whitespace=True, min_length=3, max_length=50)

class UserCreate(UserBase):
    password: constr(min_length=6)

class UserOut(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class CertificateBase(BaseModel):
    title: constr(strip_whitespace=True, min_length=2, max_length=200)
    issuer: constr(strip_whitespace=True, min_length=2, max_length=200)
    issue_date: datetime
    expiry_date: Optional[datetime] = None
    credential_id: Optional[str] = None
    verify_url: Optional[HttpUrl] = None
    tags: Optional[str] = None # e.g AWS, CLOUD, DevOps etc.

class CertificateCreate(CertificateBase):
    # The image will be uploaded via the form data
    pass

class CertificateUpdate(BaseModel):
    # all fields optional for PATCH-like updates
    title: Optional[constr(strip_whitespace=True, min_length=2, max_length=200)] = None
    issuer: Optional[constr(strip_whitespace=True, min_length=2, max_length=200)] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    credential_id: Optional[str] = None
    verify_url: Optional[HttpUrl] = None
    tags: Optional[str] = None

class CertificateOut(CertificateBase):
    id: int
    image_path: str
    created_at: datetime

    class Config:
        orm_mode = True

class CertificateList(BaseModel):
    total: int
    items: List[CertificateOut]