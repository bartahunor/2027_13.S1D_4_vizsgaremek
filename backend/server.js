import express from 'express'
import dotenv from 'dotenv'
import hpp from 'hpp'
import { createSecurityMiddleware } from './middleware/security.js'
import { createCorsMiddleware } from './middleware/corsconfig.js'
import { createApiLimiter } from './middleware/ratelimiter.js'
import { applyServerTimeouts } from './config/servertimeouts.js'
import apiRouter from './routes/index.js'

dotenv.config()

const app = express()

app.use(createSecurityMiddleware())
app.use(createCorsMiddleware())
app.use(express.json({ limit: '100kb' }))
app.use(express.static("public"))
app.use(hpp())
app.use('/api', createApiLimiter())
app.use('/api', apiRouter)

/* =========================
   HIBAKEZELŐ MIDDLEWARE
========================= */
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Szerverhiba történt' })
})

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
  console.log(`Server fut a ${PORT} porton`)
})

applyServerTimeouts(server)