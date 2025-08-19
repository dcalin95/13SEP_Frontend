import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AccessibilityPanel from './AccessibilityPanel';
import './MobileFloatingUIManager.css';

const MobileFloatingUIManager = ({
  onOpenCrypto,
  onOpenMarketing
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState(null);
  const navigate = useNavigate();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
             window.innerWidth <= 768 ||
             ('ontouchstart' in window) ||
             (navigator.maxTouchPoints > 0);
    };
    
    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-hide functionality - only on mobile
  useEffect(() => {
    if (!isMobile) return;

    // Clear existing timer
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }

    // Only auto-hide if expanded
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 4000); // Hide after 4 seconds

      setAutoHideTimer(timer);
    }

    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [isExpanded, isMobile]);

  // Show/hide scroll to top button based on scroll position
  useEffect(() => {
    let timeoutId;
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollTop = window.pageYOffset || 
                         document.documentElement.scrollTop || 
                         document.body.scrollTop;
        
        setShowScrollTop(scrollTop > 200);
      }, 10);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle expand/collapse
  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle button clicks and auto-collapse on mobile
  const handleButtonClick = (action) => {
    action();
    if (isMobile) {
      setIsExpanded(false);
    }
  };

  // Scroll to top function
  const scrollToTop = () => {
    try {
      window.scrollTo({ 
        top: 0, 
        left: 0,
        behavior: 'smooth' 
      });
    } catch (error) {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  // If not mobile, render nothing (let individual components handle themselves)
  if (!isMobile) {
    return (
      <>
        {/* Separate Scroll to Top Button for desktop */}
        {showScrollTop && (
          <div className="desktop-scroll-to-top">
            <button
              className="scroll-to-top-btn desktop"
              onClick={scrollToTop}
              aria-label="Scroll to top"
              title="Scroll to Top"
            >
              ⬆️
            </button>
          </div>
        )}
        
        {/* Accessibility Panel */}
        <AccessibilityPanel 
          isOpen={isAccessibilityOpen} 
          onClose={() => setIsAccessibilityOpen(false)} 
        />
      </>
    );
  }

  return (
    <>
      <div className="mobile-floating-ui-manager">
        <AnimatePresence>
          {/* Floating Action Buttons - Only when expanded */}
          {isExpanded && (
            <motion.div
              className="floating-buttons-container"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, staggerChildren: 0.1 }}
            >
              {/* AI Marketing Button */}
              <motion.button
                className="floating-btn ai-marketing"
                onClick={() => handleButtonClick(onOpenMarketing)}
                title="AI Marketing Dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  📊
                </motion.div>
              </motion.button>

              {/* AI Crypto Button */}
              <motion.button
                className="floating-btn ai-crypto"
                onClick={() => handleButtonClick(onOpenCrypto)}
                title="AI Crypto Analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  🚀
                </motion.div>
              </motion.button>

              {/* AI Portfolio Button */}
              <motion.button
                className="floating-btn ai-portfolio"
                onClick={() => handleButtonClick(() => navigate('/ai-portfolio'))}
                title="AI Portfolio Builder"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  🧠
                </motion.div>
              </motion.button>

              {/* Accessibility Button */}
              <motion.button
                className="floating-btn accessibility"
                onClick={() => handleButtonClick(() => setIsAccessibilityOpen(true))}
                title="Accessibility Settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ♿
              </motion.button>

              {/* Scroll to Top Button - when needed */}
              {showScrollTop && (
                <motion.button
                  className="floating-btn scroll-top"
                  onClick={() => handleButtonClick(scrollToTop)}
                  title="Scroll to Top"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ⬆️
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hamburger Menu Button - Always visible */}
        <motion.button
          className={`hamburger-menu-btn ${isExpanded ? 'expanded' : 'collapsed'}`}
          onClick={handleToggleExpanded}
          title={isExpanded ? 'Hide menu' : 'Show menu'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            rotate: isExpanded ? 0 : 180,
          }}
          transition={{ duration: 0.3 }}
        >
          <motion.div className="hamburger-lines">
            <motion.span
              className="line line1"
              animate={{
                rotate: isExpanded ? 0 : 45,
                y: isExpanded ? 0 : 6,
              }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="line line2"
              animate={{
                opacity: isExpanded ? 1 : 0,
                scale: isExpanded ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="line line3"
              animate={{
                rotate: isExpanded ? 0 : -45,
                y: isExpanded ? 0 : -6,
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </motion.button>
      </div>

      {/* Accessibility Panel */}
      <AccessibilityPanel 
        isOpen={isAccessibilityOpen} 
        onClose={() => setIsAccessibilityOpen(false)} 
      />
    </>
  );
};

export default MobileFloatingUIManager;
