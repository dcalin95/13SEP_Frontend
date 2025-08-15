import React, { useState, useEffect } from 'react';
import AccessibilityPanel from './AccessibilityPanel';
import './UIControls.css';

const UIControls = ({ position = 'bottom-right', showLabels = false }) => {
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false); // Show based on scroll position

  // Show/hide scroll to top button based on scroll position
  useEffect(() => {
    let timeoutId;
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollTop = window.pageYOffset || 
                         document.documentElement.scrollTop || 
                         document.body.scrollTop;
        
        console.log('Current scroll position:', scrollTop);
        setShowScrollTop(scrollTop > 200); // Show after scrolling 200px
      }, 10); // Debounce
    };

    // Initial check
    handleScroll();
    
    // Multiple event listeners for maximum compatibility
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also try on main content containers
    const containers = document.querySelectorAll('[class*="content"], [class*="main"], main, .app');
    containers.forEach(container => {
      container.addEventListener('scroll', handleScroll, { passive: true });
    });
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      containers.forEach(container => {
        container.removeEventListener('scroll', handleScroll);
      });
    };
  }, []);

  const openAccessibility = () => {
    setIsAccessibilityOpen(true);
  };

  const closeAccessibility = () => {
    setIsAccessibilityOpen(false);
  };

  return (
    <>
      {/* Main UI Controls - Only Accessibility */}
      <div className={`ui-controls ui-controls--${position}`}>
        {/* Accessibility Button */}
        <div className="ui-controls__item">
          <button
            className="ui-controls__button ui-controls__button--accessibility"
            onClick={openAccessibility}
            aria-label="Open accessibility settings"
            title="Accessibility Settings"
          >
            <span className="ui-controls__icon">♿</span>
            {showLabels && (
              <span className="ui-controls__label">Accessibility</span>
            )}
          </button>
        </div>
      </div>

      {/* Separate Scroll to Top Button */}
      {showScrollTop && (
        <div className="scroll-to-top-container">
          <button
            className="ui-controls__button ui-controls__button--quick scroll-to-top-btn"
            onClick={(e) => {
              e.preventDefault();
              console.log('🚀 Scroll to top clicked!');
              
              // Debug current scroll position
              const currentScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
              console.log('Current scroll before action:', currentScroll);
              
              // Multiple scroll methods for maximum compatibility
              try {
                // Method 1: Modern browsers
                window.scrollTo({ 
                  top: 0, 
                  left: 0,
                  behavior: 'smooth' 
                });
                console.log('✅ Used smooth scrollTo');
              } catch (error) {
                console.log('❌ Method 1 failed, trying fallback');
                try {
                  // Method 2: Fallback
                  document.documentElement.scrollTop = 0;
                  document.body.scrollTop = 0;
                  console.log('✅ Used fallback scroll');
                } catch (error2) {
                  // Method 3: Ultimate fallback
                  window.scrollTo(0, 0);
                  console.log('✅ Used ultimate fallback');
                }
              }
              
              // Visual feedback
              const button = e.currentTarget;
              button.style.transform = 'scale(0.9)';
              setTimeout(() => {
                button.style.transform = '';
                
                // Check final scroll position
                const finalScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
                console.log('Final scroll position:', finalScroll);
              }, 150);
            }}
            aria-label="Scroll to top"
            title="Scroll to Top"
          >
            <span className="ui-controls__icon">⬆️</span>
            {showLabels && (
              <span className="ui-controls__label">Top</span>
            )}
          </button>
        </div>
      )}

      {/* Accessibility Panel */}
      <AccessibilityPanel 
        isOpen={isAccessibilityOpen} 
        onClose={closeAccessibility} 
      />
    </>
  );
};

export default UIControls; 