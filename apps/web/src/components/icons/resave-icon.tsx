type ReSaveIconProps = {
  className?: string;
  size?: number;
};

export function ReSaveIcon({ className, size = 24 }: ReSaveIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left page */}
      <path
        d="M2 3H9C10.0609 3 11.0783 3.42143 11.8284 4.17157C12.5786 4.92172 13 5.93913 13 7V21C13 20.2044 12.6839 19.4413 12.1213 18.8787C11.5587 18.3161 10.7956 18 10 18H2V3Z"
        fill="#3B82F6"
        stroke="#2563EB"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right page */}
      <path
        d="M22 3H15C13.9391 3 12.9217 3.42143 12.1716 4.17157C11.4214 4.92172 11 5.93913 11 7V21C11 20.2044 11.3161 19.4413 11.8787 18.8787C12.4413 18.3161 13.2044 18 14 18H22V3Z"
        fill="#60A5FA"
        stroke="#3B82F6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left page lines */}
      <line x1="5" y1="8" x2="10" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="12" x2="9" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      {/* Right page lines */}
      <line x1="14" y1="8" x2="19" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="12" x2="18" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
