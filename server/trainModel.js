import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// SIMULATOR: Generate Synthetic Training Data
// ============================================

// Matches the general logical weighting of our old Risk Engine
function simulateRiskScore(features) {
  let score = 0;
  
  // timeOfDay (0=midnight, 1=11:59PM)
  const time = features.timeOfDay * 24;
  if (time >= 22 || time < 5) score += 20;
  else if (time >= 17) score += 10;
  else if (time >= 7 && time < 10) score += 8;
  else score += 3;

  // weather
  if (features.weatherRain > 0.5) score += 15;
  if (features.weatherFog > 0.5) score += 20;

  // traffic
  score += (features.trafficDensity * 22);

  // distance
  score += (features.distanceKm * 10);

  // accidents
  score += features.accidentHighCount * 20;
  score += features.accidentMedCount * 10;
  
  // wildlife
  score += features.wildlifeCount * 10;

  // women safety
  if (features.womenSafety > 0.5) {
    score += features.dangerZoneCount * 50;
    score -= features.safeZoneCount * 20;
  }

  // Normalize final score to 0.0 - 1.0 (with bounds)
  return Math.max(0, Math.min(score, 100)) / 100;
}

function generateData(numSamples = 5000) {
  const inputs = [];
  const labels = [];
  
  for (let i = 0; i < numSamples; i++) {
    const features = {
      timeOfDay: Math.random(), // 0-1
      weatherRain: Math.random() > 0.9 ? 1 : 0,
      weatherFog: Math.random() > 0.95 ? 1 : 0,
      trafficDensity: Math.random(), // 0-1 severity
      distanceKm: Math.random(), // 0-1 representing up to 30km
      accidentHighCount: Math.random() > 0.8 ? Math.random() * 0.5 : 0, 
      accidentMedCount: Math.random() > 0.6 ? Math.random() * 0.8 : 0,
      wildlifeCount: Math.random() > 0.85 ? Math.random() * 0.4 : 0,
      womenSafety: Math.random() > 0.5 ? 1 : 0,
      dangerZoneCount: Math.random() > 0.9 ? 1 : 0,
      safeZoneCount: Math.random() > 0.7 ? 1 : 0,
    };

    const targetRisk = simulateRiskScore(features);

    inputs.push(Object.values(features));
    labels.push([targetRisk]);
  }
  
  return { inputs, labels };
}

// ============================================
// TRAINING 
// ============================================

async function trainModel() {
  console.log("🛠️ Generating 5,000 synthetic routes for training...");
  const { inputs, labels } = generateData(5000);

  const xs = tf.tensor2d(inputs);
  const ys = tf.tensor2d(labels);

  const model = tf.sequential();
  
  // Input Layer -> Hidden Layer 1
  model.add(tf.layers.dense({ 
    units: 16, 
    activation: 'relu', 
    inputShape: [11] // 11 features
  }));
  
  // Hidden Layer 2
  model.add(tf.layers.dense({
    units: 8,
    activation: 'relu'
  }));

  // Output Layer (Risk Score)
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid' // 0 to 1 output
  }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError',
    metrics: ['mse']
  });

  console.log("🧠 Training TensorFlow.js ML model...");
  await model.fit(xs, ys, {
    epochs: 40,
    batchSize: 32,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 10 === 0) {
          console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}`);
        }
      }
    }
  });

  console.log("💾 Saving model to server/ml_model/");
  if (!fs.existsSync(path.join(__dirname, 'ml_model'))) {
    fs.mkdirSync(path.join(__dirname, 'ml_model'));
  }
  
  const saveHandler = {
    save: async (artifacts) => {
      fs.writeFileSync(path.join(__dirname, 'ml_model', 'model.json'), JSON.stringify(artifacts.modelTopology));
      fs.writeFileSync(path.join(__dirname, 'ml_model', 'weights.bin'), Buffer.from(artifacts.weightData));
      
      // Also save the weights manifest so we can load it easily in node without tfjs-node
      const manifest = [{
        paths: ['weights.bin'],
        weights: artifacts.weightSpecs
      }];
      fs.writeFileSync(path.join(__dirname, 'ml_model', 'manifest.json'), JSON.stringify(manifest));
      
      return { modelArtifactsInfo: { dateSaved: new Date() } };
    }
  };
  
  await model.save(saveHandler);
  console.log("✅ Training complete. Start the API server to use the ML model.");
}

trainModel().catch(console.error);
