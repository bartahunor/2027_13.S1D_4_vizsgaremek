
import postgres from 'postgres'
import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'

dotenv.config()

const ca = readFileSync(
  new URL('./supabase-ca.crt', import.meta.url),
  'utf8'
)

const sql = postgres(process.env.DATABASE_URL, {
  ssl: {
    ca,
    rejectUnauthorized: true
  },
  prepare: false,
  connect_timeout: 10,
  idle_timeout: 20,
  max: 10
})

export default sql