import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="container mt-5">
          <div className="alert alert-danger">
            <h4>
              <i className="fas fa-exclamation-triangle me-2"></i>
              Đã xảy ra lỗi
            </h4>
            <p>Trang web gặp sự cố khi tải dữ liệu. Vui lòng thử lại.</p>
            <div className="mt-3">
              <button
                className="btn btn-primary me-2"
                onClick={() => window.location.reload()}
              >
                Tải lại trang
              </button>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  this.setState({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                  })
                }
              >
                Thử lại
              </button>
            </div>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-3">
                <summary>Chi tiết lỗi (chỉ hiển thị trong development)</summary>
                <pre className="mt-2 text-danger">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
