import { RootCauseAnalysisReport } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';

export function RootCausePanel({ rcaReport }: { rcaReport: RootCauseAnalysisReport | null }) {
  if (!rcaReport) {
    return (
      <Card className="p-4 bg-card/40 border-border/50 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>Root Cause Analysis Engine: Clear (No active verification failures recorded)</span>
        </div>
        <Badge variant="outline" className="border-green-500/50 text-green-500 text-[10px]">Clean State</Badge>
      </Card>
    );
  }

  const top = rcaReport.topCandidate;

  return (
    <Card className="p-5 bg-card/60 backdrop-blur-md border-destructive/40 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-destructive/30 pb-3">
        <div className="flex items-center gap-2 text-destructive font-bold text-sm">
          <ShieldAlert className="w-4 h-4" />
          <span>Root Cause Analysis Report</span>
        </div>
        <Badge variant="outline" className="border-destructive text-destructive font-mono text-[10px]">
          Task: {rcaReport.taskId}
        </Badge>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <span className="text-muted-foreground font-semibold block text-[10px] uppercase">Problem Summary</span>
          <span className="font-semibold text-foreground text-sm">{rcaReport.problem}</span>
        </div>

        {top && (
          <div className="bg-destructive/10 border border-destructive/30 rounded p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground text-xs">{top.cause}</span>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  top.confidence === 'HIGH' ? 'border-destructive text-destructive font-bold' :
                  top.confidence === 'MEDIUM' ? 'border-yellow-500 text-yellow-500' :
                  'border-muted-foreground text-muted-foreground'
                }`}
              >
                Confidence: {top.confidence}
              </Badge>
            </div>

            <div>
              <span className="text-muted-foreground text-[10px] uppercase block font-semibold">Evidence Trace</span>
              <code className="bg-background/80 p-1.5 rounded block text-[10px] font-mono text-destructive truncate">
                {top.evidence}
              </code>
            </div>

            <div>
              <span className="text-muted-foreground text-[10px] uppercase block font-semibold">Recommended Fix Action</span>
              <span className="text-foreground text-xs font-medium">{top.recommendedFix}</span>
            </div>
          </div>
        )}

        {rcaReport.evidenceQuotes.length > 0 && (
          <div className="space-y-1">
            <span className="text-muted-foreground font-semibold block text-[10px] uppercase">Collected Evidence Quotes</span>
            <div className="bg-background/40 p-2 rounded max-h-24 overflow-y-auto space-y-1 font-mono text-[10px]">
              {rcaReport.evidenceQuotes.map((q, i) => (
                <div key={i} className="text-muted-foreground border-b border-border/20 pb-1">{q}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
