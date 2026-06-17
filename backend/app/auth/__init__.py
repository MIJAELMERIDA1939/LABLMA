# Auth module
from app.auth.router import router as auth_router
from app.auth.dependencies import get_current_user, require_role
