'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Monitor, ExternalLink, Building2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  hospitalId: string
  hospitalName: string
}

export default function HospitalQueueDisplayClient({ hospitalId, hospitalName }: Props) {
  const [copied, setCopied] = useState(false)

  const displayUrl = `/hospital/${hospitalId}/queue-display`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + displayUrl)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Monitor className="h-5 w-5 text-violet-600" />
          Queue Display Board
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage the live OPD queue display for your hospital waiting area.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{hospitalName}</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md max-w-md truncate">
                {window.location.origin}{displayUrl}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                {copied ? 'Copied' : 'Copy Link'}
              </Button>
              <Button
                size="sm"
                onClick={() => window.open(displayUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Open Display
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="h-5 w-5 text-teal-400" />
              <h3 className="font-semibold">TV/Monitor Display</h3>
            </div>
            <p className="text-sm text-slate-300">
              Open the display link on a TV or large monitor in your hospital waiting area. It auto-refreshes every 15 seconds.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20 border-violet-200 dark:border-violet-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-amber-500 text-white border-0 text-xs">Auto-Cycle</Badge>
              <h3 className="font-semibold">Department Rotation</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              The display automatically cycles through all departments every 8 seconds. Patients can pin a department by clicking on it.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20 border-teal-200 dark:border-teal-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-emerald-500 text-white border-0 text-xs">Privacy</Badge>
              <h3 className="font-semibold">Patient Privacy</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Only token numbers are shown on the display — no patient names or personal information. Safe for public viewing.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Live Preview</h3>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-slate-900">
            <iframe
              src={displayUrl}
              className="w-full h-full"
              title="Queue Display Preview"
              sandbox="allow-scripts"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
