'use client';

import { Component, type ReactNode } from 'react';

interface BuilderErrorBoundaryProps {
  children: ReactNode;
}

interface BuilderErrorBoundaryState {
  hasError: boolean;
}

/**
 * Prevents a renderer failure from taking down the whole builder.
 * Does not swallow the error — React still logs it.
 */
export default class BuilderErrorBoundary extends Component<
  BuilderErrorBoundaryProps,
  BuilderErrorBoundaryState
> {
  constructor(props: BuilderErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): BuilderErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center px-6" role="alert">
          <div className="text-center max-w-sm">
            <p className="text-sm font-medium text-zinc-700">Something went wrong while rendering.</p>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              Use Undo, or refresh the page. The builder document has not been discarded.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="mt-3 h-8 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
