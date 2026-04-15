// Alert Service - manages navigation alerts with cooldowns
import { isInAccidentZone } from '../data/accidentZones.js';
import { isInWildlifeZone } from '../data/wildlifeZones.js';
import { getNearbyReports } from './communityService.js';
import { speakAlert, speakDangerAlert } from './voiceService.js';

const ALERT_COOLDOWN = 60000; // 1 minute cooldown per zone
const alertHistory = new Map();
let alertCallbacks = [];

export const ALERT_TYPES = {
  ACCIDENT_ZONE: 'accident_zone',
  WILDLIFE: 'wildlife',
  SHARP_TURN: 'sharp_turn',
  HIGH_RISK: 'high_risk',
  COMMUNITY: 'community',
  SPEED: 'speed',
};

const alertConfig = {
  [ALERT_TYPES.ACCIDENT_ZONE]: { icon: '⚠️', color: '#ef4444', voice: true, priority: 2 },
  [ALERT_TYPES.WILDLIFE]: { icon: '🦌', color: '#f59e0b', voice: true, priority: 1 },
  [ALERT_TYPES.SHARP_TURN]: { icon: '↩️', color: '#f97316', voice: true, priority: 1 },
  [ALERT_TYPES.HIGH_RISK]: { icon: '🔴', color: '#dc2626', voice: true, priority: 3 },
  [ALERT_TYPES.COMMUNITY]: { icon: '👥', color: '#3b82f6', voice: false, priority: 0 },
  [ALERT_TYPES.SPEED]: { icon: '🏎️', color: '#8b5cf6', voice: true, priority: 1 },
};

export function checkAlerts(lat, lng, options = {}) {
  const alerts = [];
  const now = Date.now();

  // Check accident zones
  const accZone = isInAccidentZone(lat, lng);
  if (accZone && !isOnCooldown(`acc_${accZone.id}`, now)) {
    const alert = {
      type: ALERT_TYPES.ACCIDENT_ZONE,
      message: `Accident-prone zone: ${accZone.name}`,
      detail: accZone.description,
      severity: accZone.severity,
      ...alertConfig[ALERT_TYPES.ACCIDENT_ZONE],
    };
    alerts.push(alert);
    setCooldown(`acc_${accZone.id}`, now);
    if (alert.voice) {
      if (accZone.severity === 'high') {
        speakDangerAlert(`High risk zone ahead. ${accZone.name}. ${accZone.description}`);
      } else {
        speakAlert(`Caution. Accident prone junction ahead. ${accZone.name}`);
      }
    }
  }

  // Check wildlife zones
  const wildZone = isInWildlifeZone(lat, lng);
  if (wildZone && !isOnCooldown(`wild_${wildZone.id}`, now)) {
    const alert = {
      type: ALERT_TYPES.WILDLIFE,
      message: `Animal crossing zone: ${wildZone.name}`,
      detail: `${wildZone.description} – Reduce speed`,
      severity: wildZone.frequency === 'high' ? 'high' : 'medium',
      ...alertConfig[ALERT_TYPES.WILDLIFE],
    };
    alerts.push(alert);
    setCooldown(`wild_${wildZone.id}`, now);
    if (alert.voice) {
      speakAlert(`Animal crossing zone ahead. ${wildZone.animal} may be present. Reduce speed.`);
    }
  }

  // Check community reports
  const nearby = getNearbyReports(lat, lng, 500);
  nearby.forEach(report => {
    if (!isOnCooldown(`comm_${report.id}`, now)) {
      alerts.push({
        type: ALERT_TYPES.COMMUNITY,
        message: `${report.type.charAt(0).toUpperCase() + report.type.slice(1)} reported nearby`,
        detail: report.description,
        severity: 'low',
        ...alertConfig[ALERT_TYPES.COMMUNITY],
      });
      setCooldown(`comm_${report.id}`, now);
    }
  });

  if (alerts.length > 0) {
    notifyAlertListeners(alerts);
  }

  return alerts;
}

function isOnCooldown(key, now) {
  const lastTriggered = alertHistory.get(key);
  return lastTriggered && (now - lastTriggered) < ALERT_COOLDOWN;
}

function setCooldown(key, now) {
  alertHistory.set(key, now);
}

export function onAlert(callback) {
  alertCallbacks.push(callback);
  return () => { alertCallbacks = alertCallbacks.filter(c => c !== callback); };
}

function notifyAlertListeners(alerts) {
  alertCallbacks.forEach(cb => cb(alerts));
}

export function clearAlertHistory() {
  alertHistory.clear();
}
