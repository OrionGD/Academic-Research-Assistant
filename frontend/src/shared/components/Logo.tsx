import { cn } from '../../utils/helpers';

interface LogoProps {
  /** Controls the rendered height of the logo image */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /** Whether to render the "ScholarAI" wordmark beside the logo */
  showText?: boolean;
  /** Extra classes on the wrapping flex container */
  className?: string;
  /** Extra classes on the <img> element */
  imgClassName?: string;
  /** Extra classes on the wordmark <span> */
  textClassName?: string;
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * Reusable ScholarAI brand logo component.
 */
export default function Logo({
  size = 'md',
  showText = true,
  className,
  imgClassName,
  textClassName,
  onClick,
}: LogoProps) {
  const sizeClass = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-10',
    xl: 'h-14',
    xxl: 'h-64',
  }[size];

  const textSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    xxl: 'text-7xl',
  }[size];

  return (
    <div 
      className={cn('flex items-center gap-2.5', className)}
      onClick={onClick}
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/6/64/ScholarAI.png"
        alt="ScholarAI logo"
        className={cn('w-auto object-contain', sizeClass, imgClassName)}
        draggable={false}
      />
      {showText && (
        <span
          className={cn(
            'font-bold tracking-tight text-text-primary select-none',
            textSize,
            textClassName,
          )}
        >
          ScholarAI
        </span>
      )}
    </div>
  );
}

