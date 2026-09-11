import axios from 'axios'
import { z } from 'zod'
import { ENV } from '../config/env.js'

export interface DeepSeekPricingContext {
  vehicleCapacity: number
  occupiedSeats: number
  distanceKm: number
  durationMinutes: number
  routeOverlapPercent: number
  additionalDistanceKm: number
  additionalDurationMinutes: number
  demandLevel: 'LOW' | 'NORMAL' | 'HIGH'
  passengerCount: number
  historicalDemand?: {
    sameTimeWindow?: number
    average?: number
  }
}

export const DeepSeekPricingResponseSchema = z.object({
  recommendedDemandFactor: z.number().min(0.7).max(1.5).default(1.0),
  recommendedSharedSavingsFactor: z.number().min(0.0).max(0.5).default(0.1),
  confidence: z.number().min(0.0).max(1.0).default(0.8),
  reason: z.string().min(5).default('Calculated from route overlap and vehicle occupancy metrics.'),
  anomaly: z.boolean().default(false),
})

export type DeepSeekPricingResponse = z.infer<typeof DeepSeekPricingResponseSchema>

export interface DeepSeekPricingResult {
  success: boolean
  source: 'DEEPSEEK_AI' | 'DETERMINISTIC_FALLBACK'
  data: DeepSeekPricingResponse
  latencyMs: number
  fallbackReason?: string
}

export class DeepSeekPricingService {
  private baseUrl: string
  private apiKey: string
  private model: string
  private timeoutMs: number
  private enabled: boolean

  constructor() {
    this.baseUrl = (ENV.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '')
    this.apiKey = ENV.DEEPSEEK_API_KEY || ''
    this.model = ENV.DEEPSEEK_MODEL || 'deepseek-chat'
    this.timeoutMs = ENV.DEEPSEEK_TIMEOUT_MS || 10000
    this.enabled = ENV.DEEPSEEK_ENABLED !== false
  }

  /**
   * Request structured pricing advice from DeepSeek AI advisory layer.
   * Returns deterministic fallback if DeepSeek is disabled, unreachable, times out, or fails validation.
   */
  async getPricingAdvisory(context: DeepSeekPricingContext): Promise<DeepSeekPricingResult> {
    const startTime = Date.now()

    // 1. Guardrail: Check if AI is configured and enabled
    if (
      !this.enabled ||
      !this.apiKey ||
      this.apiKey === 'replace_with_your_deepseek_api_key' ||
      this.apiKey.trim().length === 0
    ) {
      return this.buildFallbackResult(
        context,
        startTime,
        !this.enabled ? 'DeepSeek AI is disabled in configuration' : 'DeepSeek API key not configured'
      )
    }

    // 2. Structured JSON prompt
    const systemPrompt = `You are a high-reliability advisory AI for a campus shared-ride mobility pricing engine.
Your role is to analyze route geometry metrics, vehicle occupancy, and demand to provide bounded advice.
CRITICAL RULES:
1. Output ONLY valid JSON matching this schema:
{
  "recommendedDemandFactor": number between 0.85 and 1.15,
  "recommendedSharedSavingsFactor": number between 0.0 and 0.35,
  "confidence": number between 0.0 and 1.0,
  "reason": string explaining the assessment clearly,
  "anomaly": boolean indicating unusual detour or demand mismatch
}
2. Higher route overlap (e.g. >70%) and higher occupancy justify higher shared savings factor.
3. High demand justifies slightly higher demand factor (up to 1.10). Low demand suggests baseline (1.00).
4. Keep reasons concise and professional.`

    const userContent = JSON.stringify({
      vehicleCapacity: context.vehicleCapacity,
      occupiedSeats: context.occupiedSeats,
      distanceKm: Number(context.distanceKm.toFixed(2)),
      durationMinutes: Number(context.durationMinutes.toFixed(1)),
      routeOverlapPercent: Math.round(context.routeOverlapPercent),
      additionalDistanceKm: Number(context.additionalDistanceKm.toFixed(2)),
      additionalDurationMinutes: Number(context.additionalDurationMinutes.toFixed(1)),
      demandLevel: context.demandLevel,
      passengerCount: context.passengerCount,
      historicalDemand: context.historicalDemand || { sameTimeWindow: 20, average: 18 },
    })

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 300,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.timeoutMs,
        }
      )

      const latencyMs = Date.now() - startTime
      const rawContent = response.data?.choices?.[0]?.message?.content

      if (!rawContent) {
        return this.buildFallbackResult(context, startTime, 'Empty response from DeepSeek API')
      }

      let parsedJson: any
      try {
        parsedJson = JSON.parse(rawContent)
      } catch (parseErr: any) {
        return this.buildFallbackResult(context, startTime, `JSON parse error: ${parseErr.message}`)
      }

      // Validate with Zod schema
      const validation = DeepSeekPricingResponseSchema.safeParse(parsedJson)
      if (!validation.success) {
        return this.buildFallbackResult(
          context,
          startTime,
          `Schema validation failed: ${validation.error.message}`
        )
      }

      // Check confidence
      if (validation.data.confidence < 0.4) {
        return this.buildFallbackResult(
          context,
          startTime,
          `Low AI confidence score (${validation.data.confidence})`
        )
      }

      return {
        success: true,
        source: 'DEEPSEEK_AI',
        data: validation.data,
        latencyMs,
      }
    } catch (err: any) {
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout')
      const fallbackReason = isTimeout
        ? `DeepSeek API timeout after ${this.timeoutMs}ms`
        : `DeepSeek API error: ${err.response?.data?.error?.message || err.message}`

      return this.buildFallbackResult(context, startTime, fallbackReason)
    }
  }

  /**
   * Deterministic advisory fallback when AI is unavailable or fails guardrails.
   */
  buildFallbackResult(
    context: DeepSeekPricingContext,
    startTime: number,
    fallbackReason: string
  ): DeepSeekPricingResult {
    const latencyMs = Date.now() - startTime

    // Deterministic recommendation heuristic
    let recDemand = 1.0
    if (context.demandLevel === 'HIGH') recDemand = 1.05
    else if (context.demandLevel === 'LOW') recDemand = 0.98

    const overlapFrac = Math.max(0, Math.min(1, context.routeOverlapPercent / 100))
    const occupancyRatio = Math.max(0, Math.min(1, context.occupiedSeats / (context.vehicleCapacity || 1)))
    const recSavings = Number((overlapFrac * 0.25 + occupancyRatio * 0.05).toFixed(2))

    let reason = 'Deterministic rule: '
    if (context.routeOverlapPercent >= 70) {
      reason += `High route overlap (${Math.round(context.routeOverlapPercent)}%) provides strong pooling savings.`
    } else if (context.routeOverlapPercent >= 40) {
      reason += `Moderate route overlap (${Math.round(context.routeOverlapPercent)}%) with standard campus pooling.`
    } else {
      reason += `Low route overlap (${Math.round(context.routeOverlapPercent)}%) requires passenger-specific route extension.`
    }

    return {
      success: false,
      source: 'DETERMINISTIC_FALLBACK',
      data: {
        recommendedDemandFactor: recDemand,
        recommendedSharedSavingsFactor: recSavings,
        confidence: 0.95,
        reason,
        anomaly: context.additionalDistanceKm > context.distanceKm * 0.6,
      },
      latencyMs,
      fallbackReason,
    }
  }
}

export const deepSeekPricingService = new DeepSeekPricingService()
