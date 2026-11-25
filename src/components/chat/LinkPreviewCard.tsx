'use client';

import { ExternalLink, Globe } from 'lucide-react';
import { LinkPreview } from '@/types';

interface LinkPreviewCardProps {
  preview: LinkPreview;
  isMe?: boolean;
}

export function LinkPreviewCard({ preview }: LinkPreviewCardProps) {
  if (!preview || !preview.url) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block rounded-xl overflow-hidden bg-black/30 border border-white/10 hover:border-purple-500/40 transition group select-none max-w-sm"
    >
      {preview.image && (
        <div className="relative w-full aspect-video max-h-36 overflow-hidden bg-black/40">
          <img
            src={preview.image}
            alt={preview.title || 'Pratinjau tautan'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-2.5 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[10px] text-purple-300/80 font-medium uppercase tracking-wider">
          <Globe size={11} />
          <span className="truncate">{preview.site_name || new URL(preview.url).hostname}</span>
          <ExternalLink size={10} className="ml-auto opacity-70 group-hover:opacity-100 transition" />
        </div>
        <h5 className="text-xs font-semibold text-white group-hover:text-purple-200 transition line-clamp-1">
          {preview.title || preview.url}
        </h5>
        {preview.description && (
          <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}
