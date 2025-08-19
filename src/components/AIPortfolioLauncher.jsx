import React, { Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const AIPortfolioBuilder = React.lazy(() => import('../ai-portfolio/AIPortfolioBuilder'));

export default function AIPortfolioLauncher() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  // Always dock to bottom-right (safe-area aware)
  const [dock, setDock] = useState({ right: 24, bottom: 96 });
  const [isMobile, setIsMobile] = useState(false);
  const isOnDedicatedPage = location?.pathname === '/ai-portfolio';
  // Close on ESC when drawer is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  
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

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Respect iOS safe-area and keep constant docking to bottom-right
  useEffect(() => {
    const compute = () => {
      const supportsEnv = typeof window !== 'undefined' && window.CSS && typeof window.CSS.supports === 'function' && window.CSS.supports('right', 'env(safe-area-inset-right)');
      const safeRight = supportsEnv ? 0 : 0; // keep 0 for now; adjust if needed per platform
      // Leave room for the Accessibility bubble in the corner
      setDock({ right: 24 + safeRight, bottom: 96 });
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  if (isOnDedicatedPage) return null; // avoid duplicate when on dedicated page
  if (isMobile) return null; // on mobile, handled by MobileFloatingUIManager
  return (
    <div style={{ position:'fixed', right: dock.right, bottom: dock.bottom, zIndex: 5000 }}>
      {!open && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
          <button onClick={() => setOpen(true)} style={{ padding:'10px 16px', borderRadius: 999, background:'#0052ff', color:'#fff', border:'none', boxShadow:'0 8px 24px rgba(0,82,255,.35)' }}>
            AI Portfolio
          </button>
        </div>
      )}
      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', backdropFilter:'blur(2px)', zIndex: 70 }} />
          {/* Drawer */}
          <div role="dialog" aria-modal="true" style={{ position:'fixed', top: 16, right: 16, bottom: 16, width: 420, maxWidth: '92vw', zIndex: 80, display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(10,12,20,.9)', borderTopLeftRadius:14, borderTopRightRadius:14, color:'#e8eefc', padding:'10px 14px', boxShadow:'0 10px 24px rgba(0,0,0,.35)' }}>
              <div style={{ fontWeight:600 }}>AI Smart Portfolio</div>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ background:'transparent', color:'#fff', border:'none', fontSize:20, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ background:'rgba(10,12,20,.9)', borderBottomLeftRadius:14, borderBottomRightRadius:14, padding:12, boxShadow:'0 12px 36px rgba(0,0,0,.45)', overflow:'hidden', display:'flex', flex:1 }}>
              <div style={{ overflow:'auto', width:'100%' }}>
                <Suspense fallback={<div style={{ padding:8 }}>Loading...</div>}>
                  <AIPortfolioBuilder />
                </Suspense>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


