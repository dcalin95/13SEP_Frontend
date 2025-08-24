import React from "react";
import { useNavigate } from "react-router-dom";
import ThreeBackground from "./StarfieldBackground";
import HomeAISection from "./HomeAISection";
import TokenomicsChart from "./TokenomicsChart";
import Roadmap from "./Roadmap";
import PresaleCountdownMini from "../Presale/Timer/PresaleCountdownMini";


import "./Home.css";
import { motion } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();

  const handleExplorePlatform = () => {
    navigate("/about");
  };

  return (
    <div className="home-container">
      {/* Fundalul și Timer-ul */}
      <section className="home-section">
        <ThreeBackground />
      </section>

      {/* Cardul de staking */}
      <section className="home-section staking-card-wrapper">
        
      </section>

      {/* Secțiunea Hero */}
      <motion.section
        className="home-section hero"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="welcome-section">
          <h1 className="laser-sharp">Welcome to BitSwapDEX AI</h1>
          <p>
            <br />From Bits to Bitcoin – Powering the Future of Decentralized Exchange!<br />
            <br />Revolutionizing DeFi with Bits, Bitcoin, and Beyond.<br />
            <br />BitSwapDEX AI: Where every bit counts in the ecosystem of Bitcoin and beyond!<br />
            <br />Empowering decentralized finance with AI-powered trading, dynamic liquidity,
            and secure transactions!<br />
          </p>
        </div>
        <button className="explore-button laser-sharp" onClick={handleExplorePlatform}>
          Explore Platform
        </button>
      </motion.section>

      {/* Secțiunea AI */}
      <motion.div
        className="home-section"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        viewport={{ once: true }}
      >
        <HomeAISection />
      </motion.div>

      {/* Graficul Tokenomics */}
      <section className="home-section tokenomics-section">
        <TokenomicsChart />
      </section>

      {/* Roadmap */}
      <section className="home-section roadmap-section">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <Roadmap />
        </motion.div>
    

     
      </section>

  
  
      {/* Key Features */}
      <section className="home-section key-features">
        <h2 className="section-title">Key Features</h2>
        <div className="features-grid">
          <motion.div
            className="feature-card"
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3>AI-Powered Insights</h3>
            <p>Make smarter trades with real-time analytics powered by AI.</p>
          </motion.div>
          <motion.div
            className="feature-card"
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3>Efficient Liquidity Pools</h3>
            <p>Optimize your returns with dynamic liquidity management.</p>
          </motion.div>
          <motion.div
            className="feature-card"
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <h3>Secure Transactions</h3>
            <p>AI-enhanced monitoring ensures safe trading environments.</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;

