import { SendIcon } from './SendIcon';

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export function ChatComposer({
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
