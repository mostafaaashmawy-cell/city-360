'use client';

import { useSettings } from '@/context/SettingsContext';

interface CoohomIframeProps {
  url: string;
}

export default function CoohomIframe({ url }: CoohomIframeProps) {
  const { settings } = useSettings();

  return (
    <iframe
      src={url || settings.coohom_url}
      title="Virtual Property Tour"
      className="fixed inset-0 w-full h-full border-none"
      style={{ zIndex: 0 }}
      allowFullScreen
      allow="xr-spatial-tracking; gyroscope; accelerometer; autoplay; fullscreen"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-top-navigation"
      loading="lazy"
    />
  );
}
