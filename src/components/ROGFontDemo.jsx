/**
 * 🔤 ROG CRYSTAL FONT DEMO COMPONENT
 * 
 * Demonstrează implementarea completă a fontului ROG Crystal
 * cu toate efectele și stilurile disponibile
 */

import React, { useState, useEffect } from "react";
import "../fonts/fonts.css";
import "./ROGFontDemo.css";

export default function ROGFontDemo() {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [activeEffect, setActiveEffect] = useState("glow");

  // Check if font is loaded
  useEffect(() => {
    const checkFontLoaded = async () => {
      try {
        await document.fonts.load("400 16px 'ROG Crystal'");
        setFontLoaded(true);
        document.body.classList.add('font-loaded');
      } catch (error) {
        console.warn("ROG Crystal font not available, using fallback");
        setFontLoaded(false);
      }
    };

    checkFontLoaded();
  }, []);

  const effects = [
    { id: "glow", name: "Crystal Glow", class: "rog-glow" },
    { id: "gradient", name: "Gaming Gradient", class: "rog-gradient" },
    { id: "crystal", name: "Crystal Cut", class: "rog-crystal-cut" },
    { id: "neon", name: "Neon Effect", class: "rog-neon" },
    { id: "none", name: "No Effect", class: "" }
  ];

  const demoTexts = [
    "REPUBLIC OF GAMERS",
    "AI REWARDS HUB",
    "1350.00 $BITS",
    "CRYSTAL CLEAR GAMING",
    "FUTURISTIC INTERFACE",
    "LASER CUT PRECISION"
  ];

  return (
    <div className="rog-font-demo">
      {/* Header */}
      <div className="demo-header">
        <h1 className="rog-text-bold rog-gradient demo-title">
          🔤 ROG Crystal Font Demo
        </h1>
        <p className="demo-subtitle">
          Font Status: {fontLoaded ? 
            <span className="status-loaded">✅ ROG Crystal Loaded</span> : 
            <span className="status-fallback">⚠️ Using Fallback Font</span>
          }
        </p>
      </div>

      {/* Effect Controls */}
      <div className="effect-controls">
        <h3>Choose Effect:</h3>
        <div className="effect-buttons">
          {effects.map((effect) => (
            <button
              key={effect.id}
              className={`effect-btn ${activeEffect === effect.id ? 'active' : ''}`}
              onClick={() => setActiveEffect(effect.id)}
            >
              {effect.name}
            </button>
          ))}
        </div>
      </div>

      {/* Font Samples */}
      <div className="font-samples">
        <h3>Font Samples:</h3>
        
        {/* Title Sample */}
        <div className="sample-section">
          <h4>Title (Bold, 3.5rem)</h4>
          <div className={`sample-text rog-text-bold rog-title ${effects.find(e => e.id === activeEffect)?.class || ''}`}>
            {demoTexts[0]}
          </div>
        </div>

        {/* Subtitle Sample */}
        <div className="sample-section">
          <h4>Subtitle (Regular, 1.5rem)</h4>
          <div className={`sample-text rog-text rog-subtitle ${effects.find(e => e.id === activeEffect)?.class || ''}`}>
            {demoTexts[1]}
          </div>
        </div>

        {/* Number Sample */}
        <div className="sample-section">
          <h4>Numbers (Bold, 4rem)</h4>
          <div className={`sample-text rog-text-bold number-display ${effects.find(e => e.id === activeEffect)?.class || ''}`}>
            {demoTexts[2]}
          </div>
        </div>

        {/* Body Text Sample */}
        <div className="sample-section">
          <h4>Body Text (Light, 1.2rem)</h4>
          <div className={`sample-text rog-text-light rog-body ${effects.find(e => e.id === activeEffect)?.class || ''}`}>
            {demoTexts[3]}
          </div>
        </div>
      </div>

      {/* All Samples Grid */}
      <div className="samples-grid">
        <h3>All Variations:</h3>
        <div className="grid-container">
          {demoTexts.map((text, index) => (
            <div key={index} className="grid-item">
              <div className={`grid-text rog-text ${effects.find(e => e.id === activeEffect)?.class || ''}`}>
                {text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS Code Display */}
      <div className="css-code-section">
        <h3>CSS Implementation:</h3>
        <div className="code-block">
          <pre><code>{`/* ROG Crystal Font Implementation */
@font-face {
    font-family: 'ROG Crystal';
    src: url('./fonts/rog-crystal/rog-crystal-regular.woff2') format('woff2'),
         url('./fonts/rog-crystal/rog-crystal-regular.woff') format('woff'),
         url('./fonts/rog-crystal/rog-crystal-regular.ttf') format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}

/* Usage */
.rog-text {
    font-family: 'ROG Crystal', 'Orbitron', 'Arial Black', sans-serif;
    letter-spacing: 1px;
    text-rendering: optimizeLegibility;
}

/* Current Effect: ${effects.find(e => e.id === activeEffect)?.name} */
.${effects.find(e => e.id === activeEffect)?.class || 'no-effect'} {
    ${activeEffect === 'glow' ? `text-shadow: 
        0 0 5px rgba(0, 212, 255, 0.5),
        0 0 10px rgba(0, 212, 255, 0.3),
        0 0 15px rgba(0, 212, 255, 0.2);` : ''}
    ${activeEffect === 'gradient' ? `background: linear-gradient(90deg, #00D4FF, #7B68EE, #FF6B9D);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;` : ''}
    ${activeEffect === 'neon' ? `color: #00D4FF;
    text-shadow: 
        0 0 5px #00D4FF,
        0 0 10px #00D4FF,
        0 0 15px #00D4FF,
        0 0 20px #00D4FF;` : ''}
}`}</code></pre>
        </div>
      </div>

      {/* Font Information */}
      <div className="font-info">
        <h3>Font Information:</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>Font Family:</strong> ROG Crystal
          </div>
          <div className="info-item">
            <strong>Fallbacks:</strong> Orbitron, Arial Black, sans-serif
          </div>
          <div className="info-item">
            <strong>Weights Available:</strong> 300 (Light), 400 (Regular), 700 (Bold)
          </div>
          <div className="info-item">
            <strong>Format Support:</strong> WOFF2, WOFF, TTF, EOT, SVG
          </div>
          <div className="info-item">
            <strong>Performance:</strong> font-display: swap
          </div>
          <div className="info-item">
            <strong>Unicode Range:</strong> Basic Latin + Latin-1 Supplement
          </div>
        </div>
      </div>
    </div>
  );
}
