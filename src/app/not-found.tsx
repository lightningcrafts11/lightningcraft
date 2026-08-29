import Link from 'next/link';
import { Zap } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'That LightningCraft page does not exist.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 min-h-dvh bg-zinc-50">
      <div className="flex items-center gap-1.5 text-zinc-900 mb-8">
        <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" aria-hidden />
        <span className="font-semibold text-sm tracking-tight">LightningCraft</span>
      </div>
      <h1 className="text-lg font-semibold text-zinc-800 mb-2">Page not found</h1>
      <p className="text-sm text-zinc-500 mb-6 text-center max-w-sm leading-relaxed">
        That page does not exist. Return to the LightningCraft builder to keep working.
      </p>
      <Link
        href="/"
        className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Back to LightningCraft
      </Link>
    </div>
  );
}
