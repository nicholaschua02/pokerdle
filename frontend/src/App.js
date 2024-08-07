import React, { useState, useEffect } from 'react';
import CardIcon from './CardIcon';
import HowToPlayModal from './HowToPlayModal';
import './App.css';
import confetti from 'canvas-confetti';


const suits = ['hearts', 'diamonds', 'clubs', 'spades'];

const suitsDict = {
  hearts: '♥️',
  diamonds: '♦️',
  clubs: '♣️',
  spades: '♠️'
};

const rankList = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const MAX_GUESSES = 5;

function App() {
  const [gameState, setGameState] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [handStrength, setHandStrength] = useState('');
  const [revealStage, setRevealStage] = useState(0); // 0: pre-flop, 1: flop, 2: turn, 3: river
  const [lockedCards, setLockedCards] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showHowToPlayModal, setShowHowToPlayModal] = useState(false);
  const [animationStage, setAnimationStage] = useState(0); // For tracking animation stage

  useEffect(() => {
    fetch('http://localhost:5000/cards')
      .then(response => response.json())
      .then(data => {
        while (data.hand.some(card => isCommunityCard(card, data))) {
          fetch('http://localhost:5000/cards')
            .then(response => response.json())
            .then(data => setGameState(data));
        }
        setGameState(data);
        setHandStrength(evaluateHand(data.hand)); // Initial hand strength based on player's hand only
      });
  }, []);

  useEffect(() => {
    if (gameState) {
      updateHandStrength();
    }
  }, [gameState, revealStage]);

  useEffect(() => {
    if (revealStage > 0) {
      setAnimationStage(revealStage);
    }
  }, [revealStage]);

  const handleCardClick = (card) => {
    if (gameOver) return;
    if (currentGuess.some(g => g.rank === card.rank && g.suit === card.suit)) {
      setCurrentGuess(currentGuess.filter(g => g.rank !== card.rank || g.suit !== card.suit));
    } else if (currentGuess.length < 2) {
      setCurrentGuess([...currentGuess, card]);
    }
  };

  const handleGuess = () => {
    if (currentGuess.length === 2) {
      const feedback1 = evaluateGuess(currentGuess[0], gameState.hand);
      const feedback2 = evaluateGuess(currentGuess[1], gameState.hand);
      setFeedback([...feedback, [feedback1, feedback2]]);

      if (feedback1 === 'Green') {
        setLockedCards([...lockedCards, currentGuess[0]]);
      }
      if (feedback2 === 'Green') {
        setLockedCards([...lockedCards, currentGuess[1]]);
      }

      if (feedback1 === 'Green' && feedback2 === 'Green') {
        setModalMessage('You guessed both cards correctly!');
        confetti();  // Trigger confetti animation
        setShowModal(true);
        setGameOver(true);
      } else if (guesses.length >= MAX_GUESSES - 1) {
        setModalMessage('You have run out of guesses! The correct hand was: ' + gameState.hand.map(card => `${card.rank}${suitsDict[card.suit]}`).join(', '));
        setShowModal(true);
        setGameOver(true);
      }

      setGuesses([...guesses, currentGuess]);
      setCurrentGuess([]);

      // Progress the reveal stage and trigger animation stage
      if (revealStage < 3) {
        setRevealStage(revealStage + 1);
        setAnimationStage(revealStage + 1);
      } else if (revealStage === 3 && !gameOver) {
        if (feedback1 !== 'Green' || feedback2 !== 'Green') {
          setModalMessage('You lose! Better luck next time.');
          setShowModal(true);
          setGameOver(true);
        }
      }
    }
  };

  const evaluateGuess = (guess, actualHand) => {
    if (actualHand.some(card => card.rank === guess.rank && card.suit === guess.suit)) {
      return 'Green';
    } else if (actualHand.some(card => card.rank === guess.rank)) {
      return 'Yellow';
    } else if (actualHand.some(card => card.suit === guess.suit)) {
      return 'Blue';
    } else {
      return 'Gray';
    }
  };

  const getCardFeedback = (card) => {
    for (let i = 0; i < guesses.length; i++) {
      const guess = guesses[i];
      for (let j = 0; j < guess.length; j++) {
        if (guess[j].rank === card.rank && guess[j].suit === card.suit) {
          return feedback[i][j];
        }
      }
    }
    if (isCommunityCard(card)) {
      return 'Gray';
    }
    return '';
  };

  const isCommunityCard = (card, state = gameState) => {
    return state && (
      (revealStage > 0 && state.flop.some(c => c.rank === card.rank && c.suit === card.suit)) ||
      (revealStage > 1 && state.turn && state.turn.rank === card.rank && state.turn.suit === card.suit) ||
      (revealStage > 2 && state.river && state.river.rank === card.rank && state.river.suit === card.suit)
    );
  };

  const evaluateHand = (cards) => {
    const ranks = cards.map(card => card.rank);
    const suits = cards.map(card => card.suit);

    const rankCount = {};
    const suitCount = {};

    ranks.forEach(rank => {
      rankCount[rank] = (rankCount[rank] || 0) + 1;
    });

    suits.forEach(suit => {
      suitCount[suit] = (suitCount[suit] || 0) + 1;
    });

    const isFlush = Object.values(suitCount).some(count => count >= 5);
    const uniqueRanks = [...new Set(ranks)];
    const rankValues = uniqueRanks.map(rank => '23456789TJQKA'.indexOf(rank)).sort((a, b) => a - b);

    const isStraight = rankValues.length >= 5 && rankValues.every((val, idx, arr) => {
      return idx === 0 || val === arr[idx - 1] + 1;
    });

    const isFourOfAKind = Object.values(rankCount).includes(4);
    const isThreeOfAKind = Object.values(rankCount).includes(3);
    const isFullHouse = Object.values(rankCount).includes(3) && Object.values(rankCount).includes(2);
    const isPair = Object.values(rankCount).includes(2);
    const pairCount = Object.values(rankCount).filter(count => count === 2).length;

    if (isFlush && isStraight) return 'Straight Flush';
    if (isFourOfAKind) return 'Four of a Kind';
    if (isFullHouse) return 'Full House';
    if (isFlush) return 'Flush';
    if (isStraight) return 'Straight';
    if (isThreeOfAKind) return 'Three of a Kind';
    if (pairCount === 2) return 'Two Pair';
    if (isPair) return 'Pair';

    return 'High Card';
  };

  const updateHandStrength = () => {
    let combinedHand = [...gameState.hand];
    if (revealStage > 0) combinedHand = combinedHand.concat(gameState.flop);
    if (revealStage > 1) combinedHand = combinedHand.concat(gameState.turn);
    if (revealStage > 2) combinedHand = combinedHand.concat(gameState.river);
    setHandStrength(evaluateBestHand(combinedHand));
  };

  const evaluateBestHand = (cards) => {
    const combinations = getCombinations(cards, 5);
    let bestHand = 'High Card';

    combinations.forEach(combination => {
      const handStrength = evaluateHand(combination);
      if (handRankings[handStrength] > handRankings[bestHand]) {
        bestHand = handStrength;
      }
    });

    return bestHand;
  };

  const getCombinations = (array, size) => {
    function p(t, i) {
      if (t.length === size) {
        result.push(t);
        return;
      }
      if (i + 1 > array.length) {
        return;
      }
      p(t.concat(array[i]), i + 1);
      p(t, i + 1);
    }

    let result = [];
    p([], 0);
    return result;
  };

  const handRankings = {
    'High Card': 1,
    'Pair': 2,
    'Two Pair': 3,
    'Three of a Kind': 4,
    'Straight': 5,
    'Flush': 6,
    'Full House': 7,
    'Four of a Kind': 8,
    'Straight Flush': 9
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const openHowToPlayModal = () => {
    setShowHowToPlayModal(true);
  };

  const closeHowToPlayModal = () => {
    setShowHowToPlayModal(false);
  };

  return (
    <div className="App">
      <h1>Pokerdle</h1>
      <button onClick={openHowToPlayModal} className="how-to-play-button">How to Play</button>
      {gameState && (
        <>
          <div className="community-cards-section">
            <h2>Community Cards:</h2>
            <div className="community-cards">
              {revealStage > 0 && gameState.flop.map((card, index) => (
                <CardIcon key={index} card={card} onClick={() => {}} clickable={false} className={`card-icon ${animationStage === 1 ? 'fade-in' : ''} larger`} />
              ))}
              {revealStage > 1 && <CardIcon card={gameState.turn} onClick={() => {}} clickable={false} className={`card-icon ${animationStage === 2 ? 'fade-in' : ''} larger`} />}
              {revealStage > 2 && <CardIcon card={gameState.river} onClick={() => {}} clickable={false} className={`card-icon ${animationStage === 3 ? 'fade-in' : ''} larger`} />}
            </div>
            {revealStage === 1 && <p id="current">Flop revealed!</p>}
            {revealStage === 2 && <p id="current">Turn revealed!</p>}
            {revealStage === 3 && <p id="current">River revealed!</p>}
          </div>
          <div className="hand-strength">Hand Strength: {handStrength}</div>
          <div className="card-selection">
            {suits.map(suit => (
              <div key={suit} className="suit-row">
                {rankList.map(rank => (
                  <CardIcon
                    key={`${rank}_${suit}`}
                    card={{ rank, suit }}
                    onClick={handleCardClick}
                    selected={currentGuess.some(g => g.rank === rank && g.suit === suit)}
                    feedback={getCardFeedback({ rank, suit })}
                    clickable={!gameOver}
                  />
                ))}
              </div>
            ))}
          </div>
          <button onClick={handleGuess} disabled={currentGuess.length !== 2 || gameOver}>Guess</button>
          <div className="guesses">
          <h2>Previous Guesses:</h2>
            {guesses.map((guess, index) => (
              <div key={index} className="guess">
                {guess.map((card, i) => (
                  <div key={i} className={`feedback ${feedback[index][i]}`}>
                    {card.rank}{suitsDict[card.suit]}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>&times;</span>
            <p>{modalMessage}</p>
            <div className="correct-cards">
              {gameState.hand.map((card, index) => (
                <CardIcon key={index} card={card} clickable={false} />
              ))}
            </div>
          </div>
        </div>
      )}
      <HowToPlayModal show={showHowToPlayModal} onClose={closeHowToPlayModal} />
    </div>
  );
}

export default App;
