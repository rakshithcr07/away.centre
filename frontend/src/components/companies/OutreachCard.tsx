import type { OutreachRecommendation } from '@away/shared';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Badge } from '@/components/ui/Badge';
import { KeyValue } from '@/components/ui/KeyValue';
import { formatConfidence } from '@/lib/utils/signals';

interface OutreachCardProps {
  outreach: OutreachRecommendation;
}

export function OutreachCard({ outreach }: OutreachCardProps) {
  return (
    <Card className="mb-8 border-away-500/30">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle title="Outreach Recommendation" className="mb-0" />
        {outreach.requires_human_review && (
          <Badge variant="warning">Requires Review</Badge>
        )}
      </div>
      <div className="space-y-3">
        <KeyValue label="Subject" value={outreach.subject} />
        <KeyValue
          label="Recommended Product"
          value={<span className="text-away-400 font-medium">{outreach.recommended_product}</span>}
        />
        <KeyValue label="Pain Point" value={<span className="text-gray-300">{outreach.pain_point}</span>} />
        <KeyValue label="Message" value={<span className="text-gray-300">{outreach.personalization}</span>} />
        <KeyValue label="CTA" value={<span className="text-gray-300">{outreach.cta}</span>} />
        <p className="text-xs text-gray-500">
          AI Confidence: {formatConfidence(outreach.ai_confidence)}
        </p>
      </div>
    </Card>
  );
}
