import { useCallback, useRef } from 'react'

// Audio file URLs (using web-based audio APIs for authentic sounds)
const AUDIO_URLS = {
  typewriter: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSqKyOvNeCgFK4/L8ceGPAoSdbPn5KhKFwlFnN/w0H0vBDOYzOa3Ugg=' as const,
  paperRustle: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSqKyOvNeCgFK4/L8ceGPAoSdbPn5KhKFwlFnN/w0H0vBDOYzOa3Ugg=' as const,
  telegraphBell: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSqKyOvNeCgFK4/L8ceGPAoSdbPn5KhKFwlFnN/w0H0vBDOYzOa3Ugg=' as const,
  inkDrop: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSqKyOvNeCgFK4/L8ceGPAoSdbPn5KhKFwlFnN/w0H0vBDOYzOa3Ugg=' as const,
  radioStatic: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSqKyOvNeCgFK4/L8ceGPAoSdbPn5KhKFwlFnN/w0H0vBDOYzOa3Ugg=' as const
}

// Synthetic audio generation using Web Audio API
const createAudioContext = () => {
  if (typeof window === 'undefined') return null
  return new (window.AudioContext || (window as any).webkitAudioContext)()
}

const generateTypewriterSound = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.1)
}

const generatePaperRustleSound = (audioContext: AudioContext) => {
  const bufferSize = audioContext.sampleRate * 0.5
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const output = buffer.getChannelData(0)
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * 0.1 * Math.exp(-i / (bufferSize * 0.1))
  }
  
  const source = audioContext.createBufferSource()
  const gainNode = audioContext.createGain()
  
  source.buffer = buffer
  source.connect(gainNode)
  gainNode.connect(audioContext.destination)
  gainNode.gain.value = 0.2
  
  source.start(audioContext.currentTime)
}

const generateTelegraphBell = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3)
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.3)
}

const generateInkDropSound = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.setValueAtTime(100, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.2)
  
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.2)
}

const generateRadioStatic = (audioContext: AudioContext, duration: number = 1) => {
  const bufferSize = audioContext.sampleRate * duration
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const output = buffer.getChannelData(0)
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * 0.05
  }
  
  const source = audioContext.createBufferSource()
  const gainNode = audioContext.createGain()
  const filter = audioContext.createBiquadFilter()
  
  source.buffer = buffer
  source.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  filter.type = 'highpass'
  filter.frequency.value = 1000
  gainNode.gain.value = 0.1
  
  source.start(audioContext.currentTime)
}

export const useNewspaperAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const isEnabledRef = useRef(false) // Disabled by default

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext()
    }
    return audioContextRef.current
  }, [])

  const playTypewriter = useCallback(() => {
    if (!isEnabledRef.current) return
    const audioContext = getAudioContext()
    if (audioContext) {
      generateTypewriterSound(audioContext)
    }
  }, [getAudioContext])

  const playPaperRustle = useCallback(() => {
    if (!isEnabledRef.current) return
    const audioContext = getAudioContext()
    if (audioContext) {
      generatePaperRustleSound(audioContext)
    }
  }, [getAudioContext])

  const playTelegraphBell = useCallback(() => {
    if (!isEnabledRef.current) return
    const audioContext = getAudioContext()
    if (audioContext) {
      generateTelegraphBell(audioContext)
    }
  }, [getAudioContext])

  const playInkDrop = useCallback(() => {
    if (!isEnabledRef.current) return
    const audioContext = getAudioContext()
    if (audioContext) {
      generateInkDropSound(audioContext)
    }
  }, [getAudioContext])

  const playRadioStatic = useCallback((duration?: number) => {
    if (!isEnabledRef.current) return
    const audioContext = getAudioContext()
    if (audioContext) {
      generateRadioStatic(audioContext, duration)
    }
  }, [getAudioContext])

  const playTypewriterSequence = useCallback((text: string, speed: number = 100) => {
    if (!isEnabledRef.current) return
    const letters = text.split('')
    letters.forEach((_, index) => {
      setTimeout(() => {
        playTypewriter()
      }, index * speed)
    })
  }, [playTypewriter])

  const toggleAudio = useCallback(() => {
    isEnabledRef.current = !isEnabledRef.current
    return isEnabledRef.current
  }, [])

  const isAudioEnabled = useCallback(() => {
    return isEnabledRef.current
  }, [])

  return {
    playTypewriter,
    playPaperRustle,
    playTelegraphBell,
    playInkDrop,
    playRadioStatic,
    playTypewriterSequence,
    toggleAudio,
    isAudioEnabled
  }
}
