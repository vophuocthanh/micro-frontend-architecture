'use client';

import { AlertTriangle } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
      <Alert variant="destructive" className="mx-auto max-w-xl">
        <AlertTriangle className="size-4" aria-hidden="true" />
        <AlertTitle>Something went wrong in {this.props.area}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{this.state.error.message}</p>
          <Button variant="outline" size="sm" onClick={this.reset}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
}
