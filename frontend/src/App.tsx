import { Navigate, Route, Routes } from 'react-router-dom';
import { TopNav } from './components/common/TopNav';

import { ChatPage } from './pages/ChatPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AppShell } from './pages/AppShell';

export default function App() {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#fbfcfe] to-[#f3f6fa] font-sans text-[#1f2937]">
      <TopNav />

      <main className="mx-auto max-w-[1180px] p-7">
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
