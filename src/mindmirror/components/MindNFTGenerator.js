import React, { useState, useContext } from 'react';
import WalletContext from '../../context/WalletContext';
import emailService from '../../services/emailService';

const MindNFTGenerator = ({ results }) => {
  const { walletAddress, walletName } = useContext(WalletContext);
  const [nftGenerated, setNftGenerated] = useState(false);
  const [nftImage, setNftImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailOption, setShowEmailOption] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [nftType, setNftType] = useState('basic'); // 'basic' or 'personalized'
  const [wordAnalysisData, setWordAnalysisData] = useState(null);

    // Post-process DALL-E image with guaranteed branding overlay
  const addBrandingOverlay = async (imageUrl, userInfo) => {
    try {
      console.log('🎨 Adding branding overlay to NFT...');
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Load the DALL-E image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw the original DALL-E image
            ctx.drawImage(img, 0, 0);
            
            // Add branding overlays
            await addTextOverlays(ctx, canvas, userInfo);
            await addBitsLogo(ctx, canvas);
            
            // Convert to data URL
            const processedImageUrl = canvas.toDataURL('image/png', 1.0);
            console.log('✅ Branding overlay added successfully!');
            resolve(processedImageUrl);
            
          } catch (error) {
            console.error('❌ Error adding overlay:', error);
            resolve(imageUrl); // Fallback to original image
          }
        };
        
        img.onerror = () => {
          console.error('❌ Failed to load DALL-E image');
          resolve(imageUrl); // Fallback to original image
        };
        
        img.src = imageUrl;
      });
      
    } catch (error) {
      console.error('❌ Post-processing failed:', error);
      return imageUrl; // Fallback to original image
    }
  };

  // Add text overlays (username, wallet, BitSwapDEX AI)
  const addTextOverlays = async (ctx, canvas, userInfo) => {
    const { username, walletAddress } = userInfo;
    
    console.log('📝 Adding text overlays...');
    console.log('👤 Username:', username);
    console.log('💳 Wallet:', walletAddress ? `${walletAddress.substring(0, 6)}...` : 'None');
    
    // Bottom right - User info
    if (username || walletAddress) {
      ctx.save();
      
      // Semi-transparent background for readability
      const padding = 15;
      const bgHeight = 80; // Increased height for date/time
      const bgWidth = 220; // Increased width for longer text
      const bgX = canvas.width - bgWidth - 20;
      const bgY = canvas.height - bgHeight - 20;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
      
      // Border glow
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);
      
      // Username (top line)
      if (username) {
        ctx.fillStyle = '#00ff9d';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(username, canvas.width - 30, canvas.height - 55);
      }
      
      // Wallet address (middle line)
      if (walletAddress) {
        const shortWallet = walletAddress.length > 10 ? 
          `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 
          walletAddress;
        ctx.fillStyle = '#888888';
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(shortWallet, canvas.width - 30, canvas.height - 35);
      }
      
      // Date and time (bottom line)
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      const dateTimeStr = `${dateStr} ${timeStr}`;
      
      console.log('📅 Adding date/time:', dateTimeStr);
      
      ctx.fillStyle = '#666666';
      ctx.font = '10px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(dateTimeStr, canvas.width - 30, canvas.height - 15);
      
      ctx.restore();
    }
    
    // Bottom left - BitSwapDEX AI watermark
    ctx.save();
    
    const watermarkText = 'BitSwapDEX AI';
    ctx.fillStyle = 'rgba(0, 163, 255, 0.8)';
    ctx.font = 'bold 18px "Arial", sans-serif';
    ctx.textAlign = 'left';
    
    // Add glow effect
    ctx.shadowColor = '#00a3ff';
    ctx.shadowBlur = 10;
    ctx.fillText(watermarkText, 30, canvas.height - 30);
    
    ctx.restore();
  };

  // Get word analysis for personalized NFT generation
  const getWordAnalysis = async (userInfo) => {
    try {
      const { walletAddress } = userInfo;
      
      if (!walletAddress) {
        throw new Error('Wallet address required for word analysis');
      }

      console.log('📡 Fetching word analysis from backend...');
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'https://backend-server-f82y.onrender.com'}/api/word-analysis/analyze-user-words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No words found for user - using basic NFT style');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Word analysis failed');
      }

      console.log(`📊 Word analysis successful: ${data.wordCount} words analyzed`);
      console.log('🎨 Visual style:', data.visualStyle.primaryStyle);
      
      return data;

    } catch (error) {
      console.log('⚠️ Word analysis error:', error.message);
      throw error;
    }
  };

  // Add BITS logo from favicon
  const addBitsLogo = async (ctx, canvas) => {
    try {
      console.log('🪙 Adding BITS logo...');
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        logo.onload = () => {
          try {
            // Position logo in top right corner
            const logoSize = 40;
            const logoX = canvas.width - logoSize - 20;
            const logoY = 20;
            
            // Add semi-transparent background
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
            
            // Draw logo
            ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            ctx.restore();
            
            console.log('✅ BITS logo added successfully!');
          } catch (error) {
            console.error('❌ Error adding BITS logo:', error);
          }
          resolve();
        };
        
        logo.onerror = () => {
          console.error('❌ Failed to load BITS logo');
          resolve();
        };
        
        // Try to load favicon
        logo.src = '/favicon.ico';
      });
      
    } catch (error) {
      console.error('❌ BITS logo loading failed:', error);
    }
  };

  const generateNFT = async () => {
    setIsGenerating(true);
    
    try {
      console.log('🎨 Starting REAL OpenAI DALL-E NFT generation...');
      
      // Prepare user info for branding
      const userInfo = {
        username: walletName || 'Anonymous',
        walletAddress: walletAddress
      };

      console.log('👤 Generating NFT for user:', userInfo.username, userInfo.walletAddress ? `(${userInfo.walletAddress.substring(0, 6)}...)` : '');

      // Try to get word analysis for personalized NFT
      let wordAnalysis = null;
      try {
        console.log('🔍 Attempting to get word analysis for personalized NFT...');
        wordAnalysis = await getWordAnalysis(userInfo);
        if (wordAnalysis) {
          console.log('✅ Word analysis obtained:', wordAnalysis.visualStyle?.primaryStyle);
          setNftType('personalized');
          setWordAnalysisData(wordAnalysis);
        }
      } catch (error) {
        console.log('⚠️ Word analysis not available, using basic style:', error.message);
        setNftType('basic');
        setWordAnalysisData(null);
      }

      // Call backend DALL-E API with word analysis
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'https://backend-server-f82y.onrender.com'}/api/dalle-nft/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisResults: results,
          userInfo: userInfo,
          wordAnalysis: wordAnalysis
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.nft || !data.nft.imageUrl) {
        throw new Error('Invalid NFT generation response');
      }

      console.log('✅ DALL-E NFT generated successfully!', data.nft.imageUrl);
      
      // Post-process the image with guaranteed branding overlay
      console.log('🔄 Starting branding overlay process...');
      console.log('👤 User info for branding:', userInfo);
      
      const processedImageUrl = await addBrandingOverlay(data.nft.imageUrl, userInfo);
      
      console.log('🎨 Branding process completed');
      console.log('📸 Original URL:', data.nft.imageUrl);
      console.log('🖼️ Processed URL type:', processedImageUrl.startsWith('data:') ? 'Canvas Data URL' : 'External URL');
      
      // Set the processed image
      setNftImage(processedImageUrl);
      setNftGenerated(true);
      
    } catch (error) {
      console.error('❌ NFT Generation failed:', error);
      alert(`❌ Failed to generate NFT: ${error.message}\n\nPlease try again or contact support.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email.trim()) {
      alert('⚠️ Please enter a valid email address!');
      return;
    }

    if (!emailService.validateEmail(email)) {
      alert('⚠️ Please enter a valid email address!');
      return;
    }

    setIsSending(true);
    try {
      console.log('📧 Sending NFT via email...');
      
      // Prepare email data
      const emailData = emailService.formatNFTEmailData(
        email,
        nftImage,
        {
          username: walletName || 'Anonymous',
          walletAddress: walletAddress
        },
        {
          wordCount: wordAnalysisData?.wordCount || 0,
          visualStyle: wordAnalysisData?.visualStyle?.primaryStyle || 'basic',
          timestamp: new Date().toISOString()
        }
      );

      // Send email
      await emailService.sendNFT(emailData);
      
      alert(`🎉 Your neuropsychological NFT has been sent successfully to ${email}!\n\n✨ Check your inbox for your unique and irreproducible NFT.`);
      setEmail('');
      setShowEmailOption(false);
      
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      alert(`❌ Failed to send email: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const downloadNFT = async () => {
    try {
      console.log('💾 Starting NFT download...');
      
      // Check if it's a data URL (processed image) or external URL
      if (nftImage.startsWith('data:')) {
        // Data URL - direct download
        const link = document.createElement('a');
        link.href = nftImage;
        link.download = `BitSwapDEX_AI_NFT_${Date.now()}.png`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ NFT downloaded successfully (data URL)');
      } else {
        // External URL - fetch and convert to blob
        const response = await fetch(nftImage, { mode: 'cors' });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `BitSwapDEX_AI_NFT_${Date.now()}.png`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log('✅ NFT downloaded successfully (external URL)');
      }
      
      alert('💾 NFT has been saved locally!\n\n⚠️ ATTENTION: This NFT is unique and irreproducible. Keep it safe!');
      
    } catch (error) {
      console.error('❌ Download failed:', error);
      alert('❌ Failed to download NFT automatically.\n\nPlease try right-clicking on the image and select "Save Image As..."');
    }
  };

  if (!results) return null;

  return (
    <div className="nft-generator-container">
      {!nftGenerated ? (
        <div className="nft-generation-prompt">
          <div className="nft-prompt-header">
            <h3>🧬 Generate Neuropsychological NFT</h3>
            <p className="nft-prompt-description">
              Transform your neuropsychological analysis into a <strong>unique and irreproducible NFT</strong> 
              generated with advanced OpenAI GPT-4 artificial intelligence.
            </p>
          </div>
          
          <div className="nft-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>IMPORTANT:</strong> The NFT is generated only once and is completely unique. 
              It cannot be reproduced or regenerated. Save it immediately after generation!
            </div>
          </div>
          
          <button 
            className="generate-nft-btn"
            onClick={generateNFT}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="loading-spinner">🔄</span>
                Generating NFT with OpenAI...
              </>
            ) : (
              <>
                <span className="ai-icon">🤖</span>
                Generate Neuropsychological NFT
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="nft-display">
          <div className="nft-header">
            <h3>✨ Your Neuropsychological NFT</h3>
            <p className="nft-subtitle">
              Your cognitive profile and trading psychology captured as a unique digital asset
            </p>
            
            {/* NFT Type Indicator */}
            <div className={`nft-type-indicator ${nftType}`}>
              {nftType === 'personalized' ? (
                <>
                  <span className="type-icon">🧬</span>
                  <div className="type-info">
                    <strong>Personalized NFT</strong>
                    <small>Based on {wordAnalysisData?.wordCount || 0} words analysis</small>
                    <small>Style: {wordAnalysisData?.visualStyle?.primaryStyle?.replace('_', ' ') || 'Custom'}</small>
                  </div>
                </>
              ) : (
                <>
                  <span className="type-icon">⚡</span>
                  <div className="type-info">
                    <strong>Basic NFT</strong>
                    <small>Standard neuropsychological visualization</small>
                    <small>Collect 1000 words for personalized NFTs</small>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="nft-preview-container">
            <img src={nftImage} alt="Neuropsychological NFT" className="nft-image" />
          </div>
          
          <div className="nft-actions">
            <button className="download-btn" onClick={downloadNFT}>
              💾 Download NFT
            </button>
            
            <button 
              className="email-btn" 
              onClick={() => setShowEmailOption(!showEmailOption)}
            >
              📧 Send to Email
            </button>
          </div>

          {showEmailOption && (
            <div className="email-section">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
                disabled={isSending}
              />
              <button 
                className="send-email-btn"
                onClick={handleSendEmail}
                disabled={isSending || !email.trim()}
              >
                {isSending ? '📤 Sending...' : '🚀 Send NFT'}
              </button>
            </div>
          )}
          
          <div className="nft-uniqueness-warning">
            <div className="uniqueness-icon">🔒</div>
            <p>
              <strong>Unique & Irreproducible NFT:</strong> This digital asset was generated only once 
              based on your specific neuropsychological analysis. It cannot be reproduced or regenerated.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindNFTGenerator;
