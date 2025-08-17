// 🔍 TELEGRAM REWARDS INVESTIGATION SCRIPT
// Tests real data from deployed backend on Render

const BACKEND_URL = "https://backend-server-f82y.onrender.com";

// Test wallet addresses (examples)
const TEST_WALLETS = [
    "0x4CCA7bf2aeF7A432d06513f7b02c2F316E21f408", // From screenshot
    "0x742d35Cc6634C0532925a3b8D5CFCFA1A7E3b52", // Example
    "0x8ba1f109551bd432803012645hac136c5ca52"    // Example
];

// Test user IDs (examples)
const TEST_TELEGRAM_IDS = [
    "123456789",
    "987654321", 
    "555666777",
    "111222333"
];

async function testAPI(url, name) {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`📡 URL: ${url}`);
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Data:`, JSON.stringify(data, null, 2));
        
        return { success: true, data, status: response.status };
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function investigateTelegramRewards() {
    console.log("🔍 TELEGRAM REWARDS SYSTEM INVESTIGATION");
    console.log("=" * 50);
    
    // Test 1: Check Telegram Rewards Status for different wallets
    console.log("\n📋 TESTING WALLET REWARD STATUS:");
    for (const wallet of TEST_WALLETS) {
        await testAPI(`${BACKEND_URL}/api/telegram-rewards/status/${wallet}`, `Wallet ${wallet}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    
    // Test 2: Check user progress for different Telegram IDs
    console.log("\n📋 TESTING USER PROGRESS:");
    for (const telegramId of TEST_TELEGRAM_IDS) {
        await testAPI(`${BACKEND_URL}/api/telegram-rewards/progress/${telegramId}`, `User ${telegramId}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    
    // Test 3: Check onchain rewards
    console.log("\n📋 TESTING ONCHAIN REWARDS:");
    for (const wallet of TEST_WALLETS) {
        await testAPI(`${BACKEND_URL}/api/telegram-rewards/onchain/${wallet}`, `Onchain ${wallet}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    
    // Test 4: General API health
    console.log("\n📋 TESTING GENERAL API HEALTH:");
    await testAPI(`${BACKEND_URL}/api/presale/current`, "Presale Status");
    
    console.log("\n🎯 INVESTIGATION COMPLETE!");
    console.log("\n📊 ANALYSIS QUESTIONS TO INVESTIGATE:");
    console.log("1. Do users have realistic seconds_spent values?");
    console.log("2. Are message counts correlated with time spent?");
    console.log("3. Are reward milestones being reached appropriately?");
    console.log("4. Is the 60-second tick system working correctly?");
    console.log("5. Are idle timeouts (10 minutes) properly implemented?");
    
    return true;
}

// Time calculation helpers
function secondsToHours(seconds) {
    return (seconds / 3600).toFixed(2);
}

function validateTimeSpent(secondsSpent, messagesTotal) {
    const hours = secondsToHours(secondsSpent);
    const messagesPerHour = hours > 0 ? (messagesTotal / hours).toFixed(1) : 0;
    
    console.log(`⏱️ Time Analysis:`);
    console.log(`   Seconds: ${secondsSpent} → Hours: ${hours}`);
    console.log(`   Messages: ${messagesTotal} → Rate: ${messagesPerHour} msg/hour`);
    
    // Validation logic
    if (hours > 168) { // More than 1 week
        console.log(`⚠️ WARNING: ${hours}h seems excessive for one user`);
    } else if (messagesPerHour > 100) {
        console.log(`⚠️ WARNING: ${messagesPerHour} msg/hour seems too high`);
    } else if (messagesPerHour < 1 && hours > 5) {
        console.log(`⚠️ WARNING: Very low message rate for high time spent`);
    } else {
        console.log(`✅ Time/message ratio looks reasonable`);
    }
}

function calculateExpectedReward(secondsSpent) {
    const hours = secondsSpent / 3600;
    
    if (hours >= 100) return 500;
    if (hours >= 50) return 250;
    if (hours >= 20) return 100;
    if (hours >= 5) return 50;
    return 0;
}

// Export for Node.js or run directly in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        investigateTelegramRewards,
        testAPI,
        validateTimeSpent,
        calculateExpectedReward,
        secondsToHours
    };
} else {
    // Run in browser
    window.TelegramInvestigation = {
        investigateTelegramRewards,
        testAPI,
        validateTimeSpent,
        calculateExpectedReward,
        secondsToHours
    };
    
    console.log("🚀 Telegram Investigation tools loaded!");
    console.log("Run TelegramInvestigation.investigateTelegramRewards() to start");
}







