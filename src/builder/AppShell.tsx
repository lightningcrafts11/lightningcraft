'use client';

import Header from './Header';
import StatusBar from './StatusBar';
import BuilderWorkspace from './BuilderWorkspace';
import { MobilePanelsProvider } from './MobilePanelsContext';

export default function AppShell() {
  return (
    <MobilePanelsProvider>
      <div className="flex flex-col h-dvh max-h-dvh overflow-hidden">
        <Header />
        <main className="flex flex-1 min-h-0 min-w-0 overflow-hidden flex-col">
          <BuilderWorkspace />
        </main>
        <StatusBar />
      </div>
    </MobilePanelsProvider>
  );
}
