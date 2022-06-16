import React from 'react';

export default function ClientOnly({ children }: { children: React.ReactElement }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return children;
}
