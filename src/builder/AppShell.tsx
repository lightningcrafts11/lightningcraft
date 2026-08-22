import Header from './Header';
import StatusBar from './StatusBar';
import BuilderWorkspace from './BuilderWorkspace';

export default function AppShell() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <BuilderWorkspace />
      <StatusBar />
    </div>
  );
}
