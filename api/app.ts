/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import recipeRoutes from './routes/recipes.js'
import batchRoutes from './routes/batches.js'
import tastingRoutes from './routes/tastings.js'
import communityRoutes from './routes/community.js'
import statsRoutes from './routes/stats.js'
import inventoryRoutes from './routes/inventory.js'
import equipmentRoutes from './routes/equipment.js'
import waterRoutes from './routes/water.js'
import brewPlanRoutes from './routes/brewPlans.js'
import procurementRoutes from './routes/procurements.js'
import plazaRoutes from './routes/plaza.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/recipes', recipeRoutes)
app.use('/api/batches', batchRoutes)
app.use('/api/tastings', tastingRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/equipment', equipmentRoutes)
app.use('/api/water', waterRoutes)
app.use('/api/brew-plans', brewPlanRoutes)
app.use('/api/procurements', procurementRoutes)
app.use('/api/plaza', plazaRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
