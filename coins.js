
const fs = require('fs');
const path = require('path');

// Simple file-based database for coin storage
const COINS_FILE = path.join(__dirname, 'coins.json');

class CoinManager {
  constructor() {
    this.coins = this.loadCoins();
  }

  loadCoins() {
    try {
      if (fs.existsSync(COINS_FILE)) {
        const data = fs.readFileSync(COINS_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading coins:', error);
    }
    return {};
  }

  saveCoins() {
    try {
      fs.writeFileSync(COINS_FILE, JSON.stringify(this.coins, null, 2));
    } catch (error) {
      console.error('Error saving coins:', error);
    }
  }

  getBalance(userId) {
    return this.coins[userId] || 0;
  }

  addCoins(userId, amount) {
    this.coins[userId] = this.getBalance(userId) + amount;
    this.saveCoins();
    return this.coins[userId];
  }

  removeCoins(userId, amount) {
    const currentBalance = this.getBalance(userId);
    const newBalance = Math.max(0, currentBalance - amount);
    this.coins[userId] = newBalance;
    this.saveCoins();
    return newBalance;
  }

  setCoins(userId, amount) {
    this.coins[userId] = Math.max(0, amount);
    this.saveCoins();
    return this.coins[userId];
  }

  getLeaderboard(limit = 10) {
    return Object.entries(this.coins)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  }
}

module.exports = CoinManager;
