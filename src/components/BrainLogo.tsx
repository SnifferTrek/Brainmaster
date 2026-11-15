export const APP_DISPLAY_NAME = 'Brainmaster';
export const APP_TAGLINE = 'Gehirntraining';

export function BrainLogo({ className = 'h-11 w-11 text-primary-600' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 8c-5.5 0-9 3.2-10.5 6.5-.6 1.4-1 2.8-1 4.2 0 1.2.3 2.2.8 3.1-1.5 1.8-2.3 4.1-2.3 6.6 0 4.6 2.8 8.5 7 10.2.8.3 1.6.5 2.5.5.4 0 .7 0 1.1-.1.9.6 2 1 3.2 1 1.3 0 2.5-.4 3.5-1.1 1.2.5 2.4.7 3.7.7 5.8 0 10.5-4.2 10.5-10.5 0-2.3-.7-4.4-2-6.2 1.2-1.8 1.8-4 1.8-6.3C38.5 12.8 32.2 8 24 8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M24 8v33M18 17c2 1.5 4.5 2.3 6 2.3s4-.8 6-2.3M16.5 26c2.2 1.2 4.8 1.8 7.5 1.8s5.3-.6 7.5-1.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M14 14.5c-1.2 2-1.8 4.2-1.8 6.5M34 14.5c1.2 2 1.8 4.2 1.8 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function StartScreenBrand() {
  return (
    <div className="flex items-center gap-3.5">
      <BrainLogo className="h-12 w-12 shrink-0 text-primary-600 drop-shadow-sm" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-600/80">{APP_TAGLINE}</p>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">{APP_DISPLAY_NAME}</h1>
      </div>
    </div>
  );
}