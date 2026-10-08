import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import PasswordStrength from '@/components/ui/PasswordStrength';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import GoogleButton from '@/components/ui/GoogleButton';
import { signup, ApiError } from '@/services/auth';

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!name.trim()) e.name = 'Vui lòng nhập họ và tên';
    if (!email) e.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email không hợp lệ';
    if (!password) e.password = 'Vui lòng nhập mật khẩu';
    else if (password.length < 8) e.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!confirm) e.confirm = 'Vui lòng xác nhận mật khẩu';
    else if (confirm !== password) e.confirm = 'Mật khẩu xác nhận không khớp';
    if (!terms) e.terms = 'Vui lòng đồng ý với Điều khoản & Chính sách bảo mật';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setGeneralError(null);
    setSuccessMessage(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await signup({
        full_name: name.trim(),
        email: email.trim(),
        password,
      });

      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/login', { state: { registeredEmail: email.trim() } });
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrors((prev) => ({ ...prev, email: 'Email này đã được đăng ký tài khoản.' }));
        } else if (err.status === 422) {
          setGeneralError(err.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
        } else {
          setGeneralError(err.message || 'Không thể tạo tài khoản lúc này. Vui lòng thử lại sau.');
        }
      } else {
        setGeneralError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      image="https://picsum.photos/seed/hue_auth/1200/1600"
      imageAlt="Chùa Thiên Mụ bên sông Hương"
      slogan="Lên lịch trình riêng, đi theo cách của bạn."
      benefits={[
        'Tạo lịch trình trong 30 giây với AI gợi ý thông minh',
        'Lưu địa điểm yêu thích, dùng lại cho chuyến sau',
        'Theo dõi chỉ số xanh của mỗi chuyến đi',
      ]}
      ecoStat={{ score: 91, co2: '5,8 kg' }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-charcoal">
            Tạo tài khoản
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Miễn phí, chỉ mất vài giây
          </p>
        </div>

        {generalError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {generalError}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-forest-700 border border-green-200">
            {successMessage}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            icon={<User size={17} />}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
            }}
            error={errors.name}
            autoComplete="name"
          />

          <Input
            label="Email"
            type="email"
            placeholder="ban@duLich.vn"
            icon={<Mail size={17} />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
            }}
            error={errors.email}
            autoComplete="email"
          />

          <div>
            <PasswordInput
              label="Mật khẩu"
              placeholder="Tối thiểu 8 ký tự"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              error={errors.password}
              autoComplete="new-password"
            />
            <PasswordStrength password={password} />
          </div>

          <PasswordInput
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
            }}
            error={errors.confirm}
            autoComplete="new-password"
          />
        </div>

        <div className="mt-5">
          <Checkbox
            checked={terms}
            onChange={(v) => {
              setTerms(v);
              if (errors.terms) setErrors((p) => ({ ...p, terms: undefined }));
            }}
            label="Tôi đồng ý với Điều khoản & Chính sách bảo mật"
            error={errors.terms}
          />
        </div>

        <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-6 w-full">
          Đăng ký
        </Button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-beige" />
          <span className="text-xs font-medium text-muted">hoặc</span>
          <div className="h-px flex-1 bg-beige" />
        </div>

        <GoogleButton>Đăng ký với Google</GoogleButton>

        <p className="mt-6 text-center text-sm text-muted">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="font-medium text-forest-600 hover:text-forest-700 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
