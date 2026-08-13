'use client'

import React from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { triggerPrint, formatDateTime } from '@/lib/print-utils'

interface PrintLayoutProps {
  children: React.ReactNode
  title: string
  showPrintButton?: boolean
  hospitalName?: string
  hospitalAddress?: string
  hospitalPhone?: string
  hospitalEmail?: string
}

export function PrintLayout({
  children,
  title,
  showPrintButton = true,
  hospitalName = 'Doctorooms Hospital',
  hospitalAddress = '',
  hospitalPhone = '',
  hospitalEmail = '',
}: PrintLayoutProps) {
  return (
    <div className="relative">
      {showPrintButton && (
        <div className="no-print mb-4 flex justify-end">
          <Button onClick={triggerPrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print {title}
          </Button>
        </div>
      )}
      <div className="print-area">
        <div className="header">
          <h1>{hospitalName}</h1>
          {hospitalAddress && <p>{hospitalAddress}</p>}
          {(hospitalPhone || hospitalEmail) && (
            <p>
              {hospitalPhone && <span>Tel: {hospitalPhone}</span>}
              {hospitalPhone && hospitalEmail && ' | '}
              {hospitalEmail && <span>{hospitalEmail}</span>}
            </p>
          )}
        </div>

        <h2 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>{title}</h2>

        {children}

        <div className="footer">
          <p>Generated on {formatDateTime(new Date())} | Powered by HMS</p>
        </div>
      </div>
    </div>
  )
}