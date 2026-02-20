/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import React, { ReactNode } from "react";
import ErrorHandlerErrorView from "./ErrorHandlerErrorView";

interface ErrorBoundaryState {
  error: unknown;
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

// Error boundary used for MyData apps and initialization errors.
// Otherwise we use React Router's errorElement.
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: undefined };
  }

  componentDidCatch() {
    // TODO: reinstate logging!
  }

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <ErrorHandlerErrorView error={this.state.error} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
