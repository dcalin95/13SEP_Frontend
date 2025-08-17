#!/usr/bin/env node

/**
 * 🕐 AUTOMATED REWARD SYNC RUNNER
 * 
 * Orchestrează sincronizarea periodică a rewards din Telegram database către Node.sol
 * 
 * SCHEDULARE:
 * - Daily sync: 02:00 AM UTC (low traffic period)
 * - Emergency sync: On demand via API endpoint
 * - Health checks: Every 6 hours
 */

require("dotenv").config();
const cron = require("cron");
const rewardSyncService = require("../services/rewardSyncService");
const express = require("express");

// 🔧 Configuration
const SYNC_SCHEDULE = process.env.REWARD_SYNC_SCHEDULE || "0 2 * * *"; // Daily at 2 AM UTC
const HEALTH_CHECK_SCHEDULE = "0 */6 * * *"; // Every 6 hours
const API_PORT = process.env.REWARD_SYNC_PORT || 3002;
const ENABLE_API = process.env.ENABLE_REWARD_SYNC_API !== "false";

class RewardSyncRunner {
  constructor() {
    this.isRunning = false;
    this.lastSyncResult = null;
    this.syncHistory = [];
    this.app = express();
    
    this.setupAPI();
    this.scheduleJobs();
  }

  /**
   * 🔄 Execute reward sync with logging and error handling
   */
  async executeSync(source = "cron") {
    if (this.isRunning) {
      console.log("⚠️ Sync already running, skipping...");
      return { success: false, message: "Sync already in progress" };
    }

    this.isRunning = true;
    const startTime = new Date();
    
    try {
      console.log(`🚀 Starting reward sync (triggered by: ${source})`);
      
      // Generate pre-sync report
      const preReport = await rewardSyncService.generateSyncReport();
      console.log("📊 Pre-sync status:", JSON.stringify(preReport, null, 2));

      // Execute sync
      const result = await rewardSyncService.syncTelegramRewards();
      
      // Generate post-sync report
      const postReport = await rewardSyncService.generateSyncReport();
      
      const syncResult = {
        success: result.success,
        timestamp: startTime.toISOString(),
        duration: Date.now() - startTime.getTime(),
        source,
        result,
        preReport,
        postReport
      };

      this.lastSyncResult = syncResult;
      this.syncHistory.unshift(syncResult);
      
      // Keep only last 20 sync results
      if (this.syncHistory.length > 20) {
        this.syncHistory = this.syncHistory.slice(0, 20);
      }

      console.log(`✅ Sync completed in ${syncResult.duration}ms:`, result);
      
      // Send notification if configured
      await this.sendNotification(syncResult);
      
      return syncResult;
      
    } catch (error) {
      const errorResult = {
        success: false,
        timestamp: startTime.toISOString(),
        duration: Date.now() - startTime.getTime(),
        source,
        error: error.message,
        stack: error.stack
      };

      this.lastSyncResult = errorResult;
      this.syncHistory.unshift(errorResult);
      
      console.error("❌ Sync failed:", error);
      
      await this.sendNotification(errorResult);
      
      return errorResult;
      
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 🏥 Health check for sync service
   */
  async healthCheck() {
    try {
      console.log("🏥 Performing health check...");
      
      const report = await rewardSyncService.generateSyncReport();
      const isHealthy = !report.error && report.database;
      
      console.log(`🏥 Health check: ${isHealthy ? "✅ HEALTHY" : "❌ UNHEALTHY"}`);
      
      if (!isHealthy) {
        console.warn("⚠️ Health check failed:", report);
        await this.sendNotification({
          success: false,
          timestamp: new Date().toISOString(),
          source: "health_check",
          error: "Service health check failed",
          report
        });
      }
      
      return { healthy: isHealthy, report };
      
    } catch (error) {
      console.error("❌ Health check error:", error);
      return { healthy: false, error: error.message };
    }
  }

  /**
   * 📱 Send notification (placeholder for Telegram/Slack/email integration)
   */
  async sendNotification(result) {
    // Placeholder for notification system
    // Could integrate with Telegram bot, Slack webhook, email, etc.
    
    if (process.env.NOTIFICATION_WEBHOOK_URL) {
      try {
        const axios = require("axios");
        await axios.post(process.env.NOTIFICATION_WEBHOOK_URL, {
          text: `🎯 Reward Sync ${result.success ? "✅ Success" : "❌ Failed"}`,
          details: result
        });
      } catch (e) {
        console.warn("⚠️ Failed to send notification:", e.message);
      }
    }
  }

  /**
   * 🌐 Setup API endpoints for manual control
   */
  setupAPI() {
    this.app.use(express.json());
    
    // Manual sync trigger
    this.app.post("/sync", async (req, res) => {
      try {
        const result = await this.executeSync("api");
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Health check endpoint
    this.app.get("/health", async (req, res) => {
      try {
        const health = await this.healthCheck();
        res.status(health.healthy ? 200 : 503).json(health);
      } catch (error) {
        res.status(500).json({ healthy: false, error: error.message });
      }
    });

    // Status and history
    this.app.get("/status", (req, res) => {
      res.json({
        isRunning: this.isRunning,
        lastSync: this.lastSyncResult,
        schedule: SYNC_SCHEDULE,
        uptime: process.uptime(),
        historyCount: this.syncHistory.length
      });
    });

    // Sync history
    this.app.get("/history", (req, res) => {
      const limit = parseInt(req.query.limit || "10");
      res.json({
        history: this.syncHistory.slice(0, limit),
        total: this.syncHistory.length
      });
    });

    // Detailed report
    this.app.get("/report", async (req, res) => {
      try {
        const report = await rewardSyncService.generateSyncReport();
        res.json(report);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    if (ENABLE_API) {
      this.app.listen(API_PORT, () => {
        console.log(`🌐 Reward Sync API listening on port ${API_PORT}`);
        console.log(`📋 Endpoints:`);
        console.log(`  POST http://localhost:${API_PORT}/sync - Manual sync`);
        console.log(`  GET  http://localhost:${API_PORT}/health - Health check`);
        console.log(`  GET  http://localhost:${API_PORT}/status - Service status`);
        console.log(`  GET  http://localhost:${API_PORT}/history - Sync history`);
        console.log(`  GET  http://localhost:${API_PORT}/report - Detailed report`);
      });
    }
  }

  /**
   * ⏰ Schedule periodic jobs
   */
  scheduleJobs() {
    // Main sync job
    console.log(`⏰ Scheduling reward sync: ${SYNC_SCHEDULE}`);
    const syncJob = new cron.CronJob(SYNC_SCHEDULE, () => {
      this.executeSync("cron");
    }, null, true, "UTC");

    // Health check job
    console.log(`🏥 Scheduling health checks: ${HEALTH_CHECK_SCHEDULE}`);
    const healthJob = new cron.CronJob(HEALTH_CHECK_SCHEDULE, () => {
      this.healthCheck();
    }, null, true, "UTC");

    console.log("✅ Scheduled jobs configured");
  }

  /**
   * 🚀 Start the runner
   */
  async start() {
    console.log("🎯 HYBRID REWARD SYNC RUNNER STARTING...");
    console.log(`📅 Sync Schedule: ${SYNC_SCHEDULE} (UTC)`);
    console.log(`🏥 Health Checks: ${HEALTH_CHECK_SCHEDULE} (UTC)`);
    console.log(`🌐 API Enabled: ${ENABLE_API} (Port: ${API_PORT})`);
    
    // Initial health check
    await this.healthCheck();
    
    // Optional: Run initial sync if requested
    if (process.env.RUN_INITIAL_SYNC === "true") {
      console.log("🔄 Running initial sync...");
      await this.executeSync("startup");
    }
    
    console.log("✅ Reward Sync Runner is now active!");
    
    // Keep process alive
    process.on("SIGINT", async () => {
      console.log("🛑 Shutting down Reward Sync Runner...");
      await rewardSyncService.cleanup();
      process.exit(0);
    });
  }
}

// 🏃‍♂️ CLI Commands
if (require.main === module) {
  const command = process.argv[2] || "start";
  
  const runner = new RewardSyncRunner();
  
  switch (command) {
    case "start":
      runner.start();
      break;
      
    case "sync":
      runner.executeSync("manual")
        .then(result => {
          console.log("📊 Manual Sync Result:", JSON.stringify(result, null, 2));
          process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
          console.error("❌ Manual sync failed:", error);
          process.exit(1);
        });
      break;
      
    case "health":
      runner.healthCheck()
        .then(health => {
          console.log("🏥 Health Check:", JSON.stringify(health, null, 2));
          process.exit(health.healthy ? 0 : 1);
        })
        .catch(error => {
          console.error("❌ Health check failed:", error);
          process.exit(1);
        });
      break;
      
    default:
      console.log(`
🎯 HYBRID REWARD SYNC RUNNER

Usage:
  node runRewardSync.js [command]

Commands:
  start   - Start the scheduled sync runner (default)
  sync    - Run a manual sync once and exit
  health  - Perform health check and exit

Environment Variables:
  REWARD_SYNC_SCHEDULE      - Cron schedule (default: "0 2 * * *")
  REWARD_SYNC_PORT          - API port (default: 3002)
  ENABLE_REWARD_SYNC_API    - Enable API endpoints (default: true)
  RUN_INITIAL_SYNC          - Run sync on startup (default: false)
  NOTIFICATION_WEBHOOK_URL  - Webhook for notifications (optional)

Examples:
  node runRewardSync.js start   # Start with scheduled sync
  node runRewardSync.js sync    # Manual sync once
  node runRewardSync.js health  # Health check only
      `);
      process.exit(0);
  }
}
