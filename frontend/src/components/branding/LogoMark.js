import React from 'react';

const SIZE_CLASSES = {
  sm: 'h-12 w-12 rounded-[18px] text-base',
  md: 'h-14 w-14 rounded-[20px] text-lg',
  lg: 'h-24 w-24 rounded-[34px] text-[2rem]',
};

export default function LogoMark({ size = 'md', className = '' }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-[#D6DBEE] bg-white text-white shadow-sm ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`}
    >
      <div className="absolute inset-[1px] rounded-[inherit] border border-white/80" />
      <svg className="relative z-10 h-[68%] w-[68%]" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M10 42.5c0-13.4 9.8-23 22-23s22 9.6 22 23h-9.6c0-8.2-5.4-14.1-12.4-14.1S19.6 34.3 19.6 42.5H10Z"
          fill="#2F3396"
        />
        <path d="M8.8 42.5h13.1v5.2H6.5l2.3-5.2Z" fill="#2F3396" />
        <path d="M42.1 42.5h13.1l2.3 5.2H42.1v-5.2Z" fill="#2F3396" />
        <path d="M32 17.2 44 23.9 32 30.7 20 23.9 32 17.2Z" fill="#C3A73A" />
        <path d="M20 23.9 32 30.7V45L20 38.3V23.9Z" fill="#B29322" />
        <path d="M44 23.9 32 30.7V45l12-6.7V23.9Z" fill="#D0B95B" />
        <path d="M27.1 21.7 32 19l4.9 2.7-4.9 2.8-4.9-2.8Z" fill="#F5E7A4" />
        <path d="M24.8 29.3h4.9c1 0 1.8.8 1.8 1.8v1.4c0 1-.8 1.8-1.8 1.8h-4.9c-1 0-1.8-.8-1.8-1.8v-1.4c0-1 .8-1.8 1.8-1.8Z" fill="#FFF7D1" />
        <path d="M34.3 31.1c0-1 .8-1.8 1.8-1.8H41c1 0 1.8.8 1.8 1.8v1.4c0 1-.8 1.8-1.8 1.8h-4.9c-1 0-1.8-.8-1.8-1.8v-1.4Z" fill="#FFF7D1" />
        <path d="M32 14.7 39.3 18.8l-2.6 1.5-4.7-2.7-4.7 2.7-2.6-1.5 7.3-4.1Z" fill="#C3A73A" />
      </svg>
    </div>
  );
}
