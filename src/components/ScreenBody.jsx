'use client';

import React from 'react';

export default function ScreenBody({ children }) {
  return <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-4xl flex-1 overflow-y-auto p-[18px] md:p-6 pb-10">{children}</div>;
}

