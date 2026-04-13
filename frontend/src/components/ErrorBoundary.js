import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unexpected application error.',
    };
  }

  componentDidCatch(error, info) {
    // Keep a console trail for debugging while rendering a user-friendly fallback.
    // eslint-disable-next-line no-console
    console.error('UI crash captured by ErrorBoundary:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, message } = this.state;
    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] px-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 text-center shadow-lg">
            <h1 className="text-xl font-semibold text-gray-800">Unable to render page</h1>
            <p className="mt-2 text-sm text-gray-600">
              A runtime error interrupted rendering. Please reload and try again.
            </p>
            <p className="mt-2 text-xs text-gray-500 break-words">{message}</p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-4 rounded bg-[#7D53F6] px-4 py-2 text-sm font-medium text-white hover:bg-[#6b42dd]"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
