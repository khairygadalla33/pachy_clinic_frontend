import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900">
          <div className="p-8 bg-white shadow-xl rounded-2xl max-w-lg text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">عذراً، حدث خطأ غير متوقع</h2>
            <p className="text-slate-600 mb-6">يرجى تحديث الصفحة أو المحاولة مرة أخرى لاحقاً.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              تحديث الصفحة
            </button>
            {import.meta.env.DEV && (
              <pre className="mt-6 text-left text-xs bg-slate-100 p-4 rounded overflow-auto text-red-800">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
