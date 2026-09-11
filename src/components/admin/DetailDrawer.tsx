import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import Badge from '../ui/Badge'

interface DrawerTab {
  key: string
  label: string
}

interface DetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  badge?: { label: string; variant?: 'green' | 'yellow' | 'red' | 'blue' | 'slate' | 'purple' | 'orange' } | React.ReactNode
  tabs?: DrawerTab[]
  activeTab?: string
  onTabChange?: (tabKey: string) => void
  children: React.ReactNode
  width?: 'md' | 'lg' | 'xl'
}

export default function DetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  tabs,
  activeTab,
  onTabChange,
  children,
  width = 'lg',
}: DetailDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  }

  // Render badge helper
  const renderBadge = () => {
    if (!badge) return null
    if (React.isValidElement(badge)) return badge
    if (typeof badge === 'object' && 'label' in badge) {
      return (
        <Badge variant={badge.variant || 'blue'} size="sm">
          {badge.label}
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Drawer content */}
      <div
        className={`relative z-10 w-full ${widthClasses[width]} bg-white h-full shadow-2xl border-l border-[#E5EAF0] flex flex-col justify-between overflow-hidden animate-slide-in-right`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5EAF0] flex items-center justify-between bg-[#F7F9FC]">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="font-bold text-lg text-[#17202A] truncate">
                {title}
              </h2>
              {renderBadge()}
            </div>
            {subtitle && (
              <p className="text-xs text-[#5E6875] truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#5E6875] hover:text-[#17202A] hover:bg-[#E5EAF0]/50 transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation if provided */}
        {tabs && tabs.length > 0 && (
          <div className="flex border-b border-[#E5EAF0] bg-white px-6 gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange && onTabChange(tab.key)}
                  className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-[#2563EB] text-[#2563EB]'
                      : 'border-transparent text-[#5E6875] hover:text-[#17202A]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5EAF0] bg-[#F7F9FC] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#E5EAF0] hover:bg-slate-50 text-[#17202A] font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
