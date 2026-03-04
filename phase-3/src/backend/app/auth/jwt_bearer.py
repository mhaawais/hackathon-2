import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, status

# Cache the JWKS client to avoid fetching keys on every request
_jwks_client: PyJWKClient | None = None


def _get_jwks_client(frontend_url: str) -> PyJWKClient:
    """Get or create a cached JWKS client."""
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"{frontend_url}/api/auth/jwks"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_client


def verify_token(token: str, secret: str, frontend_url: str = "http://localhost:3000") -> str:
    """Decode and verify a JWT token using JWKS public keys from Better Auth.

    Falls back to HS256 shared secret verification for test tokens.
    Returns the user_id (sub claim) from the token payload.
    Raises HTTPException(401) on any verification failure.
    """
    # First try JWKS verification (production path — tokens from Better Auth JWT plugin)
    try:
        client = _get_jwks_client(frontend_url)
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["EdDSA", "RS256", "ES256"],
            audience=frontend_url,
            issuer=frontend_url,
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )
        return user_id
    except (jwt.InvalidTokenError, Exception):
        pass

    # Fallback: HS256 verification (for tests using shared secret)
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject",
        )

    return user_id
