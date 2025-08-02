from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import shutil
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create directories for data and uploads
DATA_DIR = ROOT_DIR / "data"
UPLOADS_DIR = ROOT_DIR / "uploads"
DATA_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)

# File paths
POSTS_FILE = DATA_DIR / "posts.json"
USERS_FILE = DATA_DIR / "users.json"
CONFIG_FILE = DATA_DIR / "config.json"

# Security
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Models
class BlogPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    content: str
    excerpt: str
    featured_image: Optional[str] = None
    author: str = "Admin"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published: bool = False
    tags: List[str] = []
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class BlogPostCreate(BaseModel):
    title: str
    content: str
    excerpt: str
    featured_image: Optional[str] = None
    published: bool = False
    tags: List[str] = []
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    published: Optional[bool] = None
    tags: Optional[List[str]] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Utility functions
def load_json_file(file_path: Path) -> list:
    if file_path.exists():
        with open(file_path, 'r') as f:
            return json.load(f)
    return []

def save_json_file(file_path: Path, data: list):
    with open(file_path, 'w') as f:
        json.dump(data, f, default=str, indent=2)

def create_slug(title: str) -> str:
    """Create a URL-friendly slug from title"""
    import re
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    return slug.strip('-')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def authenticate_user(username: str, password: str):
    users = load_json_file(USERS_FILE)
    user = next((u for u in users if u["username"] == username), None)
    if not user or not verify_password(password, user["password"]):
        return False
    return user

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    users = load_json_file(USERS_FILE)
    user = next((u for u in users if u["username"] == username), None)
    if user is None:
        raise credentials_exception
    return user

# Initialize default admin user if not exists
def init_default_user():
    users = load_json_file(USERS_FILE)
    if not users:
        default_user = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password": get_password_hash("admin123"),
            "created_at": datetime.utcnow().isoformat()
        }
        save_json_file(USERS_FILE, [default_user])

# Initialize on startup
init_default_user()

# Routes
@api_router.post("/login", response_model=Token)
async def login(login_request: LoginRequest):
    user = authenticate_user(login_request.username, login_request.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/posts", response_model=List[BlogPost])
async def get_posts(published_only: bool = True):
    posts = load_json_file(POSTS_FILE)
    if published_only:
        posts = [p for p in posts if p.get("published", False)]
    # Sort by created_at desc
    posts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return posts

@api_router.get("/posts/{slug}")
async def get_post_by_slug(slug: str):
    posts = load_json_file(POSTS_FILE)
    post = next((p for p in posts if p["slug"] == slug), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@api_router.get("/admin/posts", response_model=List[BlogPost])
async def get_admin_posts(current_user: dict = Depends(get_current_user)):
    posts = load_json_file(POSTS_FILE)
    posts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return posts

@api_router.post("/admin/posts", response_model=BlogPost)
async def create_post(post_data: BlogPostCreate, current_user: dict = Depends(get_current_user)):
    posts = load_json_file(POSTS_FILE)
    
    # Create slug from title
    slug = create_slug(post_data.title)
    
    # Ensure slug is unique
    existing_slugs = [p["slug"] for p in posts]
    original_slug = slug
    counter = 1
    while slug in existing_slugs:
        slug = f"{original_slug}-{counter}"
        counter += 1
    
    # Create new post
    new_post = BlogPost(
        slug=slug,
        **post_data.dict()
    )
    
    posts.append(new_post.dict())
    save_json_file(POSTS_FILE, posts)
    return new_post

@api_router.put("/admin/posts/{post_id}", response_model=BlogPost)
async def update_post(post_id: str, post_data: BlogPostUpdate, current_user: dict = Depends(get_current_user)):
    posts = load_json_file(POSTS_FILE)
    post_index = next((i for i, p in enumerate(posts) if p["id"] == post_id), None)
    
    if post_index is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Update post
    post = posts[post_index]
    update_data = post_data.dict(exclude_unset=True)
    
    # Update slug if title changed
    if "title" in update_data:
        new_slug = create_slug(update_data["title"])
        existing_slugs = [p["slug"] for i, p in enumerate(posts) if i != post_index]
        original_slug = new_slug
        counter = 1
        while new_slug in existing_slugs:
            new_slug = f"{original_slug}-{counter}"
            counter += 1
        update_data["slug"] = new_slug
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    post.update(update_data)
    
    save_json_file(POSTS_FILE, posts)
    return BlogPost(**post)

@api_router.delete("/admin/posts/{post_id}")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    posts = load_json_file(POSTS_FILE)
    post_index = next((i for i, p in enumerate(posts) if p["id"] == post_id), None)
    
    if post_index is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    posts.pop(post_index)
    save_json_file(POSTS_FILE, posts)
    return {"message": "Post deleted successfully"}

class ImageUploadRequest(BaseModel):
    image_url: str

@api_router.post("/admin/upload-image")
async def upload_image(file: UploadFile = File(None), current_user: dict = Depends(get_current_user)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOADS_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return URL
    return {"url": f"/uploads/{unique_filename}"}

@api_router.post("/admin/save-image-url")
async def save_image_url(image_data: ImageUploadRequest, current_user: dict = Depends(get_current_user)):
    # Validate URL format
    if not image_data.image_url.startswith(('http://', 'https://')):
        raise HTTPException(status_code=400, detail="Invalid URL format")
    
    # Return the URL directly for external images
    return {"url": image_data.image_url}

@api_router.get("/")
async def root():
    return {"message": "Personal Blog API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)