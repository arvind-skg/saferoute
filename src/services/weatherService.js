// Simulated weather service
const weatherConditions = ['clear', 'cloudy', 'rain', 'heavy_rain', 'fog', 'storm'];
const weatherIcons = {
  clear: '☀️',
  cloudy: '⛅',
  rain: '🌧️',
  heavy_rain: '⛈️',
  fog: '🌫️',
  storm: '🌩️',
};
const weatherLabels = {
  clear: 'Clear',
  cloudy: 'Cloudy',
  rain: 'Rain',
  heavy_rain: 'Heavy Rain',
  fog: 'Fog',
  storm: 'Storm',
};

let currentWeather = 'clear';
let currentTemp = 28;

export function initWeather() {
  // Simulate weather based on time
  const hour = new Date().getHours();
  const rand = Math.random();
  
  if (hour >= 4 && hour < 8) {
    currentWeather = rand < 0.3 ? 'fog' : 'clear';
    currentTemp = 18 + Math.floor(Math.random() * 5);
  } else if (hour >= 8 && hour < 17) {
    currentWeather = rand < 0.7 ? 'clear' : rand < 0.85 ? 'cloudy' : 'rain';
    currentTemp = 25 + Math.floor(Math.random() * 10);
  } else if (hour >= 17 && hour < 20) {
    currentWeather = rand < 0.5 ? 'clear' : rand < 0.7 ? 'cloudy' : 'rain';
    currentTemp = 22 + Math.floor(Math.random() * 8);
  } else {
    currentWeather = rand < 0.4 ? 'clear' : rand < 0.6 ? 'fog' : 'cloudy';
    currentTemp = 15 + Math.floor(Math.random() * 8);
  }
}

export function getWeather() {
  return {
    condition: currentWeather,
    icon: weatherIcons[currentWeather] || '☀️',
    label: weatherLabels[currentWeather] || 'Clear',
    temperature: currentTemp,
    visibility: currentWeather === 'fog' ? 'Low' : currentWeather === 'heavy_rain' ? 'Moderate' : 'Good',
    roadCondition: ['rain', 'heavy_rain', 'storm'].includes(currentWeather) ? 'Wet' : currentWeather === 'fog' ? 'Slippery' : 'Dry',
  };
}

export function setWeather(condition) {
  if (weatherConditions.includes(condition)) {
    currentWeather = condition;
  }
}

export function getWeatherRiskLabel() {
  switch (currentWeather) {
    case 'heavy_rain':
    case 'storm': return 'High weather risk';
    case 'rain':
    case 'fog': return 'Moderate weather risk';
    default: return 'Low weather risk';
  }
}

// Initialize on load
initWeather();
