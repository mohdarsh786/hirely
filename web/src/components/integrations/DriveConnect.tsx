'use client';

import { GoogleConnect } from './GoogleConnect';

interface DriveConnectProps {
  jobId: string;
}

export function DriveConnect({ jobId }: DriveConnectProps) {
  return <GoogleConnect jobId={jobId} provider="drive" />;
}
