export const playSound = (type) => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'correct') {
      // Pleasant chime (arpeggio)
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + (i * 0.08);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } else if (type === 'wrong') {
      // "Uh-oh" descending sound (E4 -> C#4)
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'triangle';
      
      // First note E4
      osc.frequency.setValueAtTime(329.63, ctx.currentTime);
      // Drop to C#4
      osc.frequency.setValueAtTime(277.18, ctx.currentTime + 0.15);
      
      // Envelope with a dip between the two notes
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.16);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch(e) {
    console.error("Audio play failed", e);
  }
};
