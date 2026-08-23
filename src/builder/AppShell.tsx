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
        <BuilderWorkspace />
        <StatusBar />
      </div>
    </MobilePanelsProvider>
  );
}
