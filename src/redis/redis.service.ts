import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly publisher: Redis;
  private readonly subscriber: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    this.publisher = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    this.subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    this.publisher.on("error", (error) => {
      console.error("Redis Publisher error:", error.message);
    });

    this.subscriber.on("error", (error) => {
      console.error("Redis Subscriber error:", error.message);
    });

    this.publisher.connect().catch((error) => {
      console.error("Redis Publisher initial connection failed:", error.message);
    });

    this.subscriber.connect().catch((error) => {
      console.error("Redis Subscriber initial connection failed:", error.message);
    });
  }

  async onModuleInit() {
    try {
      await this.publisher.ping();
      console.log("✅ Redis conectado correctamente");
    } catch (error) {
      console.error(
        "Error al conectar con Redis:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.publisher.quit();
      await this.subscriber.quit();
    } catch (error) {
      console.error(
        "Error cerrando conexiones de Redis:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async publish(channel: string, message: object): Promise<void> {
    try {
      const serializado = JSON.stringify(message);
      await this.publisher.publish(channel, serializado);
    } catch (error) {
      console.error(
        `Error publicando mensaje en canal '${channel}':`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async subscribe(channel: string, handler: (message: object) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on("message", (ch, msg) => {
        if (ch === channel) {
          try {
            handler(JSON.parse(msg));
          } catch {
            console.error("Error parseando mensaje Redis");
          }
        }
      });
    } catch (error) {
      console.error(
        `Error suscribiendo al canal '${channel}':`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  getPublisher(): Redis {
    return this.publisher;
  }
}

// Al levantar npm run start:dev debe verse:
// ✅ Redis conectado correctamente
//
// Para verificar manualmente:
// docker exec -it rescata_redis redis-cli ping
// Debe responder: PONG
