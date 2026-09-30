'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';

export function SessionCopyActions({ sessionId }: { sessionId: string }) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy(kind: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(kind === 'code' ? sessionId : `${window.location.origin}/s/${encodeURIComponent(sessionId)}`);
      setCopied(kind); setError(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 2000);
    } catch { setCopied(null); setError(true); }
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 align-middle text-amber-400">
      {(['code', 'link'] as const).map((kind) => {
        const Icon = copied === kind ? Check : kind === 'code' ? Copy : Link2;
        const label = copied === kind ? 'Copied!' : `Copy session ${kind}`;
        return <button key={kind} type="button" aria-label={label} title={label}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); void copy(kind); }}
          className="inline-flex p-1 rounded-md hover:bg-amber-400/15 focus-visible:outline-2 focus-visible:outline-amber-400 transition">
          <Icon aria-hidden="true" className={`w-3.5 h-3.5 ${copied === kind ? 'text-emerald-400' : ''}`} />
        </button>;
      })}
      <span role="status" className={error ? 'text-xs font-normal tracking-normal text-rose-300' : 'sr-only'}>
        {error ? 'Could not copy. Please try again.' : copied ? `Session ${copied} copied` : ''}
      </span>
    </span>
  );
}
