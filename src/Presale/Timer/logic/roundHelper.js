// roundHelper.js
// 🔢 Prețuri calculate automat, doar pentru referință vizuală în AdminPanel

const START_PRICE = 0.0010;  // USD per BITS – runda 1
const FINAL_PRICE = 0.1000;  // USD per BITS – runda 12
const ROUNDS = 12;

// 🧠 Calculăm multiplicatorul geometric
const multiplier = Math.pow(FINAL_PRICE / START_PRICE, 1 / (ROUNDS - 1));

// 🔁 Returnează prețul teoretic pentru runda dată (1-based)
export function getSuggestedPriceForRound(roundNumber) {
  const index = Math.max(0, Math.min(roundNumber - 1, ROUNDS - 1));
  const price = START_PRICE * Math.pow(multiplier, index);
  return parseFloat(price.toFixed(6)); // până la 6 zecimale
}
