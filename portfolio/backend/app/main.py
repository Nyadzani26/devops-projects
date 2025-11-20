# This is the FASTAPI application entry point

import os, uuid, shutil
from datetime import datetime, timedelta, date
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import File, UploadFile
from sqlalchemy.orm import Session
from starlette.staticfiles import StaticFiles


from app.database import Base, engine, SessionLocal
from app import models, schemas
from app.auth import authenticate_user, create_access_token, get_current_user
from app.config import settings

# Creating tables at startup (idempotent)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Portfolio Backend", version="1.0.0")
os.makedirs("static/certificates", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",  # VS Code Live Server
        "http://127.0.0.1:5500",
        "http://localhost:3000",  # Alternative dev port
        "https://nyadzani26.github.io"  # Production GitHub Pages
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/me", response_model=schemas.UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
}
ALLOWED_EXTS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_MB = 10
MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

def _parse_date(value: str) -> datetime:
    """Accepts 'YYYY-MM-DD' or full ISO datetime. Returns datetime at midnight if date-only."""
    if value is None:
        return None
    v = value.strip()
    if not v:
        return None
    # Try date-only first
    try:
        d = date.fromisoformat(v)
        return datetime(d.year, d.month, d.day)
    except Exception:
        pass
    # Fallback to full datetime
    try:
        return datetime.fromisoformat(v)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD or ISO datetime.")

@app.post("/api/certificates", response_model=schemas.CertificateOut)
def create_certificate(
    title: str,
    issuer: str,
    issue_date: str,
    expiry_date: Optional[str] = None,
    credential_id: Optional[str] = None,
    verify_url: Optional[str] = None,
    tags: Optional[str] = None,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # validating content types
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type. Upload PDF or JPG/PNG/WEBP")

    # Safe unique file
    ext = os.path.splitext(image.filename)[1].lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail="Unsupported file extension. Allowed: pdf, jpg, jpeg, png, webp")

    unique_name = f"{uuid.uuid4().hex}{ext}"
    relative_path = os.path.join("static", "certificates", unique_name)
    abs_path = os.path.join(os.getcwd(), relative_path)

    #save the file
    with open(abs_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # Coerce dates
    _issue_dt = _parse_date(issue_date)
    _expiry_dt = _parse_date(expiry_date) if expiry_date is not None else None

    if _issue_dt is None:
        raise HTTPException(status_code=400, detail="issue_date is required (YYYY-MM-DD)")
    if _expiry_dt is not None and _expiry_dt < _issue_dt:
        raise HTTPException(status_code=400, detail="expiry_date cannot be earlier than issue_date")

    cert = models.Certificates(
        title=title.strip(),
        issuer=issuer.strip(),
        issue_date=_issue_dt,
        expiry_date=_expiry_dt,
        credential_id = credential_id.strip() if credential_id else None,
        verify_url = verify_url.strip() if verify_url else None,
        image_path = relative_path.replace("\\", "/"),
        tags = tags.strip() if tags else None,
    )

    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert

@app.get("/api/certificates", response_model=List[schemas.CertificateOut])
def list_certificates(
    skip: int = 0,
    limit: int = 50,
    issuer: Optional[str] = None,
    tag: Optional[str] = None,
    q: Optional[str] = None,  # search in title
    db: Session = Depends(get_db)
):
    query = db.query(models.Certificates)

    if issuer:
        query = query.filter(models.Certificates.issuer.ilike(f"%{issuer.strip()}%"))
    if tag:
        # simple contains on comma-separated tags
        query = query.filter(models.Certificates.tags.ilike(f"%{tag.strip()}%"))
    if q:
        query = query.filter(models.Certificates.title.ilike(f"%{q.strip()}%"))

    # newest first
    query = query.order_by(models.Certificates.id.desc())

    items = query.offset(skip).limit(limit).all()
    return items

@app.patch("/api/certificates/{cert_id}", response_model=schemas.CertificateOut)
def update_certificate(
    cert_id: int,
    payload: schemas.CertificateUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cert = db.query(models.Certificates).filter(models.Certificates.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Applying partial updates
    if payload.title is not None:
        cert.title = payload.title.strip()
    if payload.issuer is not None:
        cert.issuer = payload.issuer.strip()
    if payload.issue_date is not None:
        cert.issue_date = payload.issue_date
    if payload.expiry_date is not None:
        cert.expiry_date = payload.expiry_date
    if payload.credential_id is not None:
        cert.credential_id = payload.credential_id.strip() if payload.credential_id else None
    if payload.verify_url is not None:
        cert.verify_url = payload.verify_url
    if payload.tags is not None:
        cert.tags = payload.tags.strip() if payload.tags else None

    db.commit()
    db.refresh(cert)
    return cert

@app.delete("/api/certificates/{cert_id}")
def delete_certificate(
    cert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cert = db.query(models.Certificates).filter(models.Certificates.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # try to delete the file on disk or ignore if it is missing
    try:
        if cert.image_path:
            abs_path = os.path.join(os.getcwd(), cert.image_path)
            if os.path.exists(abs_path):
                os.remove(abs_path)
    except Exception:
        pass

    db.delete(cert)
    db.commit()
    return {"status": "deleted"}

@app.put("/api/certificates/{cert_id}/file", response_model=schemas.CertificateOut)
def replace_certificate_file(
    cert_id: int,
    new_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cert = db.query(models.Certificates).filter(models.Certificates.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # validate content-type and extension
    if new_file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type. Upload PDF or JPG/PNG/WEBP")
    
    ext = os.path.splitext(new_file.filename)[1].lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail="Unsupported file extension")

    # delete old files if they exist
    try:
        if cert.image_path:
            old_abs = os.path.join(os.getcwd(), cert.image_path)
            if os.path.exists(old_abs):
                os.remove(old_abs)
    except Exception:
        pass

    # save the new file
    unique_name = f"{uuid.uuid4().hex}{ext}"
    relative_path = os.path.join("static", "certificates", unique_name)
    abs_path = os.path.join(os.getcwd(), relative_path)
    with open(abs_path, "wb") as buffer:
        shutil.copyfileobj(new_file.file, buffer)

    cert.image_path = relative_path.replace("\\", "/")
    db.commit()
    db.refresh(cert)
    return cert
