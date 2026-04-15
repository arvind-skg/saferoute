// Voice Alert Service using Web Speech API

let synth = null;
let voiceEnabled = true;
let currentUtterance = null;

export function initVoice() {
  if ('speechSynthesis' in window) {
    synth = window.speechSynthesis;
    return true;
  }
  return false;
}

export function setVoiceEnabled(enabled) {
  voiceEnabled = enabled;
  if (!enabled && synth) {
    synth.cancel();
  }
}

export function isVoiceEnabled() {
  return voiceEnabled;
}

export function speak(text, options = {}) {
  if (!voiceEnabled || !synth) return;
  
  const { priority = 'normal', rate = 1.0, pitch = 1.0 } = options;
  
  // Cancel current speech for high priority alerts
  if (priority === 'high') {
    synth.cancel();
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1.0;
  utterance.lang = 'en-US';
  
  // Try to use a natural voice
  const voices = synth.getVoices();
  const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
  if (preferred) utterance.voice = preferred;
  
  currentUtterance = utterance;
  synth.speak(utterance);
}

export function speakNavigation(instruction) {
  speak(instruction, { priority: 'normal', rate: 0.95 });
}

export function speakAlert(message) {
  speak(message, { priority: 'high', rate: 0.9, pitch: 1.1 });
}

export function speakDangerAlert(message) {
  speak(`Warning! ${message}`, { priority: 'high', rate: 0.85, pitch: 1.2 });
}

export function stopSpeaking() {
  if (synth) synth.cancel();
}
