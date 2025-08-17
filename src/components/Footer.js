import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom"; // Link pentru navigare

const Footer = () => {
  return (
    <footer className="footer-container">
      <p className="footer-text">
        &copy; 2025-2026 - ®BitSwapDEX AI & $BITS. Powered by AI and Blockchain
        Technology! All rights reserved! Any copying/reproduction without the
        written consent of ®BitSwapDEX AI is prohibited and punishable under
        International Copyright Law!
      </p>
      <div className="footer-links">
        <Link to="/terms" className="footer-button">
          <i className="fas fa-file-alt footer-icon blue"></i> Terms and
          Conditions
        </Link>
        <Link to="/privacy-policy" className="footer-button">
          <i className="fas fa-user-shield footer-icon green"></i> Privacy
          Policy
        </Link>
        <Link to="/" className="footer-button">
          <i className="fas fa-home footer-icon red"></i> Go to Home Page
        </Link>
      </div>
    </footer>
  );
};

export default Footer;

