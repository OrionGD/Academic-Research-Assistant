import { cn } from '../../utils/helpers';

interface LogoProps {
  /** Controls the rendered height of the logo image */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to render the "ARAS" wordmark beside the logo */
  showText?: boolean;
  /** Extra classes on the wrapping flex container */
  className?: string;
  /** Extra classes on the <img> element */
  imgClassName?: string;
  /** Extra classes on the wordmark <span> */
  textClassName?: string;
}

/**
 * Reusable ScholarAI brand logo component.
 *
 * Size reference:
 *  sm  → 28 px  (collapsed sidebar / mobile nav)
 *  md  → 36 px  (default nav / header)
 *  lg  → 40 px  (desktop hero nav)
 *  xl  → 56 px  (auth pages)
 */
export default function Logo({
  size = 'md',
  showText = true,
  className,
  imgClassName,
  textClassName,
}: LogoProps) {
  const sizeClass = {
    sm: 'h-7',   // 28 px
    md: 'h-9',   // 36 px
    lg: 'h-10',  // 40 px
    xl: 'h-14',  // 56 px
  }[size];

  const textSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
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

