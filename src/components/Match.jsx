import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import CompletionScreen from './CompletionScreen';
import { playSound } from '../utils/sound';

function Match({ set, onBack }) {
  const [tiles, setTiles] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState(new Set());
  const [wrongPair, setWrongPair] = useState(null);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    startGame();
  }, [set]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTime(t => t + 100);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const startGame = () => {
    // Take max 6 random pairs for the game
    const selectedCards = [...set.cards].sort(() => 0.5 - Math.random()).slice(0, 6);
    
    let generatedTiles = [];
    selectedCards.forEach(card => {
      generatedTiles.push({ id: `term-${card.id}`, cardId: card.id, text: card.term, type: 'term' });
      generatedTiles.push({ id: `def-${card.id}`, cardId: card.id, text: card.definition, type: 'def' });
    });

    setTiles(generatedTiles.sort(() => 0.5 - Math.random()));
    setMatchedPairs(new Set());
    setSelectedTile(null);
    setWrongPair(null);
    setTime(0);
    setIsPlaying(true);
    setIsFinished(false);
  };

  const handleTileClick = (tile) => {
    if (!isPlaying || matchedPairs.has(tile.cardId) || wrongPair) return;

    if (!selectedTile) {
      setSelectedTile(tile);
    } else {
      if (selectedTile.id === tile.id) {
        setSelectedTile(null); // deselect
        return;
      }

      if (selectedTile.cardId === tile.cardId && selectedTile.type !== tile.type) {
        // Match!
        playSound('correct');
        const newMatched = new Set(matchedPairs);
        newMatched.add(tile.cardId);
        setMatchedPairs(newMatched);
        setSelectedTile(null);

        if (newMatched.size === tiles.length / 2) {
          setIsPlaying(false);
          setIsFinished(true);
        }
      } else {
        // Wrong match
        playSound('wrong');
        setWrongPair([selectedTile.id, tile.id]);
        setTimeout(() => {
          setWrongPair(null);
          setSelectedTile(null);
        }, 800);
      }
    }
  };

  return (
    <div className="mode-container match-mode">
      <div className="mode-header">
        <button className="btn-back" onClick={onBack}><ArrowLeft size={24} /> Назад</button>
        <h2>Підбір</h2>
        <div className="timer">{(time / 1000).toFixed(1)} с</div>
      </div>

      {isFinished ? (
        <CompletionScreen 
          onBack={onBack}
          subtitle={`Ваш час: ${(time / 1000).toFixed(1)} секунд`}
          primaryAction={startGame}
          primaryLabel="Грати ще раз"
        />
      ) : (
        <div className="match-grid">
          {tiles.map(tile => {
            const isSelected = selectedTile?.id === tile.id;
            const isMatched = matchedPairs.has(tile.cardId);
            const isWrong = wrongPair?.includes(tile.id);

            let className = "match-tile";
            if (isSelected) className += " selected";
            if (isMatched) className += " matched";
            if (isWrong) className += " wrong";

            return (
              <div 
                key={tile.id} 
                className={className}
                onClick={() => handleTileClick(tile)}
              >
                {tile.text}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Match;
