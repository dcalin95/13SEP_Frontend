import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: Date.now() // Pentru tracking
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Opțional: Trimite eroarea la un serviciu de monitoring
    // this.logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">🚨</div>
            <h2>Oops! Ceva nu a mers bine</h2>
            <p>Ne pare rău, a apărut o eroare neașteptată în aplicație.</p>
            
            <div className="error-id">
              <small>Error ID: {this.state.errorId}</small>
            </div>

            <div className="error-actions">
              <button onClick={this.handleRetry} className="retry-button">
                🔄 Încearcă din nou
              </button>
              <button onClick={this.handleGoHome} className="home-button">
                🏠 Mergi la pagina principală
              </button>
              <button onClick={this.handleReload} className="reload-button">
                🔄 Reîncarcă pagina
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="error-details">
                <details>
                  <summary>🔧 Detalii tehnice (pentru dezvoltatori)</summary>
                  <div className="error-stack">
                    <h4>Error:</h4>
                    <pre>{this.state.error && this.state.error.toString()}</pre>
                    
                    <h4>Component Stack:</h4>
                    <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                  </div>
                </details>
              </div>
            )}

            <div className="error-help">
              <p>
                Dacă problema persistă, contactează echipa de suport cu Error ID: <strong>{this.state.errorId}</strong>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 