interface DisclaimerBoxProps {
  text: string;
}

export function DisclaimerBox({ text }: DisclaimerBoxProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">8. 免责声明</h3>
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  );
}
