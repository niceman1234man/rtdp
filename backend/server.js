import express from 'express'
import cors from 'cors'
import projectRouter from './routes/project.js'
import userRouter from './routes/user.js'
import reviewerRouter from './routes/reviewer.js'
import { connectDb } from './config/db.js'
import authMiddleware from './middleware/auth.js'

const app = express()

// ✅ CORS FIRST
app.use(cors({
  origin: [
    'https://rtdp.netlify.app',
    
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ✅ Preflight support (VERY IMPORTANT)
app.options('*', cors())

// ✅ Body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ✅ Auth middleware AFTER CORS
app.use(authMiddleware)

// ✅ Routes
app.use('/api/projects', projectRouter)
app.use('/api/users', userRouter)
app.use('/api/reviewers', reviewerRouter)

// ✅ DB + server
connectDb()

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
