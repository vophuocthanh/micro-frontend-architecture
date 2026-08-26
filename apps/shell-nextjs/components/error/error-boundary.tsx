'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  /** Named in the fallback so the user is told *which* area failed. */
  area: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Contains a failure to one region of the shell.
 *
 * Note what this does *not* do: a remote renders into its own framework root,
 * so a crash inside the Dashboard's React tree never propagates here — that
 * isolation comes from the mount contract, not from this boundary. What this
 * catches is the shell's own rendering around a remote, which is the remaining
 * way one area could take the whole page down.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[shell] "${this.props.area}" crashed`, error, info.componentStack);
  }

  private readonly reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-900"
      >
        <p className="font-semibold">Something went wrong in {this.props.area}</p>
        <p className="mt-1 text-red-800">{this.state.error.message}</p>
        <button
          type="button"
          onClick={this.reset}
          className="mt-4 rounded-lg border border-red-300 bg-white px-3 py-1.5 font-semibold text-red-700 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          Try again
        </button>
      </div>
    );
  }
}
