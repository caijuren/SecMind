'use client';

import dynamic from 'next/dynamic';

const SecmindApp = dynamic(() => import('../SecmindApp'), {
  ssr: false,
});

export default function Page() {
  return <SecmindApp />;
}
