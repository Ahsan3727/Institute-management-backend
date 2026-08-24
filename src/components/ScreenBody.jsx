'use client';

import React from 'react';

export default function ScreenBody({ children }) {
  return <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto p-[18px] pb-10">{children}</div>;
}
