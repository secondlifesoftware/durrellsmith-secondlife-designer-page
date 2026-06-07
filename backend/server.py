from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import time
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone
import requests


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)

    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])

    return status_checks


# ---------------------------------------------------------------------------
# Behance proxy — server-side fetch of a user's public profile page, parses
# out the project list, and serves it as JSON to the frontend. This bypasses
# Behance's CORS block and lets the UX Design fleet auto-update whenever the
# user publishes a new Behance project.
#
# Behance has no public API or RSS for project listings, but their profile
# HTML embeds the project links + cover image URLs for SEO. We scrape that
# server-side (no CORS issues) and cache for 10 minutes so we're polite to
# Behance and snappy to our visitors.
# ---------------------------------------------------------------------------

_BEHANCE_CACHE: Dict[str, Dict[str, Any]] = {}
_BEHANCE_CACHE_TTL_S = 600  # 10 minutes

_GALLERY_LINK_RE = re.compile(r"/gallery/(\d{6,12})/([A-Za-z0-9_-]+)")


def _behance_image_re(project_id: str) -> re.Pattern:
    return re.compile(
        r"https://mir-s3-cdn-cf\.behance\.net/projects/404/[a-z0-9]+"
        + re.escape(project_id)
        + r"\.[A-Za-z0-9_-]+\.(?:png|jpe?g|webp)",
        re.IGNORECASE,
    )


def _scrape_behance_profile(username: str) -> List[Dict[str, str]]:
    """Fetch the user's public Behance profile HTML and parse out projects."""
    url = f"https://www.behance.net/{username}"
    headers = {
        # Behance returns 400 for plain curl-style requests; a real browser
        # UA gets through.
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    resp = requests.get(url, headers=headers, timeout=12)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Behance returned {resp.status_code}",
        )
    html = resp.text

    by_id: Dict[str, Dict[str, str]] = {}
    for m in _GALLERY_LINK_RE.finditer(html):
        pid, slug = m.group(1), m.group(2)
        if pid in by_id:
            continue
        by_id[pid] = {
            "id": pid,
            "slug": slug,
            "title": slug.replace("-", " "),
            "link": f"https://www.behance.net/gallery/{pid}/{slug}",
            "img": "",
        }

    for project in by_id.values():
        img_match = _behance_image_re(project["id"]).search(html)
        if img_match:
            project["img"] = img_match.group(0)

    return list(by_id.values())


@api_router.get("/behance/{username}")
async def get_behance_projects(username: str):
    """Return the project list for a Behance user, with 10-minute caching."""
    # Light validation — only allow Behance-style usernames.
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", username):
        raise HTTPException(status_code=400, detail="invalid username")

    now = time.time()
    cached = _BEHANCE_CACHE.get(username)
    if cached and (now - cached["fetched_at"]) < _BEHANCE_CACHE_TTL_S:
        return {
            "username": username,
            "projects": cached["projects"],
            "cached": True,
            "fetched_at": cached["fetched_at"],
        }

    try:
        projects = _scrape_behance_profile(username)
    except HTTPException:
        # If we have a stale cache, serve that rather than failing
        if cached:
            return {
                "username": username,
                "projects": cached["projects"],
                "cached": True,
                "stale": True,
                "fetched_at": cached["fetched_at"],
            }
        raise
    except requests.RequestException as exc:
        logger.warning("Behance fetch failed for %s: %s", username, exc)
        if cached:
            return {
                "username": username,
                "projects": cached["projects"],
                "cached": True,
                "stale": True,
                "fetched_at": cached["fetched_at"],
            }
        raise HTTPException(status_code=502, detail="behance unreachable")

    _BEHANCE_CACHE[username] = {
        "projects": projects,
        "fetched_at": now,
    }
    return {
        "username": username,
        "projects": projects,
        "cached": False,
        "fetched_at": now,
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()