import React from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

interface DialogHeaderProps {
  children: React.ReactNode
}

interface DialogTitleProps {
  children: React.ReactNode
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  )
}

export const DialogContent: React.FC<DialogContentProps> = ({ className = '', children }) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children }) => {
  return (
    <div className="flex items-center justify-between pb-4 border-b">
      {children}
    </div>
  )
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ children }) => {
  return (
    <h2 className="text-lg font-semibold">
      {children}
    </h2>
  )
}