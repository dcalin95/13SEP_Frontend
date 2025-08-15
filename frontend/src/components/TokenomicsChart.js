import React, { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import "./TokenomicsChart.css";

const data = [
  { name: "CEX & DEX Liquidity", value: 12, color: "#00ffe0", amount: "360,000,000", description: "Liquidity for trading pairs" },
  { name: "Public Presale", value: 35, color: "#e040fb", amount: "1,050,000,000", description: "Public token sale" },
  { name: "Team & Advisors", value: 7, color: "#9c27ff", amount: "210,000,000", description: "Team allocation" },
  { name: "Treasury", value: 16, color: "#2196f3", amount: "480,000,000", description: "Project treasury" },
  { name: "Ecosystem Growth", value: 18, color: "#ff9800", amount: "540,000,000", description: "Ecosystem development" },
  { name: "Marketing & Community", value: 12, color: "#f50057", amount: "360,000,000", description: "Marketing initiatives" },
];

const TokenomicsChart = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [explodedIndex, setExplodedIndex] = useState(null);
  const chartRef = useRef(null);

  const handleMouseEnter = (index) => {
    setActiveIndex(index);
    setExplodedIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
    setExplodedIndex(null);
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    if (explodedIndex === index) {
      const RADIAN = Math.PI / 180;
      const radius = outerRadius * 1.3;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return (
        <motion.text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="exploded-label"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </motion.text>
      );
    }
    return null;
  };

  return (
    <Box className="tokenomics-container">
      <Typography 
        variant="h4" 
        className="tokenomics-title" 
        sx={{ 
          marginTop: '3rem', 
          marginBottom: '3rem', 
          color: '#00ffe0', 
          textShadow: '0 0 15px #00ffe0, 0 0 30px #9c27ff, 0 0 45px #e040fb',
          fontSize: '3.5rem',
          fontWeight: 'bold'
        }}
      >
        BitSwapDEX AI Tokenomics
      </Typography>

      <Box className="chart-wrapper">
        {/* Cardurile din stânga */}
        <Box className="left-cards">
          {data.slice(0, 3).map((entry, index) => (
            <motion.div
              key={index}
              className={`floating-card ${activeIndex === index ? "active" : ""} ${explodedIndex === index ? "exploded" : ""}`}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              initial={{ opacity: 0, y: 30 }}
              animate={{
                opacity: activeIndex === index ? 1 : 0.7,
                scale: activeIndex === index ? 1.05 : 1,
                y: 0,
              }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: `0 0 20px ${entry.color}`,
              }}
            >
              <div className="card-glow" style={{ backgroundColor: entry.color }}></div>
              <h3 style={{ color: entry.color }}>{entry.name}</h3>
              <p className="amount">{entry.amount} $BITS</p>
              <p className="percentage">{entry.value}%</p>
              {explodedIndex === index && (
                <motion.p
                  className="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {entry.description}
                </motion.p>
              )}
            </motion.div>
          ))}
        </Box>

        {/* Graficul principal cu efecte */}
        <Box className="chart-center">
          <div className="chart-glow-effect"></div>
          <ResponsiveContainer width="100%" height={500}>
            <PieChart ref={chartRef}>
              <Pie
                data={data}
                innerRadius={explodedIndex !== null ? 60 : 90}
                outerRadius={explodedIndex !== null ? 160 : 140}
                paddingAngle={explodedIndex !== null ? 15 : 5}
                dataKey="value"
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className={`chart-cell ${activeIndex === index ? "active" : ""} ${explodedIndex === index ? "exploded" : ""}`}
                    style={{
                      filter: activeIndex === index ? `drop-shadow(0 0 15px ${entry.color})` : "none",
                      transform: explodedIndex === index ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Efect de energie în centru */}
          <div className="energy-core"></div>
        </Box>

        {/* Cardurile din dreapta */}
        <Box className="right-cards">
          {data.slice(3).map((entry, index) => (
            <motion.div
              key={index + 3}
              className={`floating-card ${activeIndex === index + 3 ? "active" : ""} ${explodedIndex === index + 3 ? "exploded" : ""}`}
              onMouseEnter={() => handleMouseEnter(index + 3)}
              onMouseLeave={handleMouseLeave}
              initial={{ opacity: 0, y: 30 }}
              animate={{
                opacity: activeIndex === index + 3 ? 1 : 0.7,
                scale: activeIndex === index + 3 ? 1.05 : 1,
                y: 0,
              }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: `0 0 20px ${entry.color}`,
              }}
            >
              <div className="card-glow" style={{ backgroundColor: entry.color }}></div>
              <h3 style={{ color: entry.color }}>{entry.name}</h3>
              <p className="amount">{entry.amount} $BITS</p>
              <p className="percentage">{entry.value}%</p>
              {explodedIndex === index + 3 && (
                <motion.p
                  className="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {entry.description}
                </motion.p>
              )}
            </motion.div>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default TokenomicsChart;

