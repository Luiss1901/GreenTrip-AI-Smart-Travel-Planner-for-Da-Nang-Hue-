from fastapi import APIRouter, HTTPException, status
from psycopg.errors import UniqueViolation

from app.auth.password import hash_password
from app.auth.schemas import LoginRequest, SignupRequest, SignupResponse, TokenResponse
from app.auth.service import AuthServiceUnavailable, authenticate_user, create_access_token
from app.db.postgres import get_connection


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest) -> TokenResponse:
    try:
        user_id = authenticate_user(request.email, request.password)
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        access_token = create_access_token(user_id)
    except AuthServiceUnavailable:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable",
        ) from None

    return TokenResponse(access_token=access_token)


@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
    response_model=SignupResponse,
)
def signup(request: SignupRequest) -> dict:
    password_hash = hash_password(request.password)

    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT user_id
                    FROM public.users
                    WHERE email = %s
                    """,
                    (request.email,),
                )

                existing_user = cursor.fetchone()

                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Email is already registered.",
                    )

                try:
                    cursor.execute(
                        """
                        INSERT INTO public.users (
                            full_name,
                            email,
                            phone,
                            password_hash
                        )
                        VALUES (%s, %s, %s, %s)
                        RETURNING
                            user_id,
                            full_name,
                            email,
                            phone,
                            role,
                            status,
                            created_at,
                            updated_at
                        """,
                        (
                            request.full_name,
                            request.email,
                            request.phone,
                            password_hash,
                        ),
                    )

                    user = cursor.fetchone()
                    connection.commit()

                    return {
                        "message": "User registered successfully.",
                        "user": {
                            "user_id": str(user[0]),
                            "full_name": user[1],
                            "email": user[2],
                            "phone": user[3],
                            "role": user[4],
                            "status": user[5],
                            "created_at": user[6],
                            "updated_at": user[7],
                        },
                    }
                except UniqueViolation:
                    connection.rollback()
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Email is already registered.",
                    )

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create user.",
        ) from error
