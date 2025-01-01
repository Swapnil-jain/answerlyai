import { AlertTriangle } from 'lucide-react';

interface WarningMessageProps {
  title?: string;
  children: React.ReactNode;
}

export function WarningMessage({ title = "Warning", children }: WarningMessageProps) {
  return (
    <div className="bg-yellow-50/50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-0.5">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-yellow-900 mb-1">{title}</h3>
          <div className="text-yellow-800">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 