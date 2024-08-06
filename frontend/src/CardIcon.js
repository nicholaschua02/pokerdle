import React from 'react';

const suits = {
  hearts: '♥️',
  diamonds: '♦️',
  clubs: '♣️',
  spades: '♠️'
};

const CardIcon = ({ card, onClick, selected, feedback, clickable = true }) => {
  const handleClick = () => {
    if (clickable) {
      onClick(card);
    }
  };

  return (
    <div
      className={`card-icon ${feedback} ${selected ? 'selected' : ''} ${card.suit}`}
      onClick={handleClick}
    >
      {card.rank}{suits[card.suit]}
    </div>
  );
};

export default CardIcon;
