export interface SignupPayload {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface RegisteredUser {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SignupResponse {
  message: string;
  user: RegisteredUser;
}

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000';

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    let errorMessage = 'Đã có lỗi xảy ra khi tạo tài khoản.';

    if (errorData && typeof errorData.detail === 'string') {
      errorMessage = errorData.detail;
    } else if (errorData && Array.isArray(errorData.detail)) {
      errorMessage = errorData.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ') || errorMessage;
    }

    throw new ApiError(errorMessage, response.status, typeof errorData?.detail === 'string' ? errorData.detail : undefined);
  }

  return response.json();
}
