import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  return (
    <div className="w-full max-w-[360px] mx-auto">
      <div className="bg-[#0b1220] rounded-[2.75rem] p-2.5 shadow-[0_40px_80px_-24px_rgba(15,23,42,0.65)] ring-1 ring-white/10 border border-slate-700/80 overflow-hidden">
        <div className="relative w-full h-8 flex items-center justify-between px-6 pt-1 text-white/80 text-[10px] font-semibold tracking-wide">
          <span className="z-10 w-10 tabular-nums">9:41</span>
          <div
            className="absolute left-1/2 -translate-x-1/2 top-1 w-[5.25rem] h-[1.3rem] bg-black rounded-full z-0"
            aria-hidden
          />
          <div className="z-10 flex items-center gap-1.5 w-12 justify-end">
            <div className="h-2.5 w-5 border border-white/70 rounded-[3px] p-px" aria-hidden>
              <div className="h-full w-3/4 bg-white rounded-[1px]" />
            </div>
          </div>
        </div>
        <div className="pm-canvas rounded-[2.2rem] overflow-hidden flex flex-col h-[min(640px,70vh)] sm:h-[640px] text-[var(--mc-text)] relative">
          {children}
        </div>
      </div>
    </div>
  );
};
