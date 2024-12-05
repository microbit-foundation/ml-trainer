/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import React, { ReactNode } from "react";
import ErrorHandlerErrorView from "./ErrorHandlerErrorView";

interface ErrorBoundaryState {
  hasError: boolean;
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
    this.state = { hasError: false };
  }

  componentDidCatch() {
    // TODO: reinstate logging!
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorHandlerErrorView />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
