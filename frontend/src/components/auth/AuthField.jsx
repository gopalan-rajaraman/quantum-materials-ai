import React from 'react';

const Ico = ({ d, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export const IconLock = () => <Ico d="M7 11V7a5 5 0 0 1 10 0v4M3 11h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />;
export const IconEye = () => <Ico d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />;
export const IconEyeOff = () => <Ico d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />;

const AuthField = ({ label, icon, children, mb = 11 }) => (
  <div style={{ marginBottom: mb }}>
    <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
        {icon}
      </span>
      {children}
    </div>
  </div>
);

export default AuthField;
