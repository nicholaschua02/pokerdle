const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

let cardsForTheDay = null;

// Function to generate a random card deck
const generateDeck = () => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = [
    '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'
  ];
  const deck = [];
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({ rank, suit });
    });
  });
  return deck;
};

// Function to shuffle the deck
const shuffleDeck = deck => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

// Function to generate the cards for the day
const generateCardsForTheDay = () => {
  const deck = shuffleDeck(generateDeck());
  return {
    hand: [deck.pop(), deck.pop()],
    flop: [deck.pop(), deck.pop(), deck.pop()],
    turn: deck.pop(),
    river: deck.pop()
  };
};

// Endpoint to get the cards for the day
app.get('/cards', (req, res) => {
  if (!cardsForTheDay) {
    cardsForTheDay = generateCardsForTheDay();
  }
  res.json(cardsForTheDay);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
