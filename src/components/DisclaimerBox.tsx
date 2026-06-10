interface DisclaimerBoxProps {
  text: string;
}

export function DisclaimerBox({ text }: DisclaimerBoxProps) {
  return (
    <div className="bg-[oklch(0.96_0.01_220)] rounded-2xl border border-[oklch(0.92_0.01_220)] p-6 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-lg bg-[oklch(0.92_0.01_220)] flex items-center justify-center text-xs font-bold text-[oklch(0.55_0.03_220)]">
          !
        </span>
        <h3 className="text-sm font-semibold text-[oklch(0.55_0.03_220)] tracking-wide">
          8. 免责声明
        </h3>
      </div>
      <p className="text-[oklch(0.6_0.03_220)] text-sm leading-relaxed">
        {text}
      </p>
    </div>
  );
}
