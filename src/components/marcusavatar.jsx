const SIZES = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

const FALLBACK_SIZES = {
  xs: 'text-[8px]',
  sm: 'text-[10px]',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export default function MarcusAvatar({ size = 'sm', className = '' }) {
  const sizeClass = SIZES[size] || SIZES.sm;
  const fallbackText = FALLBACK_SIZES[size] || FALLBACK_SIZES.sm;

  return (
    <img
      src="/images/marcus-avatar.png"
      alt="Marcus"
      className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      onError={(e) => {
        e.target.outerHTML = `<span class="${sizeClass} rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 ${className}"><span class="${fallbackText} text-white font-bold">M</span></span>`;
      }}
    />
  );
}
