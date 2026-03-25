import type { MessageRole } from './types';

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getBubbleClass(role: MessageRole, streaming = false) {
  let cls =
    'max-w-[78%] rounded-2xl border px-4 py-[14px] leading-6 max-[900px]:max-w-full';

  if (role === 'system') {
    cls += ' border-[#eadb9b] bg-[#fff7d6]';
  } else if (role === 'user') {
    cls += ' rounded-tr-md border-[#b9cde6] bg-[#dbe7f6]';
  } else {
    cls += ' rounded-tl-md border-[#c7ddb8] bg-[#eef6e8]';
  }

  if (streaming) cls += ' opacity-80';
  return cls;
}
