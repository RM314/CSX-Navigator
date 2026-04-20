import { useOutletContext } from 'react-router-dom';
import { ChatPanel } from '../components/chat/ChatPanel';
import type { ChatShellContext } from './AppShell';

export function ChatPage() {
  const chatState = useOutletContext<ChatShellContext>();

  return <ChatPanel {...chatState} />;
}