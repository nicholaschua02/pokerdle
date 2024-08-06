import React from 'react';
import './HowToPlayModal.css';

const HowToPlayModal = ({ show, onClose }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h3>How to Play Pokerdle</h3>
        <p>Pokerdle is a game where you try to guess the two hidden cards in a poker hand.</p>
        <h3>Rules:</h3>
        <ul>
          <li>You have a maximum of 5 guesses to find the correct cards.</li>
          <li>For each guess, select two cards and click the "Guess" button.</li>
          <li>After each guess, you will receive feedback in the form of colors:</li>
          <ul>
            <li><span className="color-box green"></span> Green: The card is correct.</li>
            <li><span className="color-box yellow"></span> Yellow: The rank is correct but the suit is wrong.</li>
            <li><span className="color-box blue"></span> Blue: The suit is correct but the rank is wrong.</li>
            <li><span className="color-box gray"></span> Gray: Both rank and suit are wrong.</li>
          </ul>
          <li>If you guess both cards correctly within 5 attempts, you win!</li>
          <li>Otherwise, the game reveals the correct cards and you can try again.</li>
        </ul>
      </div>
    </div>
  );
};

export default HowToPlayModal;
