from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.jwt_bearer import verify_token
from app.config import settings

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """FastAPI dependency that extracts and verifies the JWT from the Authorization header.

    Returns the user_id string.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    return verify_token(credentials.credentials, settings.BETTER_AUTH_SECRET, settings.FRONTEND_URL, settings.BETTER_AUTH_URL)
