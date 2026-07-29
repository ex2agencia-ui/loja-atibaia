import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
dotenv.config()
const sql = neon(process.env.DATABASE_URL)
const rows = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'config_loja' ORDER BY ordinal_position`
rows.forEach(r => console.log(r.column_name))
