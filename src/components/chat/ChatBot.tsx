import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  Compass,
  Car,
  Shield,
  Navigation,
  ChevronDown,
  ExternalLink,
  MessageSquare,
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import {
  ChatPortal,
  getInitialBotState,
  generateBotResponse,
  BotAction,
} from './knowledgeEngine'

interface Message {
  id: string
  sender: 'user' | 'bot'
  text: string
  timestamp: string
  actions?: BotAction[]
  chips?: string[]
}

export default function ChatBot() {
  const location = useLocation()
  const navigate = useNavigate()

  // App store context
  const role = useAppStore((s) => s.role)
  const rides = useAppStore((s) => s.rides)
  const bookings = useAppStore((s) => s.bookings)
  const vehicles = useAppStore((s) => s.vehicles)
  const drivers = useAppStore((s) => s.drivers)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const currentUser = useAppStore((s) => s.currentUser)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const currentDriverId = useAppStore((s) => s.currentDriverId)

  // Determine current portal based on path or role
  const portal: ChatPortal = (() => {
    if (location.pathname.startsWith('/driver')) return 'driver'
    if (location.pathname.startsWith('/admin')) return 'admin'
    if (location.pathname.startsWith('/student')) return 'student'
    if (role === 'driver') return 'driver'
    if (role === 'admin') return 'admin'
    if (role === 'student' || role === 'faculty') return 'student'
    return 'guest'
  })()

  // Portal-specific theming and branding
  const portalConfig = {
    student: {
      name: 'CampusBuddy AI',
      shortName: 'CampusBuddy',
      subtitle: 'Student Commute Assistant',
      badge: 'STUDENT',
      icon: Sparkles,
      gradient: 'from-blue-600 via-indigo-600 to-primary-700',
      glowShadow: 'shadow-indigo-500/25',
      badgeClass: 'bg-primary-50 text-primary-700 border-primary-200',
      botBubble: 'bg-white border-slate-200 text-slate-800',
      headerClass: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-primary-700 text-white',
      accentText: 'text-primary-600',
      buttonVariant: 'bg-primary-600 hover:bg-primary-700',
      tagline: 'Ask rides, stops & timings',
    },
    driver: {
      name: 'CampusPilot AI',
      shortName: 'CampusPilot',
      subtitle: 'Driver Co-Pilot & Navigation',
      badge: 'DRIVER',
      icon: Compass,
      gradient: 'from-emerald-500 via-teal-600 to-emerald-700',
      glowShadow: 'shadow-emerald-500/25',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      botBubble: 'bg-white border-slate-200 text-slate-800',
      headerClass: 'bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 text-white',
      accentText: 'text-emerald-600',
      buttonVariant: 'bg-emerald-600 hover:bg-emerald-700',
      tagline: 'Stops & passenger roster',
    },
    admin: {
      name: 'FleetVision AI',
      shortName: 'FleetVision',
      subtitle: 'Autonomous Fleet Intelligence',
      badge: 'DISPATCH',
      icon: Shield,
      gradient: 'from-violet-600 via-purple-600 to-indigo-800',
      glowShadow: 'shadow-violet-500/25',
      badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
      botBubble: 'bg-white border-slate-200 text-slate-800',
      headerClass: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-800 text-white',
      accentText: 'text-violet-600',
      buttonVariant: 'bg-violet-600 hover:bg-violet-700',
      tagline: 'Fleet occupancy & alerts',
    },
    guest: {
      name: 'CampusFlow Concierge',
      shortName: 'CampusFlow',
      subtitle: 'Mobility Help & Onboarding',
      badge: 'CAMPUS',
      icon: Bot,
      gradient: 'from-slate-700 via-slate-800 to-slate-900',
      glowShadow: 'shadow-slate-500/25',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      botBubble: 'bg-white border-slate-200 text-slate-800',
      headerClass: 'bg-gradient-to-r from-slate-800 to-slate-900 text-white',
      accentText: 'text-slate-800',
      buttonVariant: 'bg-slate-800 hover:bg-slate-900',
      tagline: 'Shuttle routes & sign in',
    },
  }[portal]

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeChips, setActiveChips] = useState<string[]>([])
  const [hasUnread, setHasUnread] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize or update conversation on portal or role change
  useEffect(() => {
    const { greeting, chips } = getInitialBotState(portal, currentUser?.name)
    const initialMsg: Message = {
      id: `init-${portal}-${Date.now()}`,
      sender: 'bot',
      text: greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      chips,
    }
    setMessages([initialMsg])
    setActiveChips(chips)
  }, [portal, currentUser?.name])

  // Scroll to bottom whenever messages update or bot is typing
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, isOpen])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim()
    if (!text) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsTyping(true)

    // Simulate natural AI thinking delay (~350ms)
    setTimeout(() => {
      const response = generateBotResponse(text, portal, {
        rides,
        bookings,
        vehicles,
        drivers,
        safetyEvents,
        currentUser,
        currentStudentId,
        currentDriverId,
      })

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: response.actions,
        chips: response.chips,
      }

      setMessages((prev) => [...prev, botMsg])
      if (response.chips && response.chips.length > 0) {
        setActiveChips(response.chips)
      }
      setIsTyping(false)
    }, 380)
  }

  const handleResetChat = () => {
    const { greeting, chips } = getInitialBotState(portal, currentUser?.name)
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'bot',
        text: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips,
      },
    ])
    setActiveChips(chips)
  }

  const renderFormattedText = (content: string) => {
    // Process simple markdown: bold, bullet points, lines
    return content.split('\n').map((line, idx) => {
      if (!line.trim()) return <div key={idx} className="h-1.5" />

      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-')
      const lineText = isBullet ? line.trim().replace(/^[•-]\s*/, '') : line

      const parts = lineText.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)

      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={pIdx} className="italic text-slate-700">{part.slice(1, -1)}</em>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={pIdx} className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono font-semibold text-slate-800">
              {part.slice(1, -1)}
            </code>
          )
        }
        return part
      })

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-1.5 text-xs my-0.5">
            <span className={`text-[10px] mt-1 ${portalConfig.accentText}`}>●</span>
            <span className="flex-1">{formattedLine}</span>
          </div>
        )
      }

      return (
        <p key={idx} className="text-xs leading-relaxed">
          {formattedLine}
        </p>
      )
    })
  }

  const PortalIcon = portalConfig.icon

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* Floating Action Trigger Button (Modern Clean Icon)            */}
      {/* ------------------------------------------------------------- */}
      {!isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center group">
          {/* Clean Hover Tooltip */}
          <div className="absolute right-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold shadow-xl whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Chat with {portalConfig.shortName}</span>
            <span className="text-[10px] text-slate-400 font-mono">AI</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            aria-label={`Open ${portalConfig.name}`}
            className={`w-14 h-14 rounded-full bg-gradient-to-tr ${portalConfig.gradient} text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.4)] ring-4 ring-white/30 hover:ring-white/50 hover:scale-108 active:scale-95 transition-all duration-200 flex items-center justify-center relative cursor-pointer ${portalConfig.glowShadow}`}
          >
            {/* Inner light reflection */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/10 to-white/25 pointer-events-none" />

            <PortalIcon size={26} className="transition-transform duration-300 group-hover:rotate-12 drop-shadow-sm" />

            {/* Online indicator dot */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-xs" />
            </span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Floating Chat Window Modal                                    */}
      {/* ------------------------------------------------------------- */}
      {isOpen && (
        <div className="fixed bottom-4 md:bottom-6 right-3 md:right-6 z-50 w-[94vw] sm:w-[400px] h-[540px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200">
          {/* Chat Header */}
          <div className={`px-4 py-3.5 ${portalConfig.headerClass} flex items-center justify-between shadow-xs select-none`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0">
                <PortalIcon size={20} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-bold text-sm text-white">{portalConfig.name}</h3>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-white/20 text-white tracking-wide">
                    {portalConfig.badge}
                  </span>
                </div>
                <p className="text-[11px] text-white/80">{portalConfig.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Restart Conversation"
                className="p-1.5 rounded-xl hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize Chat"
                className="p-1.5 rounded-xl hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Portal Context Banner */}
          <div className="bg-slate-50 border-b border-slate-100 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-Time Campus Telematics Connected
            </span>
            <span className="font-semibold text-slate-600 capitalize">{portal} Portal</span>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAFBFD]">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user'

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-xs shadow-2xs leading-relaxed ${
                      isUser
                        ? `bg-gradient-to-r ${portalConfig.gradient} text-white rounded-tr-xs`
                        : `${portalConfig.botBubble} rounded-tl-xs border`
                    }`}
                  >
                    {renderFormattedText(msg.text)}

                    {/* Interactive Action Buttons inside Bot Message */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.actions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => {
                              navigate(act.to)
                              setIsOpen(false)
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer ${
                              act.variant === 'rose'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : act.variant === 'emerald'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                          >
                            <span>{act.label}</span>
                            <ExternalLink size={10} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 px-1">{msg.timestamp}</span>
                </div>
              )
            })}

            {/* Bot Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-2.5 rounded-2xl rounded-tl-xs w-20 shadow-2xs">
                <span className={`w-1.5 h-1.5 rounded-full ${portalConfig.accentText} bg-current animate-bounce`} />
                <span className={`w-1.5 h-1.5 rounded-full ${portalConfig.accentText} bg-current animate-bounce [animation-delay:0.15s]`} />
                <span className={`w-1.5 h-1.5 rounded-full ${portalConfig.accentText} bg-current animate-bounce [animation-delay:0.3s]`} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          {activeChips.length > 0 && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {activeChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.replace(/^[^\w\s]+\s*/, ''))}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask ${portalConfig.name}...`}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className={`p-2.5 rounded-xl text-white font-semibold transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${portalConfig.buttonVariant} shadow-xs`}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
