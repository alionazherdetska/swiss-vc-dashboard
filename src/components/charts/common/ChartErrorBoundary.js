import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    if (process.env.NODE_ENV === "development") {
      console.error("Chart Error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorCount } = this.state;
    const { children, fallback, chartName = "Chart" } = this.props;

    if (hasError) {
      const isPersistent = errorCount > 2;

      if (fallback) {
        return fallback(error, this.handleReset);
      }

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">{chartName} Rendering Error</h3>
              <p className="text-red-800 text-sm mt-1">
                {isPersistent
                  ? "This chart has encountered a persistent error. Please refresh the page."
                  : "An error occurred while rendering this chart."}
              </p>

              {process.env.NODE_ENV !== "production" && error && (
                <details className="mt-2 text-xs text-red-700">
                  <summary className="cursor-pointer underline">Error details</summary>
                  <pre className="mt-1 p-2 bg-red-100 rounded overflow-auto max-h-32">
                    {error.toString()}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 mt-3">
                {!isPersistent && (
                  <button
                    onClick={this.handleReset}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try again
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                >
                  Refresh page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ChartErrorBoundary;
