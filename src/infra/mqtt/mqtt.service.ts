import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { QoS } from "@nestjs/microservices/external/mqtt-options.interface";
import { randomUUID } from "crypto";
import { connect, MqttClient } from "mqtt";

type PublishOpts = { qos?: QoS; retain?: boolean; waitAckMs?: number; };

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
   private client: MqttClient;
   private readonly logger = new Logger(MqttService.name);
   private subscribed = new Set<string>();

   constructor(
      private readonly config: ConfigService,
      private readonly eventEmitter: EventEmitter2,
   ) {}

   onModuleInit() {
      this.logger.log('Connecting to MQTT broker...');

      this.client = connect(process.env.MQTT_URL!, {
         username: this.config.get('MQTT_USERNAME'),
         password: this.config.get('MQTT_PASSWORD'),
         clientId: this.config.get('MQTT_CLIENT_ID') + Math.random().toString(16).slice(2, 8),
         reconnectPeriod: 5000,
         rejectUnauthorized: false,
         will: {
            topic: '/psk/incubator/api/status',
            payload: 'offline',
            qos: 1,
            retain: true,
         }
      });

      this.client.on('connect', async() => {
         this.logger.log('[MQTT] Connected to broker');

         try {
            await this.subscribe('/psk/incubator/+/ack', 1);
            await this.subscribe('/psk/incubator/+/status', 1);
         } catch(err: any) {
            this.logger.error('[MQTT] Subscribe on connect failed: ' + err.message);
         }
      });
      this.client.on('reconnect', () => {
         this.logger.log('[MQTT] Reconnecting to broker...');
      });
      this.client.on('close', () => {
         this.logger.log('[MQTT] Disconnected from broker');
      });
      this.client.on('offline', () => {
         this.logger.log('[MQTT] Client is offline');
      });
      this.client.on('error', (err) => {
         this.logger.error('[MQTT] Error: ' + err.message);
      });

      this.client.on('message', (topic, payload) => {
         const data = payload.toString();

         this.logger.debug(`[MQTT] Message received on topic ${topic}:\n${payload.toString()}`);

         //general event emit
         this.eventEmitter.emit(`mqtt.${topic}`, { topic, data });

         if(topic.endsWith('/ack')) {
            try {
               const msg = JSON.parse(data);
               const cid = msg?.correlationId;

               if(cid) this.eventEmitter.emit(`mqtt.ack.${cid}`, msg);
            } catch {
               this.logger.warn(`[MQTT] invalid ACK JSON on ${topic}`);
            }
         }
      });
   }

   onModuleDestroy() {
      if(this.client) {
         this.client.end();
         this.logger.log('MQTT client disconnected');
      }
   }

   async publishRaw(topic: string, buf: Buffer, opts: PublishOpts = {}) {
      if(!this.client.connected) throw new Error('MQTT client is not connected');

      const { qos = 1, retain = false } = opts;

      await new Promise<void>((resolve, reject) => {
         this.client.publish(topic, buf, { qos, retain }, (err) => (err ? reject(err) : resolve()));
      });

      this.logger.log(`[MQTT] -> ${topic} (${buf.length}B) qos=${qos} retain=${retain}`);
   }

   async publish<T extends object | string | Buffer>(topic: string, payload: T, opts: PublishOpts = {}) {
      const buff = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload));

      const { qos = 1, retain = false } = opts;

      return this.publishRaw(topic, buff, opts);
   }

   async subscribe(topic: string, qosNum: QoS = 0): Promise<void> {
      if(!this.client) {
         throw new Error('MQTT client is not initialized');
      }
      
      if(this.subscribed.has(topic)) return;
      
      return new Promise((resolve, reject) => {
         this.client.subscribe(topic, { qos: qosNum }, (err) => {
            if(err) {
               this.logger.error(`[MQTT] Subscribe error on topic ${topic}: ${err.message}`);
               return reject(err);
            }

            this.subscribed.add(topic);
            this.logger.log(`[MQTT] Subscribed to topic ${topic}`);
            resolve();
         });
      });
   }

   waitAck(correlationId: string, ms = 5000): Promise<any> {
      return new Promise((resolve, reject) => {
         const ev = `mqtt.ack.${correlationId}`;
         const timer = setTimeout(() => {
            this.eventEmitter.removeAllListeners(ev);

            reject(new Error('ACK timeout'));
         }, ms);

         this.eventEmitter.once(ev, (msg) => {
            clearTimeout(timer);
            resolve(msg);
         })
      })
   }

   // Publish command ke topic leaf dengan correlationId dan tunggu ACK
   async publishCommand(code: string, leaf: string, body: Record<string, any>, opts: PublishOpts = {}) {
      const correlationId = randomUUID();
      const topic = `/psk/incubator/${code}/${leaf}`;
      const payload = { ...body, correlationId };

      await this.publish(topic, payload, { qos: 1, retain: false });

      if(opts.waitAckMs && opts.waitAckMs > 0) {
         await this.waitAck(correlationId, opts.waitAckMs);
      }

      return { topic, correlationId }
   }
}
