export const MQTT_BASE = '/psk/incubator';

export function t(code: string, leaf: string) {
   return `${MQTT_BASE}/${code}/${leaf}`;
}

// wildcard untuk subscribe ACK semua device
export const ACK_WILDCARD = `${MQTT_BASE}/+/ack`;
export const STATUS_WILDCARD = `${MQTT_BASE}/+/status`;
