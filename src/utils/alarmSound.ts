/**
 * Universal Loud SOS Emergency Alarm Audio Controller
 * Plays local project sound /sounds/sos-alarm.mp3 with continuous loop,
 * fallback synthesis buzzer if audio is restricted, and graceful pause/stop.
 */

class SosAlarmAudioPlayer {
  private audio: HTMLAudioElement | null = null
  private isPlaying: boolean = false
  private audioContext: AudioContext | null = null
  private synthInterval: number | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audio = new Audio('/sounds/sos-alarm.mp3')
        this.audio.loop = true
        this.audio.preload = 'auto'
      } catch (e) {
        console.warn('[SosAlarm] HTMLAudioElement init error:', e)
      }
    }
  }

  /**
   * Start playing the loud emergency alarm sound continuously
   */
  public async play(): Promise<boolean> {
    if (this.isPlaying) return true

    if (this.audio) {
      try {
        this.audio.currentTime = 0
        this.audio.volume = 1.0
        await this.audio.play()
        this.isPlaying = true
        console.log('[SosAlarm] Playing loud SOS emergency alarm from /sounds/sos-alarm.mp3')
        return true
      } catch (err: any) {
        console.warn('[SosAlarm] Browser autoplay restriction blocked audio.play(). Falling back to Web Audio buzzer:', err.message)
        return this.startFallbackBuzzer()
      }
    } else {
      return this.startFallbackBuzzer()
    }
  }

  /**
   * Web Audio API synthesized siren buzzer fallback
   */
  private startFallbackBuzzer(): boolean {
    if (typeof window === 'undefined') return false
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return false
      this.audioContext = new AudioCtx()

      const playChirp = () => {
        if (!this.audioContext) return
        try {
          const osc = this.audioContext.createOscillator()
          const gain = this.audioContext.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(880, this.audioContext.currentTime)
          osc.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.4)
          gain.gain.setValueAtTime(0.4, this.audioContext.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4)
          osc.connect(gain)
          gain.connect(this.audioContext.destination)
          osc.start()
          osc.stop(this.audioContext.currentTime + 0.4)
        } catch {
          // ignore
        }
      }

      playChirp()
      this.synthInterval = window.setInterval(playChirp, 700)
      this.isPlaying = true
      return true
    } catch {
      return false
    }
  }

  /**
   * Stop alarm immediately and clean up all audio streams and timers
   */
  public stop() {
    if (this.audio) {
      try {
        this.audio.pause()
        this.audio.currentTime = 0
      } catch {
        // ignore
      }
    }

    if (this.synthInterval) {
      clearInterval(this.synthInterval)
      this.synthInterval = null
    }

    if (this.audioContext) {
      try {
        this.audioContext.close()
      } catch {
        // ignore
      }
      this.audioContext = null
    }

    this.isPlaying = false
    console.log('[SosAlarm] SOS emergency alarm stopped.')
  }

  public getIsPlaying(): boolean {
    return this.isPlaying
  }
}

export const sosAlarmPlayer = new SosAlarmAudioPlayer()