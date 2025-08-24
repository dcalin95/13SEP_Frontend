import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './mindmirror.css';
import MindNFTGenerator from './components/MindNFTGenerator';

const MindMirrorDashboard = () => {
  // State management
  const [inputText, setInputText] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [userBadge, setUserBadge] = useState(null);
  const [currentTier, setCurrentTier] = useState(1);
  const [walletBalance, setWalletBalance] = useState(0);
  const [hasUsedAnalysis, setHasUsedAnalysis] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [wordMilestone, setWordMilestone] = useState({
    count: 0,
    hasAccess: false,
    isLoading: true
  });

  // Check if user has already used the analysis
  const checkAnalysisUsage = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
      const connectedWallet = window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet');
      
      if (!connectedWallet) return;
      
      const response = await fetch(`${BACKEND_URL}/api/word-analysis/check-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: connectedWallet })
      });
      
      const data = await response.json();
      setHasUsedAnalysis(data.hasUsed || false);
    } catch (error) {
      console.error('Error checking analysis usage:', error);
    }
  };

  // Page protection against accidental closure
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (analysisResults) {
        e.preventDefault();
        e.returnValue = 'You have unsaved analysis results! If you leave, the data will be lost forever.';
        return 'You have unsaved analysis results! If you leave, the data will be lost forever.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [analysisResults]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Calculate progress and word count
  const wordCount = wordMilestone.count || (inputText.trim() ? inputText.trim().split(/\s+/).length : 0);
  const progress = Math.min((wordCount / 1000) * 100, 100);

  // Check word milestone on component mount
  useEffect(() => {
    checkWordMilestone();
    checkAnalysisUsage();
  }, []);

  // Check if user has already used the analysis
  const checkAnalysisUsage = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
      const connectedWallet = window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet');
      
      if (!connectedWallet) return;
      
      const response = await fetch(`${BACKEND_URL}/api/word-analysis/check-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: connectedWallet })
      });
      
      const data = await response.json();
      setHasUsedAnalysis(data.hasUsed || false);
    } catch (error) {
      console.error('Error checking analysis usage:', error);
    }
  };

  // Page protection against accidental closure
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (analysisResults) {
        e.preventDefault();
        e.returnValue = 'You have unsaved analysis results! If you leave, the data will be lost forever.';
        return 'You have unsaved analysis results! If you leave, the data will be lost forever.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [analysisResults]);

  const checkWordMilestone = async () => {
    try {
      // Simulate checking word milestone - replace with actual API call
      const mockWordCount = 29; // This should come from your backend
      setWordMilestone({
        count: mockWordCount,
        hasAccess: true, // Allow analysis even with few words for testing
        isLoading: false
      });
    } catch (error) {
      console.error('Error checking word milestone:', error);
      setWordMilestone({ count: 0, hasAccess: true, isLoading: false });
    }
  };

  const handleAnalysis = async () => {
    // Check if user has already used the analysis
    if (hasUsedAnalysis) {
      alert('⚠️ You have already used the free psychological analysis! For a new analysis, contact us for paid options.');
      return;
    }
    
    // Show warning modal before analysis
    setShowWarningModal(true);
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
  };

  // Export functions
  const handleEmailExport = () => {
    if (!analysisResults) return;
    
    const subject = encodeURIComponent('My Psychological Trading Analysis - MindMirror');
    const body = encodeURIComponent(`
🧠 PSYCHOLOGICAL TRADING ANALYSIS RESULTS

${analysisResults.analysis}

Generated by MindMirror AI - bits-ai.io
Wallet: ${window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet')}
Date: ${new Date().toLocaleDateString()}
    `);
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handlePDFExport = () => {
    if (!analysisResults) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Psychological Trading Analysis</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #8B5CF6; }
            .analysis { white-space: pre-wrap; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>🧠 Psychological Trading Analysis</h1>
          <div class="analysis">${analysisResults.analysis}</div>
          <hr>
          <p><strong>Generated by:</strong> MindMirror AI - bits-ai.io</p>
          <p><strong>Wallet:</strong> ${window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet')}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintExport = () => {
    if (!analysisResults) return;
    
    const printContent = `
🧠 PSYCHOLOGICAL TRADING ANALYSIS RESULTS

${analysisResults.analysis}

Generated by MindMirror AI - bits-ai.io
Wallet: ${window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet')}
Date: ${new Date().toLocaleDateString()}
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<pre>${printContent}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShareExport = () => {
    if (!analysisResults) return;
    
    const shareText = `🧠 Just completed my Psychological Trading Analysis with MindMirror AI! 

Trading Score: ${analysisResults.tradingScore || 'N/A'}/100

Check out your own analysis at bits-ai.io

#TradingPsychology #AI #Crypto`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Psychological Trading Analysis',
        text: shareText,
        url: 'https://bits-ai.io'
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('✅ Analysis summary copied to clipboard!');
      });
    }
  };

  const proceedWithAnalysis = async () => {
    // Restore body scroll
    document.body.style.overflow = '';
    
    setShowWarningModal(false);
    setIsAnalyzing(true);
    
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
      
      const connectedWallet = window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet');
      
      if (!connectedWallet) {
        throw new Error('Please connect your wallet first to analyze your psychology profile');
      }

      const url = `${BACKEND_URL}/api/word-analysis/psychology/analyze`;
      console.log('🧠 Making psychology analysis request to:', url);
      console.log('👤 Wallet address:', connectedWallet);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: connectedWallet,
          wordCount: wordMilestone.count 
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Enhanced analysis results with more detailed metrics
      const enhancedResults = {
        ...data,
        aiProvider: data.aiProvider || "OpenAI GPT-4 Turbo",
        analysisTimestamp: new Date().toLocaleString(),
        // Add some mock advanced metrics for demo
        pitchVariance: Math.floor(Math.random() * 100),
        speechRate: Math.floor(Math.random() * 100),
        pausePatterns: Math.floor(Math.random() * 100),
        vocalTension: Math.floor(Math.random() * 100),
        respiratoryStability: Math.floor(Math.random() * 100),
        confidenceLevel: Math.floor(Math.random() * 100),
        anxietyLevel: Math.floor(Math.random() * 100),
        focusLevel: Math.floor(Math.random() * 100),
        decisionSpeed: 'Moderate-Fast',
        riskAppetite: 'Conservative-Balanced',
        // Facial analysis metrics
        facialTension: Math.floor(Math.random() * 100),
        eyeMovementPatterns: Math.floor(Math.random() * 100),
        microExpressions: Math.floor(Math.random() * 100),
        // Additional psychological metrics
        stressLevel: Math.floor(Math.random() * 100),
        emotionalStability: Math.floor(Math.random() * 100),
        cognitiveLoad: Math.floor(Math.random() * 100)
      };
      
      setAnalysisResults(enhancedResults);
      setHasUsedAnalysis(true); // Mark as used after successful analysis
      
    } catch (error) {
      console.error('Analysis error:', error);
      alert(`Analysis failed: ${error.message}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get tier information
  const getTierInfo = (tier) => {
    const tiers = {
      1: { name: "Basic Analysis", price: "Free", features: ["Text Analysis", "Basic Metrics"] },
      2: { name: "Advanced Analysis", price: "1000 BITS", features: ["Sentiment Analysis", "Emotion Detection"] },
      3: { name: "Pro Analysis", price: "5000 BITS", features: ["Voice Analysis", "Video Analysis", "Real-time Metrics"] },
      4: { name: "Enterprise", price: "10000 BITS", features: ["Smart Ring Integration", "24/7 Monitoring"] }
    };
    return tiers[tier] || tiers[1];
  };

  const handleAnalysis = async () => {
    // Check if user has already used the analysis
    if (hasUsedAnalysis) {
      alert('⚠️ You have already used the free psychological analysis! For a new analysis, contact us for paid options.');
      return;
    }
    
    // Show warning modal before analysis
    setShowWarningModal(true);
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
  };

  // Export functions
  const handleEmailExport = () => {
    if (!analysisResults) return;
    
    const subject = encodeURIComponent('My Psychological Trading Analysis - MindMirror');
    const body = encodeURIComponent(`
🧠 PSYCHOLOGICAL TRADING ANALYSIS RESULTS

${analysisResults.analysis}

Generated by MindMirror AI - bits-ai.io
Wallet: ${window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet')}
Date: ${new Date().toLocaleDateString()}
    `);
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handlePDFExport = () => {
    if (!analysisResults) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Psychological Trading Analysis</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #8B5CF6; }
            .analysis { white-space: pre-wrap; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>🧠 Psychological Trading Analysis</h1>
          <div class="analysis">${analysisResults.analysis}</div>
          <hr>
          <p><strong>Generated by:</strong> MindMirror AI - bits-ai.io</p>
          <p><strong>Wallet:</strong> ${window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet')}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintExport = () => {
    if (!analysisResults) return;
    
    const printContent = `
🧠 PSYCHOLOGICAL TRADING ANALYSIS RESULTS

${analysisResults.analysis}

Generated by MindMirror AI - bits-ai.io
Wallet: ${window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet')}
Date: ${new Date().toLocaleDateString()}
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<pre>${printContent}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShareExport = () => {
    if (!analysisResults) return;
    
    const shareText = `🧠 Just completed my Psychological Trading Analysis with MindMirror AI! 

Trading Score: ${analysisResults.tradingScore || 'N/A'}/100

Check out your own analysis at bits-ai.io

#TradingPsychology #AI #Crypto`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Psychological Trading Analysis',
        text: shareText,
        url: 'https://bits-ai.io'
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('✅ Analysis summary copied to clipboard!');
      });
    }
  };

  const proceedWithAnalysis = async () => {
    // Restore body scroll
    document.body.style.overflow = '';
    
    setShowWarningModal(false);
    setIsAnalyzing(true);
    
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
      
      const connectedWallet = window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet');
      
      if (!connectedWallet) {
        throw new Error('Please connect your wallet first to analyze your psychology profile');
      }

      const url = `${BACKEND_URL}/api/word-analysis/psychology/analyze`;
      console.log('🧠 Making psychology analysis request to:', url);
      console.log('👤 Wallet address:', connectedWallet);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: connectedWallet,
          wordCount: wordMilestone.count 
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Enhanced analysis results with more detailed metrics
      const enhancedResults = {
        ...data,
        aiProvider: data.aiProvider || "OpenAI GPT-4 Turbo",
        analysisTimestamp: new Date().toLocaleString(),
        // Add some mock advanced metrics for demo
        pitchVariance: Math.floor(Math.random() * 100),
        speechRate: Math.floor(Math.random() * 100),
        pausePatterns: Math.floor(Math.random() * 100),
        vocalTension: Math.floor(Math.random() * 100),
        respiratoryStability: Math.floor(Math.random() * 100),
        confidenceLevel: Math.floor(Math.random() * 100),
        anxietyLevel: Math.floor(Math.random() * 100),
        focusLevel: Math.floor(Math.random() * 100),
        decisionSpeed: 'Moderate-Fast',
        riskAppetite: 'Conservative-Balanced',
        // Facial analysis metrics
        facialTension: Math.floor(Math.random() * 100),
        eyeMovementPatterns: Math.floor(Math.random() * 100),
        microExpressions: Math.floor(Math.random() * 100),
        // Additional psychological metrics
        stressLevel: Math.floor(Math.random() * 100),
        emotionalStability: Math.floor(Math.random() * 100),
        cognitiveLoad: Math.floor(Math.random() * 100)
      };
      
      setAnalysisResults(enhancedResults);
      setHasUsedAnalysis(true); // Mark as used after successful analysis
      
    } catch (error) {
      console.error('Analysis error:', error);
      alert(`Analysis failed: ${error.message}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      
      setVideoStream(stream);
      setIsRecording(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied or not available');
    }
  };

  const stopVideoRecording = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setIsRecording(false);
  };

  if (wordMilestone.isLoading) {
    return (
      <div className="mind-mirror-loading">
        <div className="loading-spinner"></div>
        <p>Loading Mind Mirror...</p>
      </div>
    );
  }

  return (
    <div className="mind-mirror-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-header">
            <div className="brain-icon">🧠</div>
            <div className="hero-text">
              <h1 className="hero-title">AI Mind Mirror</h1>
              <p className="hero-subtitle">Advanced Neuropsychological Analysis for Professional Traders</p>
            </div>
          </div>

          <div className="hero-features">
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span>Emotional prosody mapping</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span>Trading psychology profiling</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔊</span>
              <span>Real-time voice analysis</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💡</span>
              <span>Personalized trading recommendations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tier System */}
      <section className="tier-system">
        <div className="tier-header">
          <h2>🎯 Analysis Tiers</h2>
          <p>Choose your level of psychological analysis</p>
        </div>
        
        <div className="tier-grid">
          {[1, 2, 3, 4].map(tier => {
            const tierInfo = getTierInfo(tier);
            return (
              <div 
                key={tier} 
                className={`tier-card ${currentTier === tier ? 'active' : ''}`}
                onClick={() => setCurrentTier(tier)}
              >
                <div className="tier-header">
                  <h3>Tier {tier}</h3>
                  <span className="tier-price">{tierInfo.price}</span>
                </div>
                <h4>{tierInfo.name}</h4>
                <ul>
                  {tierInfo.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Compact Status Section */}
      <section className="status-section">
        <div className="status-wrapper">
          <div className="progress-compact">
            <div className="progress-info">
              <span>Progress: <strong className="word-count-highlight">{wordCount}</strong>/1000 words</span>
              <span className="progress-percent">{progress.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="context-info">
            <p className="context-text">
              {wordCount < 1000 
                ? `🧠 Participate in Telegram group to collect ${1000 - wordCount} more words for analysis`
                : "✨ Ready for advanced neuropsychological analysis!"
              }
            </p>
          </div>

          <button 
            onClick={handleAnalysis}
            disabled={isAnalyzing || !wordMilestone.hasAccess}
            className={`analyze-button ${isAnalyzing ? 'analyzing' : ''}`}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner"></span>
                🤖 OpenAI GPT-4 Analyzing...
              </>
            ) : wordMilestone.hasAccess ? (
              '🧬 Initialize Cognitive Analysis'
            ) : (
              `🔒 Need 1000 words (${wordMilestone.count || 0}/1000)`
            )}
          </button>
        </div>
      </section>

      {/* Analysis Results */}
      {analysisResults && (
        <section className="results-section">
          <div className="results-header">
            <h2>🧠 Neuropsychological Analysis Results</h2>
            <div className="results-meta">
              <span>Generated by {analysisResults.aiProvider}</span>
              <span>•</span>
              <span>{analysisResults.analysisTimestamp}</span>
            </div>
            
            {/* Export Actions */}
            <div className="export-actions">
              <button 
                className="export-btn email-btn" 
                onClick={handleEmailExport}
                title="Send via Email"
              >
                📧 Email
              </button>
              <button 
                className="export-btn pdf-btn" 
                onClick={handlePDFExport}
                title="Export as PDF"
              >
                📄 PDF
              </button>
              <button 
                className="export-btn print-btn" 
                onClick={handlePrintExport}
                title="Print Analysis"
              >
                🖨️ Print
              </button>
              <button 
                className="export-btn share-btn" 
                onClick={handleShareExport}
                title="Share Results"
              >
                📤 Share
              </button>
            </div>
          </div>
          
          <div className="results-grid">
            {/* Core Analysis */}
            <div className="result-card primary">
              <h3>🎯 Core Analysis</h3>
              <div className="metrics">
                <div className="metric">
                  <span className="label">Sentiment</span>
                  <span className={`value sentiment-${analysisResults.sentiment}`}>
                    {analysisResults.sentiment?.toUpperCase()}
                  </span>
                </div>
                <div className="metric">
                  <span className="label">Confidence</span>
                  <span className="value">{((analysisResults.confidence || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span className="label">Trading Type</span>
                  <span className="value">{analysisResults.trading_psychology?.type || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Psychological Profile */}
            <div className="result-card">
              <h3>🧩 Psychological Profile</h3>
              <div className="metrics">
                <div className="metric">
                  <span className="label">Risk Tolerance</span>
                  <span className={`value risk-${analysisResults.trading_psychology?.risk_tolerance || 'medium'}`}>
                    {(analysisResults.trading_psychology?.risk_tolerance || 'medium').toUpperCase()}
                  </span>
                </div>
                <div className="metric">
                  <span className="label">Emotional Stability</span>
                  <span className="value">{((analysisResults.trading_psychology?.emotional_stability || 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="metric">
                  <span className="label">Cognitive Archetype</span>
                  <span className="value">{analysisResults.neuropsychological_profile?.cognitive_archetype || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NFT Generation Section */}
          <div className="nft-section">
            <div className="nft-header">
              <h3>🎨 Generate Your Mind NFT</h3>
              <p>Create a unique NFT based on your neuropsychological analysis</p>
            </div>
            <MindNFTGenerator results={analysisResults} />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mind-mirror-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>🧠 Mind Mirror Technology</h4>
            <p>Advanced AI-powered neuropsychological analysis for traders</p>
          </div>
          <div className="footer-section">
            <h4>🔬 Scientific Approach</h4>
            <p>Based on proven psychological and neuroscience research</p>
          </div>
          <div className="footer-section">
            <h4>🎯 Trading Optimization</h4>
            <p>Personalized insights to improve your trading performance</p>
          </div>
        </div>
      </footer>
      
      {/* Warning Modal rendered via Portal */}
      <WarningModal 
        showWarningModal={showWarningModal}
        setShowWarningModal={setShowWarningModal}
        proceedWithAnalysis={proceedWithAnalysis}
      />

    </div>
  );
};

// Warning Modal Component rendered via Portal
const WarningModal = ({ showWarningModal, setShowWarningModal, proceedWithAnalysis }) => {
  if (!showWarningModal) return null;

  return createPortal(
    <div className="warning-modal-overlay">
      <div className="warning-modal">
        <div className="warning-header">
          <h2>⚠️ IMPORTANT WARNING!</h2>
        </div>
        
        <div className="warning-content">
          <div className="warning-section">
            <h3>🔒 Unique & Free Analysis</h3>
            <p>This professional psychological analysis can be performed <strong>only once for free</strong> per wallet.</p>
          </div>
          
          <div className="warning-section">
            <h3>💾 Protect Your Results</h3>
            <p>If you close the page or refresh, <strong>the analysis will be permanently lost</strong>!</p>
            <p>Use the export buttons (📧 Email, 📄 PDF, 🖨️ Print) to save your results.</p>
          </div>
          
          <div className="warning-section">
            <h3>💰 Additional Analyses</h3>
            <p>For additional analyses or repeating the analysis, a fee will be required. Contact us for details.</p>
          </div>
          
          <div className="warning-section critical">
            <h3>🚨 Confirm You Understand</h3>
            <p>By continuing, you confirm that:</p>
            <ul>
              <li>✅ You understand this is a unique free analysis</li>
              <li>✅ You will save results using export options</li>
              <li>✅ You know data is lost if you close the page</li>
            </ul>
          </div>
        </div>
        
        <div className="warning-actions">
          <button 
            className="cancel-btn"
            onClick={() => {
              // Restore body scroll
              document.body.style.overflow = '';
              setShowWarningModal(false);
            }}
          >
            ❌ Cancel
          </button>
          <button 
            className="proceed-btn"
            onClick={proceedWithAnalysis}
          >
            ✅ I Understand & Continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MindMirrorDashboard;
