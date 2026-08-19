'use client';

import { useSettings } from '@/context/SettingsContext';

interface VirtualTourIframeProps {
  url?: string;
}

export default function CoohomIframe({ url }: VirtualTourIframeProps) {
  const { activeProject } = useSettings();

  const tourUrl = url || activeProject.virtual_tour_url || activeProject.coohom_url;

  return (
    <iframe
      src={tourUrl}
      title="Virtual Property Tour"
      className="fixed inset-0 w-full h-full border-none"
      style={{ zIndex: 0 }}
      allowFullScreen
      allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
      loading="lazy"
    />
  );
}
