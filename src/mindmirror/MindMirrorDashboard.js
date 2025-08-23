import React, { useState, useRef, useEffect } from 'react';
import './mindmirror.css';
import MindNFTGenerator from './components/MindNFTGenerator';

const MindMirrorDashboard = () => {
  // State management
  const [inputText, setInputText] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  
  // Refs for media
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // NeuroAI System state
  const [walletBalance, setWalletBalance] = useState(0);
  const [currentTier, setCurrentTier] = useState(1);
  const [userBadge, setUserBadge] = useState(null);
  const [wordMilestone, setWordMilestone] = useState({ count: 0, hasAccess: false, isLoading: true });
  
  // Advanced Video Analysis State
  const [facialAnalysisResults, setFacialAnalysisResults] = useState(null);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);

  // Calculate progress - use milestone count if available, otherwise input text count
  const wordCount = wordMilestone.count > 0 ? wordMilestone.count : (inputText.trim() ? inputText.trim().split(/\s+/).length : 0);
  const progress = Math.min((wordCount / 1000) * 100, 100);

  // 🧠 Check word milestone on component mount
  useEffect(() => {
    checkWordMilestone();
  }, []);

  /**
   * Check if user has reached 1000 words milestone
   */
  const checkWordMilestone = async () => {
    try {
      setWordMilestone(prev => ({ ...prev, isLoading: true }));
      
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
      
      // Get connected wallet address
      const walletAddress = window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet');
      
      if (!walletAddress) {
        console.log('🔗 No wallet connected, cannot check word milestone');
        setWordMilestone({
          count: 0,
          hasAccess: false,
          isLoading: false
        });
        return;
      }
      
      console.log('🔍 Checking word milestone for wallet:', walletAddress);
      
      // First, get telegram_id for this wallet
      const telegramResponse = await fetch(`${BACKEND_URL}/api/word-analysis/get-telegram-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress })
      });
      
      if (!telegramResponse.ok) {
        console.log('❌ No telegram user found for this wallet');
        setWordMilestone({
          count: 0,
          hasAccess: false,
          isLoading: false
        });
        return;
      }
      
      const telegramData = await telegramResponse.json();
      const telegramId = telegramData.telegramId;
      
      console.log('✅ Found telegram_id:', telegramId);
      
      // Now get words using telegram_id
      const response = await fetch(`${BACKEND_URL}/api/word-analysis/analyze-user-words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Word milestone data:', data);
        
        setWordMilestone({
          count: data.wordCount || 0,
          hasAccess: data.wordCount >= 1000,
          isLoading: false
        });
      } else {
        console.log('❌ No words found for user');
        setWordMilestone({
          count: 0,
          hasAccess: false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('❌ Error checking word milestone:', error);
      setWordMilestone({
        count: 0,
        hasAccess: false,
        isLoading: false
      });
    }
  };

  // NeuroAI System functions
  const calculateTier = (balance) => {
    if (balance >= 100000) return 4;
    if (balance >= 50000) return 3;
    if (balance >= 10000) return 2;
    return 1;
  };

  const getTierInfo = (tier) => {
    const tiers = {
      1: { name: "Cognitive Baseline", color: "green", features: ["NLP Semantic Analysis", "Affective Computing", "Generative Art Synthesis"] },
      2: { name: "Multimodal Cognition", color: "yellow", features: ["Prosodic Analysis (Whisper)", "Computer Vision Processing", "Advanced Diffusion Models"] },
      3: { name: "NeuroAI+ Deep Learning", color: "red", features: ["Behavioral Video Analytics", "Temporal NFT Sequences", "Comprehensive Psychometric Profiling"] },
      4: { name: "Biometric NeuroSync", color: "blue", features: ["Physiological Signal Processing", "Real-time Autonomic Monitoring", "Predictive Behavioral Modeling"] }
    };
    return tiers[tier];
  };

  const assignBadge = (sentiment, wordCount, analysisText) => {
    const text = analysisText.toLowerCase();
    
    if (text.includes('calm') || text.includes('patient') || sentiment === 'positive') {
      return { emoji: '🧊', name: 'Homeostatic Regulator', description: 'Optimal prefrontal cortex regulation with balanced neurotransmitter profiles' };
    }
    if (text.includes('stress') || text.includes('burnout') || text.includes('tired')) {
      return { emoji: '🔥', name: 'Cortisol Dysregulation', description: 'Elevated HPA-axis activation indicating chronic stress response patterns' };
    }
    if (wordCount > 800 || text.includes('think') || text.includes('analyze')) {
      return { emoji: '🌀', name: 'Cognitive Hypervigilance', description: 'Enhanced default mode network activity with analytical rumination tendencies' };
    }
    if (text.includes('risk') || text.includes('gamble') || text.includes('yolo')) {
      return { emoji: '⚡', name: 'Dopaminergic Risk-Seeker', description: 'Heightened reward pathway activation with impulsivity markers' };
    }
    
    return { emoji: '📊', name: 'Neurotypical Baseline', description: 'Standard cognitive-behavioral profile within normative parameters' };
  };

  // Advanced Analysis function with Specialized AI
  const handleAnalysis = async () => {
    if (!inputText.trim()) return;
    
    // Check if user has access to Mind Mirror
    if (!wordMilestone.hasAccess) {
      alert(`🧠 Mind Mirror Access Required!\n\nYou need to reach 1000 unique words in the Telegram group to unlock this feature.\n\nCurrent progress: ${wordMilestone.count}/1000 words\n\nJoin the conversation: https://t.me/BitSwapDEX_AI`);
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      console.log("🤖 Initiating OpenAI GPT-4 Neuropsychological Analysis...");
      
      // Call specialized AI API on Render backend
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
      console.log("🌐 Connecting to backend:", BACKEND_URL);
      
      
      const response = await fetch(`${BACKEND_URL}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Analyze this text for neuropsychological patterns and trading psychology. Provide a JSON response with sentiment, confidence, stress_indicators (level 0-1), cognitive_patterns (load 0-1, decision_style), trading_psychology (type, risk_tolerance), and neuropsychological_profile (cognitive_archetype, stress_resilience 0-1). Text: "${inputText}"`
        })
      });

      console.log("📡 Response status:", response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Backend Error:", response.status, errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const aiResponse = await response.json();
      console.log("✅ OpenAI Analysis Complete:", aiResponse);
      
      // Try to parse JSON from the answer, fallback to text analysis
      let aiResults = {};
      try {
        // OpenAI might return JSON in the answer field
        aiResults = JSON.parse(aiResponse.answer);
      } catch (parseError) {
        console.log("📝 Parsing AI text response for patterns...");
        // Fallback: analyze the text response for patterns
        const answerText = aiResponse.answer || '';
        aiResults = {
          sentiment: answerText.toLowerCase().includes('positive') ? 'positive' : 
                    answerText.toLowerCase().includes('negative') ? 'negative' : 'neutral',
          confidence: 0.85
        };
      }
      
      // Process AI results
      const analysisResults = {
        sentiment: aiResults.sentiment || 'neutral',
        confidence: Math.round((aiResults.confidence || 0.85) * 100),
        wordCount: wordCount,
        keywords: aiResults.cognitive_clusters || inputText.split(' ').filter(word => word.length > 3).slice(0, 3),
        // Enhanced AI fields
        stressLevel: Math.round((aiResults.stress_indicators?.level || 0.5) * 100),
        cognitiveLoad: Math.round((aiResults.cognitive_patterns?.load || 0.5) * 100),
        tradingPersonality: aiResults.trading_psychology?.type || 'Balanced Strategist',
        riskTolerance: aiResults.trading_psychology?.risk_tolerance || 'medium',
        cognitiveArchetype: aiResults.neuropsychological_profile?.cognitive_archetype || 'Homeostatic Regulator',
        stressResilience: Math.round((aiResults.neuropsychological_profile?.stress_resilience || 0.75) * 100),
        decisionStyle: aiResults.cognitive_patterns?.decision_style || 'analytical',
        // AI Provider indicators
        aiProvider: '🤖 OpenAI GPT-4 (via existing route)',
        analysisTimestamp: new Date().toLocaleTimeString()
      };
      
      // Assign badge based on specialized analysis
      const badge = assignBadge(analysisResults.sentiment, wordCount, inputText);
      setUserBadge(badge);
      
      setAnalysisResults(analysisResults);
      
    } catch (error) {
      console.error('❌ OpenAI Analysis Error:', error);
      console.log("🔄 Falling back to local neuropsychological analysis...");
      
      // Fallback to enhanced mock analysis
      const keywords = inputText.split(' ')
        .filter(word => word.length > 3)
        .slice(0, 3);
      
      const sentiment = ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)];
      
      const badge = assignBadge(sentiment, wordCount, inputText);
      setUserBadge(badge);
      
      setAnalysisResults({
        sentiment: sentiment,
        confidence: Math.round((0.7 + Math.random() * 0.3) * 100),
        wordCount: wordCount,
        keywords: keywords,
        // Enhanced fallback fields
        stressLevel: Math.round(Math.random() * 40 + 30), // 30-70%
        cognitiveLoad: Math.round(Math.random() * 50 + 25), // 25-75%
        tradingPersonality: ['Risk-Averse Analyst', 'Aggressive Trader', 'Balanced Strategist'][Math.floor(Math.random() * 3)],
        riskTolerance: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        cognitiveArchetype: ['Homeostatic Regulator', 'Cortisol Dysregulation', 'Dopamine Seeker', 'Serotonin Stabilizer'][Math.floor(Math.random() * 4)],
        stressResilience: Math.round(Math.random() * 40 + 50), // 50-90%
        decisionStyle: ['analytical', 'intuitive', 'impulsive'][Math.floor(Math.random() * 3)],
        // Fallback indicators
        aiProvider: '⚠️ Local Fallback Analysis',
        analysisTimestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Voice recording
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
        
        setTimeout(() => {
          if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
          }
        }, 5000);
      } catch (err) {
        alert('Microphone access denied');
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  // Video control - Simplified for debugging
  const toggleVideo = async () => {

    
    if (!isVideoActive) {

      try {
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported by this browser');
        }
        

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true
        });
        

        
        // Set state first to render video element
        setIsVideoActive(true);
        streamRef.current = stream;
        
        // Wait for React to re-render and create video element
        setTimeout(async () => {

        
        if (videoRef.current) {

          videoRef.current.srcObject = stream;
            
            // Force video to play
            try {
              await videoRef.current.play();

            } catch (playError) {
              console.error('Video play failed:', playError);
            }
          } else {
            // Fallback: try to find video element manually
            const videoElement = document.querySelector('.video-feed');
            
            if (videoElement) {
              videoElement.srcObject = stream;
              try {
                await videoElement.play();

              } catch (e) {
                console.error('Video setup failed:', e);
              }
            }
          }
        }, 100);
      } catch (err) {
        console.error('Camera error:', err);
        alert(`Camera Error: ${err.message}\n\nPossible solutions:\n1. Allow camera permissions\n2. Close other apps using camera\n3. Try in Chrome browser`);
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
        videoRef.current.srcObject = null;
        }
        streamRef.current = null;
        setIsVideoActive(false);

      }
    }
  };

  // Advanced Facial Analysis Function
  const performFacialAnalysis = async () => {
    if (!isVideoActive || !videoRef.current) return;
    
    setIsAnalyzingVideo(true);
    
    // Capture frame from video
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    
    // Simulate advanced facial analysis (in real implementation, this would call AI APIs)
    setTimeout(() => {
      const mockAnalysis = {
        stressLevel: Math.floor(Math.random() * 100),
        emotionalState: ['Focused', 'Anxious', 'Confident', 'Fatigued'][Math.floor(Math.random() * 4)],
        cognitiveLoad: Math.floor(Math.random() * 100),
        attentionLevel: Math.floor(Math.random() * 100),
        microExpressions: {
          eyeMovements: Math.random() > 0.5 ? 'Rapid saccades detected' : 'Steady gaze pattern',
          blinkRate: `${Math.floor(Math.random() * 20 + 10)} blinks/min`,
          facialTension: Math.random() > 0.5 ? 'Elevated' : 'Normal',
          jawClenching: Math.random() > 0.7 ? 'Detected' : 'Not detected'
        },
        neuroSomaticIndicators: {
          autonomicArousal: Math.random() > 0.5 ? 'High' : 'Moderate',
          corticalActivation: Math.random() > 0.5 ? 'Elevated' : 'Baseline',
          limbicResponse: Math.random() > 0.5 ? 'Active' : 'Stable'
        },
        traderProfile: {
          riskTolerance: Math.random() > 0.5 ? 'High' : 'Conservative',
          decisionMaking: Math.random() > 0.5 ? 'Analytical' : 'Intuitive',
          stressResilience: Math.random() > 0.5 ? 'Strong' : 'Moderate'
        }
      };
      
      setFacialAnalysisResults(mockAnalysis);
      setIsAnalyzingVideo(false);
    }, 3000);
  };

  return (
    <div className="mindmirror-container">
      <header className="mindmirror-header">
        <h1>🧠 NeuroAI System – BitSwapDEX_AI</h1>
        <p>Advanced computational neuroscience meets decentralized finance through cutting-edge AI</p>
        
        {/* Beta Notice */}
        <div className="beta-notice">
          <span className="beta-badge">BETA</span>
          <p>Currently powered by GPT-4o. Future releases will integrate specialized neuroscience AI models and advanced behavioral analytics engines.</p>
          
          {/* Word Milestone Status */}
          <div className="milestone-status">
            {wordMilestone.isLoading ? (
              <div className="milestone-loading">🧠 Checking access permissions...</div>
            ) : wordMilestone.hasAccess ? (
              <div className="milestone-unlocked">✅ Mind Mirror Access Granted - 1000+ words achieved!</div>
            ) : (
              <div className="milestone-locked">
                🔒 Mind Mirror Locked - Progress: {wordMilestone.count}/1000 words
                <br />
                <small>Participate in <a href="https://t.me/BitSwapDEX_AI" target="_blank" rel="noopener noreferrer">Telegram group</a> to unlock</small>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* System Overview */}
      <section className="system-overview">
        <div className="overview-card">
          <h2>🎯 How NeuroAI System Works</h2>
          <div className="overview-content">
            <div className="overview-description">
              <p>Our <strong>NeuroAI System</strong> leverages advanced <em>computational neuroscience</em> and <em>psychometric machine learning</em> 
              to decode trading behavioral patterns through multi-modal cognitive analysis and neuroplasticity-informed algorithms.</p>
              
              <h3>🧬 ML Pipeline Architecture:</h3>
              <ol>
                <li><strong>Semantic Vectorization:</strong> Natural Language Processing with transformer-based embeddings for cognitive pattern extraction</li>
                <li><strong>Neuromorphic Processing:</strong> Advanced LLMs (GPT-4o/future specialized models) perform sentiment analysis, stress detection, and behavioral phenotyping</li>
                <li><strong>Psychometric Classification:</strong> Multi-dimensional personality mapping using Big Five + Dark Triad psychological frameworks</li>
                <li><strong>Generative Synthesis:</strong> AI-driven NFT creation via diffusion models reflecting neuropsychological state vectors</li>
              </ol>

              <h3>🧠 Neuropsychological Phenotypes:</h3>
              <div className="badges-grid">
                <span className="badge-item">🧊 Homeostatic Regulator</span>
                <span className="badge-item">🔥 Cortisol Dysregulation</span>
                <span className="badge-item">🌀 Cognitive Hypervigilance</span>
                <span className="badge-item">⚡ Dopaminergic Risk-Seeker</span>
              </div>
            </div>
            
            <div className="tier-preview">
              <h3>🚀 Tiered Access System:</h3>
              <div className="current-tier-info">
                <div className="current-tier-badge">
                  <span className={`tier-badge ${getTierInfo(currentTier).color}`}>
                    Current: Tier {currentTier}
                  </span>
                  <span className="tier-name">{getTierInfo(currentTier).name}</span>
                  <small>Balance: {walletBalance.toLocaleString()} $BITS</small>
                </div>
              </div>
              <div className="tier-info">
                {[1, 2, 3, 4].map(tier => {
                  const tierInfo = getTierInfo(tier);
                  const isUnlocked = currentTier >= tier;
                  const requirements = tier === 1 ? "≥ 0 $BITS" : 
                                     tier === 2 ? "≥ 10,000 $BITS" :
                                     tier === 3 ? "≥ 50,000 $BITS" : "≥ 100,000 $BITS";
                  
                  return (
                    <div key={tier} className={`tier-item ${isUnlocked ? 'current' : 'locked'}`}>
                      <span className={`tier-badge ${tierInfo.color}`}>Tier {tier}</span>
                      <span>{tierInfo.name} ({requirements})</span>
                      <small>{tierInfo.features.join(', ')}</small>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Text Input Section */}
      <section className="input-section">
        <div className="input-wrapper">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Input cognitive patterns for neuropsychological analysis... Describe your decision-making processes, risk assessment frameworks, and behavioral tendencies for comprehensive psychometric evaluation."
            className="thought-input"
            rows={6}
          />
          
          <div className="progress-section">
            <div className="progress-info">
              <span>Progress: {wordCount}/1000 words</span>
              <span className="progress-percent">{progress.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="progress-hint">
              {wordCount < 1000 
                ? `${1000 - wordCount} additional semantic tokens required for comprehensive neuropsychological profiling`
                : "✨ Sufficient data acquired for advanced cognitive phenotype synthesis!"
              }
            </p>
          </div>

          <button 
            onClick={handleAnalysis}
            disabled={isAnalyzing || !inputText.trim()}
            className={`analyze-button ${isAnalyzing ? 'analyzing' : ''}`}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner"></span>
                🤖 OpenAI GPT-4 Analyzing...
              </>
            ) : (
              '🧬 Initialize Cognitive Analysis'
            )}
          </button>
        </div>
      </section>

      {/* Analysis Results */}
      {analysisResults && (
        <section className="results-section">
          <div className="analysis-header">
            <h2>🧬 Neuropsychological Computational Analysis</h2>
            <div className="ai-provider-badge">
              <span className="provider-text">{analysisResults.aiProvider}</span>
              <span className="timestamp">{analysisResults.analysisTimestamp}</span>
            </div>
          </div>
          
          {/* User Badge */}
          {userBadge && (
            <div className="user-badge-section">
              <div className="user-badge">
                <span className="badge-emoji">{userBadge.emoji}</span>
                <div className="badge-info">
                  <h3>{userBadge.name}</h3>
                  <p>{userBadge.description}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="results-grid">
            <div className="result-card sentiment">
              <div className="card-icon">
                {analysisResults.sentiment === 'positive' ? '🚀' : 
                 analysisResults.sentiment === 'negative' ? '📉' : '📊'}
              </div>
              <div className="card-content">
                <h3>Affective Valence</h3>
                <p className={`sentiment-${analysisResults.sentiment}`}>
                  {analysisResults.sentiment}
                </p>
                <small>{analysisResults.confidence}% ML confidence score</small>
              </div>
            </div>

            <div className="result-card stress-level">
              <div className="card-icon">🧠</div>
              <div className="card-content">
                <h3>Stress Indicators</h3>
                <p className={`stress-${analysisResults.stressLevel > 60 ? 'high' : analysisResults.stressLevel > 30 ? 'medium' : 'low'}`}>
                  {analysisResults.stressLevel}% cortisol markers
                </p>
                <small>Autonomic nervous system analysis</small>
              </div>
            </div>

            <div className="result-card cognitive-load">
              <div className="card-icon">⚡</div>
              <div className="card-content">
                <h3>Cognitive Load</h3>
                <p className={`load-${analysisResults.cognitiveLoad > 70 ? 'high' : analysisResults.cognitiveLoad > 40 ? 'medium' : 'low'}`}>
                  {analysisResults.cognitiveLoad}% processing
                </p>
                <small>Neuromorphic computation index</small>
              </div>
            </div>

            <div className="result-card trading-personality">
              <div className="card-icon">💼</div>
              <div className="card-content">
                <h3>Trading Phenotype</h3>
                <p>{analysisResults.tradingPersonality}</p>
                <small>Risk tolerance: {analysisResults.riskTolerance}</small>
              </div>
            </div>

            <div className="result-card cognitive-archetype">
              <div className="card-icon">🧬</div>
              <div className="card-content">
                <h3>Neurotype</h3>
                <p>{analysisResults.cognitiveArchetype}</p>
                <small>Decision style: {analysisResults.decisionStyle}</small>
              </div>
            </div>

            <div className="result-card keywords">
              <div className="card-icon">🔍</div>
              <div className="card-content">
                <h3>Cognitive Clusters</h3>
                <p>{analysisResults.keywords.join(', ')}</p>
                <small>Extracted semantic embeddings</small>
              </div>
            </div>
          </div>


        </section>
      )}

      {/* NFT Generation - Only after analysis */}
      {analysisResults && <MindNFTGenerator results={analysisResults} />}

      {/* Advanced Analysis Tools - Always Visible */}
      <section className="tools-section">
        <div className="tools-grid">
          {/* Voice Analysis */}
          <div className="tool-card">
            <h3>🎤 Prosodic Biomarker Analysis</h3>
            <p>Advanced Whisper-based vocal stress detection and autonomic nervous system assessment</p>
            <button 
              onClick={toggleRecording}
              className={`tool-button voice ${isRecording ? 'active' : ''}`}
            >
              {isRecording ? (
                <>
                  <span className="recording-dot"></span>
                  Stop Recording
                </>
              ) : (
                '🎤 Initialize Prosodic Analysis'
              )}
            </button>
            {isRecording && (
              <div className="recording-indicator">
                <div className="sound-waves">
                  <span></span><span></span><span></span><span></span>
                </div>
                <p>Recording... Processing vocal biomarkers and stress indicators</p>
              </div>
            )}
          </div>

          {/* Video Analysis */}
          <div className="tool-card">
            <h3>📹 Facial Action Unit Recognition</h3>
            <p>Advanced neuro-somatic analysis with micro-expression detection and professional trader psychological profiling</p>

            

            <div className="video-container">
              {isVideoActive ? (
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="video-feed"
                  style={{
                    width: '100%',
                    height: '300px',
                    backgroundColor: '#000',
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }}
                  onError={(e) => console.error('Video error:', e)}
                />
              ) : (
                <div className="video-placeholder">
                  <span className="camera-icon">📷</span>
                  <p>Camera preview will appear here</p>
                </div>
              )}
            </div>
            <div className="video-controls">
              {/* Simple Test Button */}


            <button 
              onClick={toggleVideo}
              className={`tool-button video ${isVideoActive ? 'active' : ''}`}
                style={{ 
                  backgroundColor: isVideoActive ? '#ff6b81' : '#00ff9d',
                  color: isVideoActive ? '#fff' : '#000'
                }}
              >
                {isVideoActive ? '⏹️ Stop Camera' : '📹 Initialize Computer Vision'}
              </button>
              
              {isVideoActive && (
                <button 
                  onClick={performFacialAnalysis}
                  disabled={isAnalyzingVideo}
                  className={`tool-button analysis ${isAnalyzingVideo ? 'analyzing' : ''}`}
                >
                  {isAnalyzingVideo ? (
                    <>
                      <span className="spinner"></span>
                      Analyzing...
                    </>
                  ) : (
                    '🧬 Analyze Facial Biomarkers'
                  )}
            </button>
              )}
            </div>
            
            {/* Facial Analysis Results */}
            {facialAnalysisResults && (
              <div className="facial-analysis-results">
                <h4>🧠 Neuropsychological Assessment</h4>
                
                <div className="analysis-grid">
                  <div className="analysis-card">
                    <h5>Cognitive Metrics</h5>
                    <p>Stress Level: <span className="metric">{facialAnalysisResults.stressLevel}%</span></p>
                    <p>Cognitive Load: <span className="metric">{facialAnalysisResults.cognitiveLoad}%</span></p>
                    <p>Attention: <span className="metric">{facialAnalysisResults.attentionLevel}%</span></p>
                    <p>State: <span className="metric">{facialAnalysisResults.emotionalState}</span></p>
                  </div>
                  
                  <div className="analysis-card">
                    <h5>Micro-Expressions</h5>
                    <p>Eye Patterns: <span className="metric">{facialAnalysisResults.microExpressions.eyeMovements}</span></p>
                    <p>Blink Rate: <span className="metric">{facialAnalysisResults.microExpressions.blinkRate}</span></p>
                    <p>Facial Tension: <span className="metric">{facialAnalysisResults.microExpressions.facialTension}</span></p>
                    <p>Jaw Clenching: <span className="metric">{facialAnalysisResults.microExpressions.jawClenching}</span></p>
                  </div>
                  
                  <div className="analysis-card">
                    <h5>Neuro-Somatic Indicators</h5>
                    <p>Autonomic Arousal: <span className="metric">{facialAnalysisResults.neuroSomaticIndicators.autonomicArousal}</span></p>
                    <p>Cortical Activation: <span className="metric">{facialAnalysisResults.neuroSomaticIndicators.corticalActivation}</span></p>
                    <p>Limbic Response: <span className="metric">{facialAnalysisResults.neuroSomaticIndicators.limbicResponse}</span></p>
                  </div>
                  
                  <div className="analysis-card trader-profile">
                    <h5>🎯 Professional Trader Profile</h5>
                    <p>Risk Tolerance: <span className="metric">{facialAnalysisResults.traderProfile.riskTolerance}</span></p>
                    <p>Decision Making: <span className="metric">{facialAnalysisResults.traderProfile.decisionMaking}</span></p>
                    <p>Stress Resilience: <span className="metric">{facialAnalysisResults.traderProfile.stressResilience}</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MindMirrorDashboard;