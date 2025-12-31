import express from 'express'
import cors from 'cors'
import projectRouter from './routes/project.js'
import userRouter from './routes/user.js'
import reviewerRouter from './routes/reviewer.js'
import { connectDb } from './config/db.js'
import authMiddleware from './middleware/auth.js'

const app = express()

/* =======================
   CORS CONFIG (FIXED)
======================= */
const corsOptions = {
  origin: 'https://rtdp.netlify.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(cors(corsOptions))

// IMPORTANT: handle preflight safely
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})

/* =======================
   BODY PARSERS
======================= */
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/* =======================
   AUTH
======================= */
app.use(authMiddleware)

/* =======================
   ROUTES
======================= */
app.use('/api/projects', projectRouter)
app.use('/api/users', userRouter)
app.use('/api/reviewers', reviewerRouter)

/* =======================
   START SERVER
======================= */
connectDb()
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
