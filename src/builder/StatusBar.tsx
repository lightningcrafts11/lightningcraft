'use client';

import { useBuilderStore } from '@/store/builderStore';

export default function StatusBar() {
  const viewMode = useBuilderStore((s) => s.viewMode);

  return (
    <footer className="h-7 bg-zinc-900 border-t border-zinc-700 flex items-center px-3 shrink-0">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden />
        <span className="text-xs text-zinc-400">
          {viewMode === 'preview' ? 'Preview' : 'Ready'}
        </span>
      </div>
      <div className="flex-1" />
      <span className="text-xs text-zinc-600">LightningCraft MVP</span>
    </footer>
  );
}
