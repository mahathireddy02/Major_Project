import mongoose from 'mongoose'
import { ENV } from './env.js'

let isConnected = false
let memoryServerInstance: any = null

export async function connectDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose
  }

  // First, attempt connecting to the configured MONGODB_URI with a 2.5s timeout
  try {
    console.log(`[Database] Attempting connection to ${ENV.MONGODB_URI}...`)
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
    })
    isConnected = true
    console.log('[Database] Successfully connected to MongoDB.')
    return mongoose
  } catch (err: any) {
    console.warn(`[Database] Could not connect to external MongoDB: ${err.message}`)
    
    // In development/hackathon environments, fall back to embedded in-memory MongoDB
    if (ENV.NODE_ENV !== 'production') {
      try {
        console.log('[Database] Starting embedded mongodb-memory-server for zero-config hackathon execution...')
        const { MongoMemoryServer } = await import('mongodb-memory-server')
        memoryServerInstance = await MongoMemoryServer.create()
        const uri = memoryServerInstance.getUri()
        console.log(`[Database] Embedded MongoDB initialized at ${uri}`)
        
        await mongoose.connect(uri)
        isConnected = true
        console.log('[Database] Connected to embedded MongoDB memory server.')
        return mongoose
      } catch (memErr: any) {
        console.error('[Database] Failed to launch mongodb-memory-server fallback:', memErr)
        throw memErr
      }
    } else {
      throw err
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect()
    isConnected = false
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop()
    memoryServerInstance = null
  }
}
