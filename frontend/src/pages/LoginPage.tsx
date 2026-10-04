import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import GoogleButton from '@/components/ui/GoogleButton';

interface Errors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!email) e.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email không hợp lệ';
    if (!password) e.password = 'Vui lòng nhập mật khẩu';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/explore');
    }, 1200);
  };

  return (
    <AuthLayout
      image="https://picsum.photos/seed/danang_auth/1200/1600"
      imageAlt="Cầu Rồng Đà Nẵng về đêm"
      slogan="Sáng Mỹ Khê, chiều Ngũ Hành Sơn, tối về Huế."
      benefits={[
        'Lịch trình tối ưu quãng đường – đi thêm được nhiều nơi',
        'Ngân sách linh hoạt, điều chỉnh theo túi tiền',
        'Ưu tiên du lịch xanh, giảm rác thải nhựa & CO₂',
      ]}
      ecoStat={{ score: 86, co2: '4,2 kg' }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-charcoal">
            Chào mừng trở lại
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Đăng nhập để tiếp tục lên lịch trình cho chuyến đi tiếp theo
          </p>
        </div>

        <div className="space-y-4">
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

          <PasswordInput
            label="Mật khẩu"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
            }}
            error={errors.password}
            autoComplete="current-password"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Checkbox
            checked={remember}
            onChange={setRemember}
            label="Ghi nhớ đăng nhập"
          />
          <Link
            to="/login"
            className="text-sm font-medium text-forest-600 hover:text-forest-700 hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-6 w-full">
          Đăng nhập
        </Button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-beige" />
          <span className="text-xs font-medium text-muted">hoặc</span>
          <div className="h-px flex-1 bg-beige" />
        </div>

        <GoogleButton>Tiếp tục với Google</GoogleButton>

        <p className="mt-6 text-center text-sm text-muted">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="font-medium text-forest-600 hover:text-forest-700 hover:underline"
          >
            Đăng ký
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
