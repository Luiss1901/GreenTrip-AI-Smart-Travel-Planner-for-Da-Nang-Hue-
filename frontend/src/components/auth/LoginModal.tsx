import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess?: () => void;
}

// Mock "database" - team backend sẽ thay bằng API thật
const MOCK_USERS: Record<string, string> = {
  'admin@gmail.com': '1111',
};

type Step = 'email' | 'login' | 'register';

export default function LoginModal({ isOpen, onClose, onRegisterSuccess }: LoginModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('email');
        setEmail('');
        setPassword('');
        setError('');
        setAttemptedSubmit(false);
      }, 300);
    }
  }, [isOpen]);

  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const handleContinue = () => {
    setError('');
    setAttemptedSubmit(true);
    
    if (step === 'email') {
      if (!email || !email.includes('@')) {
        setError('Vui lòng nhập email hợp lệ.');
        return;
      }
      setAttemptedSubmit(false);
      if (MOCK_USERS[email.toLowerCase()]) {
        setStep('login');
      } else {
        setStep('register');
      }
    } else if (step === 'login') {
      const correctPass = MOCK_USERS[email.toLowerCase()];
      if (password === correctPass) {
        onClose();
        alert('Đăng nhập thành công! ✅');
      } else {
        setError('Mật khẩu không đúng, vui lòng thử lại.');
      }
    } else if (step === 'register') {
      if (!hasUppercase || !hasNumber || !hasSymbol) {
        return;
      }
      onClose();
      if (onRegisterSuccess) {
        onRegisterSuccess();
      } else {
        alert('Đăng ký thành công! ✅');
      }
    }
  };

  if (!isOpen || !mounted) return null;

  const isLogin = step === 'login';
  const isRegister = step === 'register';
  const isEmailStep = step === 'email';
  const showPasswordErrors = isRegister && attemptedSubmit && (!hasUppercase || !hasNumber || !hasSymbol);


  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[3px] animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[506px] rounded-[28px] bg-white px-10 pt-10 pb-8 shadow-2xl animate-fadeInScale">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-gray-400 hover:text-black transition-colors text-xl leading-none p-1"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Emoji */}
        <div className="mb-3 text-3xl">👋</div>

        {/* Title — BOLD (kiểu chữ đậm) */}
        <h2 className="font-heading text-[1.75rem] font-extrabold tracking-tight text-black leading-tight">
          {isEmailStep && 'Welcome to GreenTrip'}
          {isLogin && 'Chào mừng trở lại!'}
          {isRegister && 'Tạo tài khoản'}
        </h2>

        {/* Subtitle — LIGHT (kiểu chữ mỏng) */}
        {(isLogin || isRegister) && (
          <p className="mt-1 mb-5 text-[14px] font-light text-gray-500">
            {isLogin ? 'Nhập mật khẩu để tiếp tục.' : 'Đăng ký GreenTrip nhanh chóng và miễn phí.'}
          </p>
        )}

        <div className={isEmailStep ? 'mt-6' : 'mt-0'}>
          {/* Email chip or input */}
          {isEmailStep ? (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
              className="w-full rounded-full border border-gray-300 px-5 py-3.5 text-[15px] font-light text-gray-900 placeholder:text-gray-400 placeholder:font-light focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all mb-3"
            />
          ) : (
            <div className="flex items-center justify-between rounded-full border border-gray-200 bg-gray-50 px-5 py-3 mb-3">
              {/* Email shown — treat as label/caption → font-light */}
              <span className="text-[14px] font-light text-gray-700">{email}</span>
              {/* Action word → font-bold */}
              <button
                onClick={() => { setStep('email'); setPassword(''); setError(''); }}
                className="text-[13px] font-bold text-gray-500 hover:text-black transition-colors ml-4"
              >
                Đổi
              </button>
            </div>
          )}

          {/* Password input */}
          {(isLogin || isRegister) && (
            <div className="relative mb-2">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                autoFocus
                className={`w-full rounded-full border px-5 py-3.5 pr-12 text-[15px] font-light text-gray-900 placeholder:text-gray-400 placeholder:font-light focus:outline-none transition-all ${
                  showPasswordErrors 
                    ? 'border-[#E25C43] focus:border-[#E25C43] focus:ring-1 focus:ring-[#E25C43]' 
                    : 'border-gray-300 focus:border-black focus:ring-1 focus:ring-black'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {/* Registration Error Messages */}
          {showPasswordErrors && (
            <div className="mb-4 px-2 text-[13.5px] font-light text-[#E25C43] flex flex-col gap-1">
              {!hasUppercase && <span>Phải chứa ít nhất một chữ cái viết hoa.</span>}
              {!hasNumber && <span>Phải chứa ít nhất một số</span>}
              {!hasSymbol && <span>Phải chứa ít nhất một ký hiệu</span>}
            </div>
          )}

          {/* Login Error — LIGHT (ghi chú nhỏ) */}
          {error && (
            <p className="mb-4 mt-2 text-[13.5px] font-light text-red-500 px-2">{error}</p>
          )}

          {/* CTA Button — BOLD */}
          <button
            onClick={handleContinue}
            className={`w-full rounded-full bg-black px-5 py-3.5 text-[15px] font-bold text-white transition-colors ${
              (isEmailStep || !showPasswordErrors) ? 'hover:bg-gray-900' : 'opacity-90 hover:bg-gray-900'
            }`}
          >
            {isEmailStep ? 'Tiếp tục' : isLogin ? 'Đăng nhập' : 'Tiếp tục'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-5">
          <div className="h-px flex-1 bg-gray-200" />
          {/* "hoặc" — LIGHT */}
          <span className="text-sm font-light text-gray-500">hoặc</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Google button — label BOLD */}
        <button className="flex items-center justify-center gap-3 w-full rounded-full border border-gray-300 bg-white px-6 py-3.5 text-[14px] font-bold text-black hover:bg-gray-50 transition-colors mb-6">
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Legal text — LIGHT (chú thích nhỏ) */}
        <p className="text-center text-[11px] font-light leading-relaxed text-gray-400">
          Bằng cách tiếp tục, bạn đồng ý với{' '}
          <a href="#" className="underline hover:text-black">Điều khoản dịch vụ</a>
          {' '}của GreenTrip và xác nhận rằng bạn đã đọc{' '}
          <a href="#" className="underline hover:text-black">Chính sách bảo mật</a> của chúng tôi.
        </p>
      </div>
    </div>,
    document.body
  );
}
