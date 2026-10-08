from fastapi import APIRouter, HTTPException, status
from psycopg.errors import UniqueViolation

from app.auth.email import send_verification_email
from app.auth.password import hash_password
from app.auth.schemas import (
    LoginRequest,
    ResendVerificationRequest,
    SignupRequest,
    SignupResponse,
    TokenResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from app.auth.service import (
    AuthServiceUnavailable,
    authenticate_user,
    create_access_token,
    create_verification_token,
    verify_email_token,
)
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
                            password_hash,
                            status
                        )
                        VALUES (%s, %s, %s, %s, 'INACTIVE')
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

                    # Generate and dispatch verification email
                    try:
                        token = create_verification_token(request.email)
                        send_verification_email(request.email, request.full_name, token)
                    except AuthServiceUnavailable:
                        pass

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


@router.post("/verify-email", response_model=VerifyEmailResponse)
def verify_email(request: VerifyEmailRequest) -> VerifyEmailResponse:
    try:
        email = verify_email_token(request.token)
    except AuthServiceUnavailable:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dịch vụ xác thực tạm thời không khả dụng.",
        ) from None

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Liên kết xác nhận không hợp lệ hoặc đã hết hạn.",
        )

    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT user_id, status
                    FROM public.users
                    WHERE email = %s
                    """,
                    (email,),
                )
                user = cursor.fetchone()

                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Không tìm thấy tài khoản với email này.",
                    )

                user_id, current_status = user[0], user[1]
                if current_status == "ACTIVE":
                    return VerifyEmailResponse(
                        message="Tài khoản của bạn đã được kích hoạt trước đó.",
                        email=email,
                    )

                cursor.execute(
                    """
                    UPDATE public.users
                    SET status = 'ACTIVE',
                        email_confirmed_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                    """,
                    (user_id,),
                )
                connection.commit()

                return VerifyEmailResponse(
                    message="Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.",
                    email=email,
                )
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể xác thực tài khoản lúc này.",
        ) from error


@router.post("/resend-verification", response_model=VerifyEmailResponse)
def resend_verification(request: ResendVerificationRequest) -> VerifyEmailResponse:
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT user_id, full_name, status
                    FROM public.users
                    WHERE email = %s
                    """,
                    (request.email,),
                )
                user = cursor.fetchone()

                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Không tìm thấy tài khoản với email này.",
                    )

                user_id, full_name, current_status = user[0], user[1], user[2]
                if current_status == "ACTIVE":
                    return VerifyEmailResponse(
                        message="Tài khoản của bạn đã được kích hoạt trước đó.",
                        email=request.email,
                    )

                token = create_verification_token(request.email)
                send_verification_email(request.email, full_name, token)

                return VerifyEmailResponse(
                    message="Email xác nhận mới đã được gửi tới hộp thư của bạn.",
                    email=request.email,
                )
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể gửi lại email xác nhận.",
        ) from error

