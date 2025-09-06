import React from 'react';
import { motion } from 'framer-motion';
import ProofOfTransfer from './ProofOfTransfer';
import './ProofOfTransfer.css';

const ProofOfTransferPage = () => {
  return (
    <motion.div 
      className="page-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <ProofOfTransfer />
    </motion.div>
  );
};

export default ProofOfTransferPage;

