import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgres://vivekanandchoudhari@127.0.0.1:5433/aarogya_ehr";
const isProduction = process.env.NODE_ENV === "production";

const client = postgres(connectionString, {
  prepare: false,
  // SSL configuration for production
  ssl: isProduction ? { 
    rejectUnauthorized: true,
    // Allow custom CA if provided
    ca: process.env.DB_CA_CERT ? Buffer.from(process.env.DB_CA_CERT, 'base64') : undefined,
    // Client certificate for mutual TLS if needed
    cert: process.env.DB_CLIENT_CERT ? Buffer.from(process.env.DB_CLIENT_CERT, 'base64') : undefined,
    key: process.env.DB_CLIENT_KEY ? Buffer.from(process.env.DB_CLIENT_KEY, 'base64') : undefined,
  } : false,
  // Connection pool settings for production
  max: isProduction ? 20 : 10,
  idle_timeout: isProduction ? 30 : 60,
  connect_timeout: 10,
  // Retry logic
  retry: {
    max: 3,
    delay: 1000,
  },
  // Enable transformation for snake_case to camelCase
  transform: {
    undefined: null,
  },
});

export const db = drizzle(client, { schema });
export { schema };
