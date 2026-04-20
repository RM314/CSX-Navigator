import { SendIcon } from './SendIcon';

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export function ChatComposerOld({
  value,
  onChange,
  onSend,
  disabled,
}: ChatComposerProps) {
  return (
    <div className="border-t border-[#d8e0ea] bg-white px-[18px] pb-[18px] pt-4">
        <div className="flex items-center gap-2.5 rounded-2xl border border-[#d8e0ea] bg-[#eef3f8] p-2.5">
        <textarea
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          className="min-h-16 flex-1 resize-none rounded-xl border border-[#d8e0ea] bg-white px-3.5 py-3 text-[#1f2937] outline-none focus:border-[#2f6fed] focus:ring-2 focus:ring-[rgba(47,111,237,0.16)] disabled:opacity-70"
          placeholder="Ask about CSX, examples, governance, funding, or implementation..."
        />
        <button
          onClick={onSend}
          disabled={disabled}
          aria-label="Send message"
          title="Send message"
          className="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-xl bg-[#2f6fed] text-white transition hover:bg-[#2459bf] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SendIcon />
        </button>
      </div>

      <div className="mt-2 text-[0.84rem] text-[#6b7280]">
        Enter to send · Shift+Enter for line break
      </div>
    </div>
  );
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled,
}: ChatComposerProps) {
  return (
  <div className="border-t border-[#d8e0ea] bg-white px-3 pb-3 pt-4 sm:px-[18px] sm:pb-[18px]">
    <div className="mx-auto flex max-w-[96%] items-center gap-2 rounded-2xl border border-[#d8e0ea] bg-[#eef3f8] p-2 sm:max-w-full sm:gap-2.5 sm:p-2.5">
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
        className="min-h-16 flex-1 resize-none rounded-xl border border-[#d8e0ea] bg-white px-3 py-3 text-[#1f2937] outline-none focus:border-[#2f6fed] focus:ring-2 focus:ring-[rgba(47,111,237,0.16)] disabled:opacity-70 sm:px-3.5"
        placeholder="Ask about CSX, examples, governance, funding, or implementation..."
      />
      <button
        onClick={onSend}
        disabled={disabled}
        aria-label="Send message"
        title="Send message"
        className="flex h-[44px] w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#2f6fed] text-white transition hover:bg-[#2459bf] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[46px] sm:w-[46px]"
      >
        <SendIcon />
      </button>
    </div>

    <div className="mt-2 px-1 text-[0.84rem] text-[#6b7280]">
      Enter to send · Shift+Enter for line break
    </div>
  </div>
);
}