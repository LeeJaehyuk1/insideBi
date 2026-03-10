"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive/60" />
          <div>
            <p className="text-sm font-semibold text-destructive">컴포넌트 오류가 발생했습니다</p>
            <p className="text-xs text-muted-foreground mt-1">
              {this.state.error?.message ?? "알 수 없는 오류"}
            </p>
          </div>
          <button
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCw className="h-3 w-3" />
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
