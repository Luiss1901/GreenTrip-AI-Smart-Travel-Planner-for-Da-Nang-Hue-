import { Leaf } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizeMap = {
  sm: { icon: 20, text: 'text-xl' },
  md: { icon: 26, text: 'text-[26px]' },
  lg: { icon: 32, text: 'text-[32px]' },
};

export default function Logo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}: LogoProps) {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-[10px] ${className}`}>
      {/* Icon lá màu đen đứng độc lập không có nền */}
      <Leaf size={s.icon} strokeWidth={2.5} className="text-black" />
      
      {showText && (
        <span className={`font-body font-bold text-black tracking-tighter leading-none ${s.text} ${textClassName}`}>
          greentrip
        </span>
      )}
    </div>
  );
}
