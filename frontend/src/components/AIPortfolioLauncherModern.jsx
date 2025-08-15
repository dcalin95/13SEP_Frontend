import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GA4_HELPERS } from '../config/googleAnalytics';

export default function AIPortfolioLauncherModern() {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunch = () => {
    try {
      GA4_HELPERS.trackEvent('ai_portfolio_launcher_modern_click');
    } catch {}
    navigate('/ai-portfolio');
  };

  const neuralSteps = [
    "🧠 AI Ready",
    "📊 Analyzing Markets", 
    "⚡ Processing Data",
    "✨ Ready to Build"
  ];

  return (
    <div 
      className="ai-portfolio-launcher-modern"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleLaunch}
      style={{
        position: 'relative',
        padding: '30px',
        background: `
          linear-gradient(135deg, 
            rgba(0, 0, 0, 0.8) 0%, 
            rgba(0, 212, 255, 0.05) 50%, 
            rgba(123, 104, 238, 0.05) 100%
          )
        `,
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? `
            0 20px 40px rgba(0, 212, 255, 0.15),
            0 0 60px rgba(0, 212, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          ` 
          : `
            0 8px 25px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
        overflow: 'hidden',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Neural network background animation */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: isHovered ? 0.1 : 0.05,
          transition: 'opacity 0.3s ease',
          background: `
            radial-gradient(circle at 20% 20%, rgba(0, 212, 255, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(123, 104, 238, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 10%, rgba(255, 107, 157, 0.2) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }}
      />

      {/* Animated border glow */}
      <div 
        style={{
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px',
          bottom: '-2px',
          borderRadius: '22px',
          background: `
            linear-gradient(45deg, 
              #00D4FF, #7B68EE, #FF6B9D, #FFD700, 
              #00D4FF, #7B68EE, #FF6B9D, #FFD700
            )
          `,
          backgroundSize: '400% 400%',
          opacity: isHovered ? 0.6 : 0,
          transition: 'opacity 0.3s ease',
          animation: isHovered ? 'borderRotate 3s linear infinite' : 'none',
          zIndex: -1
        }}
      />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header with AI status */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px'
          }}>
            <div style={{ 
              fontSize: '2.5rem',
              animation: isHovered ? 'brainPulse 1.5s ease-in-out infinite' : 'brainFloat 3s ease-in-out infinite',
              filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.5))'
            }}>
              🧠
            </div>
            <div>
              <h3 style={{ 
                margin: '0 0 5px 0', 
                color: '#ffffff',
                fontSize: '1.8rem',
                fontWeight: '800',
                background: 'linear-gradient(45deg, #00D4FF, #7B68EE, #FF6B9D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px'
              }}>
                AI Portfolio
              </h3>
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.8rem',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Neural Architecture
              </div>
            </div>
          </div>

          {/* AI Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(0, 255, 136, 0.1)',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            borderRadius: '20px',
            fontSize: '0.8rem',
            color: '#00FF88'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#00FF88',
              animation: 'statusPulse 2s ease-in-out infinite'
            }}></div>
            {neuralSteps[animationStep]}
          </div>
        </div>
        
        {/* Description */}
        <p style={{ 
          margin: '0 0 25px 0', 
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: '1rem',
          lineHeight: '1.6',
          fontWeight: '400'
        }}>
          Advanced AI algorithms analyze market conditions, risk patterns, and optimal asset allocation to create your personalized investment strategy.
        </p>

        {/* Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
          marginBottom: '25px'
        }}>
          {[
            { icon: '⚡', text: 'Instant Analysis' },
            { icon: '🎯', text: 'Risk Optimized' },
            { icon: '📈', text: 'Market Adaptive' }
          ].map((feature, index) => (
            <div key={index} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '15px 10px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
            }}>
              <span style={{ fontSize: '1.5rem' }}>{feature.icon}</span>
              <span style={{ 
                fontSize: '0.8rem', 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>
        
        {/* CTA Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '15px 20px',
          background: 'rgba(0, 212, 255, 0.1)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          ...(isHovered && {
            background: 'rgba(0, 212, 255, 0.15)',
            borderColor: 'rgba(0, 212, 255, 0.5)',
            transform: 'translateX(2px)'
          })
        }}>
          <div>
            <div style={{
              color: '#ffffff',
              fontSize: '1.1rem',
              fontWeight: '700',
              marginBottom: '3px'
            }}>
              Build Smart Portfolio
            </div>
            <div style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.85rem'
            }}>
              Powered by GPT-4 & Real-time Data
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#00D4FF',
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            <span>Launch</span>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #00D4FF, #7B68EE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease',
              transform: isHovered ? 'translateX(5px) rotate(45deg)' : 'translateX(0) rotate(0deg)'
            }}>
              <span style={{ 
                color: '#ffffff', 
                fontSize: '0.9rem',
                transform: isHovered ? 'rotate(-45deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>
                →
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes brainPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.5)); }
          50% { transform: scale(1.1); filter: drop-shadow(0 0 30px rgba(0, 212, 255, 0.8)); }
        }
        @keyframes brainFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
        @keyframes borderRotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
