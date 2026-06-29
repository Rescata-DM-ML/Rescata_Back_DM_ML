import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import type { PrismaClient as TPrismaClient } from "../../generated/prisma";

// Self-healing check to ensure the generated client is in the output dist folder
const compiledPrismaPath = path.resolve(__dirname, "../../generated/prisma");
const sourcePrismaPath = path.resolve(__dirname, "../../../generated/prisma");

if (fs.existsSync(sourcePrismaPath) && !fs.existsSync(path.join(compiledPrismaPath, "index.js"))) {
  fs.mkdirSync(compiledPrismaPath, { recursive: true });
  fs.cpSync(sourcePrismaPath, compiledPrismaPath, { recursive: true });
}

// Dynamically require the client after copy check
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../../generated/prisma");

@Injectable()
export class PrismaService extends (PrismaClient as typeof TPrismaClient) implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
