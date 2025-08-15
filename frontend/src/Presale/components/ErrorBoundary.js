import React from 'react';

class PresaleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Presale Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to external service (optional)
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>🚨 Oops! Ceva nu a mers bine</h2>
            <p>Ne pare rău, a apărut o eroare neașteptată în aplicația de presale.</p>
            
            <div className="error-details">
              <details>
                <summary>Detalii tehnice (pentru dezvoltatori)</summary>
                <pre>{this.state.error && this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
              </details>
            </div>

            <div className="error-actions">
              <button onClick={this.handleRetry} className="retry-button">
                🔄 Încearcă din nou
              </button>
              <button onClick={() => window.location.reload()} className="reload-button">
                🔄 Reîncarcă pagina
              </button>
            </div>

            <div className="error-help">
              <p>Dacă problema persistă, contactează echipa de suport.</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PresaleErrorBoundary; 