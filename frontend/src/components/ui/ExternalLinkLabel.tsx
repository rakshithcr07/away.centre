import { ExternalLink } from 'lucide-react';

interface ExternalLinkLabelProps {
  href: string;
  label?: string;
}

export function ExternalLinkLabel({ href, label }: ExternalLinkLabelProps) {
  const url = href.startsWith('http') ? href : `https://${href}`;
  const display = label ?? href.replace(/^https?:\/\//, '');

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-away hover:underline text-sm flex items-center gap-1"
    >
      {display}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
