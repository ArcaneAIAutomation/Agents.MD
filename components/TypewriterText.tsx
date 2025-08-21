import { useState, useEffect } from 'react'

interface TypewriterTextProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  style?: React.CSSProperties
  onComplete?: () => void
  showCursor?: boolean
}

export default function TypewriterText({ 
  text, 
  speed = 100, 
  delay = 0, 
  className = '', 
  style,
  onComplete,
  showCursor = true
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, currentIndex === 0 ? delay : speed)

      return () => clearTimeout(timer)
    } else if (!isComplete) {
      setIsComplete(true)
      onComplete?.()
    }
  }, [currentIndex, text, speed, delay, onComplete, isComplete])

  return (
    <span className={`${className} ${showCursor && !isComplete ? 'typewriter' : ''}`} style={style}>
      {displayText}
      {showCursor && !isComplete && (
        <span className="animate-blink">|</span>
      )}
    </span>
  )
}

interface AnimatedHeadlineProps {
  children: React.ReactNode
  delay?: number
  className?: string
  style?: React.CSSProperties
}

export function AnimatedHeadline({ 
  children, 
  delay = 0, 
  className = '',
  style
}: AnimatedHeadlineProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={`${className} ${isVisible ? 'ink-drop newspaper-fade-in' : 'opacity-0'}`} style={style}>
      {children}
    </div>
  )
}

interface NewspaperLoadingProps {
  text?: string
  className?: string
}

export function NewspaperLoading({ 
  text = "Loading latest news...", 
  className = "" 
}: NewspaperLoadingProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className="vintage-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full"></div>
        <div className="absolute inset-0 paper-texture opacity-30 rounded-full"></div>
      </div>
      <span className="ml-3 text-gray-700 font-serif">
        <TypewriterText text={text} speed={80} showCursor={false} />
      </span>
    </div>
  )
}

interface PressEffectWrapperProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function PressEffectWrapper({ 
  children, 
  onClick, 
  className = ''
}: PressEffectWrapperProps) {
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = () => {
    setIsPressed(true)
    onClick?.()
    
    setTimeout(() => {
      setIsPressed(false)
    }, 300)
  }

  return (
    <div 
      className={`${className} ${isPressed ? 'press-effect' : ''} cursor-pointer transition-all`}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

interface TelegraphNotificationProps {
  message: string
  onComplete?: () => void
  className?: string
}

export function TelegraphNotification({ 
  message, 
  onComplete, 
  className = '' 
}: TelegraphNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className={`telegraph-pulse fixed top-4 right-4 bg-yellow-100 border-2 border-black p-3 rounded-lg shadow-lg z-50 ${className}`}>
      <div className="flex items-center">
        <span className="text-lg mr-2">📡</span>
        <TypewriterText 
          text={message} 
          speed={50} 
          showCursor={false}
          className="font-serif font-bold"
        />
      </div>
    </div>
  )
}
