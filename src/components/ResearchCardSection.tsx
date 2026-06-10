interface ResearchCardSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ResearchCardSection({ title, children }: ResearchCardSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}
