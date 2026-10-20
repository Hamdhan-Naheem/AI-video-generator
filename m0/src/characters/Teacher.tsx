import {useCurrentFrame} from 'remotion';

// Original shape-based teacher. Frame cues are deliberately synthetic in Phase 1.
export const Teacher = () => {
  const frame = useCurrentFrame();
  const blink = frame % 83 >= 39 && frame % 83 <= 42;
  const mouthOpen = [[14, 32], [49, 69], [102, 124], [151, 165]].some(
    ([start, end]) => frame >= start && frame <= end,
  );
  const wave = frame >= 18 && frame <= 70;
  const headY = Math.sin(frame / 16) * 5;
  const armAngle = wave ? -15 + Math.sin(frame / 4) * 12 : 8;

  return (
    <svg width="500" height="760" viewBox="0 0 500 760" role="img" aria-label="Original cartoon teacher">
      <ellipse cx="250" cy="728" rx="170" ry="23" fill="#102846" opacity="0.24" />
      <path d="M125 475 Q90 510 85 705 L416 705 Q408 520 375 475 Z" fill="#206794" />
      <path d="M221 453 L250 581 L279 453" fill="#eef9f9" />
      <path d="M244 500 L226 635 L250 668 L274 635 L256 500 Z" fill="#eeaa43" />
      <path d="M129 516 Q91 561 70 666" stroke="#206794" strokeWidth="66" fill="none" strokeLinecap="round" />
      <circle cx="70" cy="667" r="31" fill="#d99067" />
      <g transform={`rotate(${armAngle} 375 518)`}>
        <path d="M374 518 Q424 548 450 658" stroke="#206794" strokeWidth="66" fill="none" strokeLinecap="round" />
        <ellipse cx="452" cy="671" rx="30" ry="38" fill="#d99067" />
      </g>
      <g transform={`translate(0 ${headY})`}>
        <path d="M135 244 Q122 129 245 111 Q373 118 369 254 L353 386 Q325 461 251 477 Q170 450 147 384 Z" fill="#d99067" />
        <path d="M132 239 Q132 127 219 110 Q296 85 354 156 Q375 186 367 256 Q343 224 330 190 Q251 229 162 214 Z" fill="#29334b" />
        <path d="M151 255 Q139 309 148 352" stroke="#29334b" strokeWidth="24" fill="none" strokeLinecap="round" />
        <path d="M348 245 Q363 307 350 354" stroke="#29334b" strokeWidth="22" fill="none" strokeLinecap="round" />
        <ellipse cx="151" cy="322" rx="24" ry="36" fill="#d99067" />
        <ellipse cx="350" cy="322" rx="24" ry="36" fill="#d99067" />
        {blink ? (
          <>
            <path d="M194 302 Q215 310 235 301 M266 301 Q286 310 307 301" stroke="#29334b" strokeWidth="8" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="214" cy="300" rx="9" ry="14" fill="#29334b" />
            <ellipse cx="286" cy="300" rx="9" ry="14" fill="#29334b" />
          </>
        )}
        <path d="M247 305 Q240 348 254 349" stroke="#b66c51" strokeWidth="6" fill="none" strokeLinecap="round" />
        {mouthOpen ? (
          <ellipse cx="251" cy="393" rx="28" ry="20" fill="#733d47" />
        ) : (
          <path d="M223 389 Q251 402 280 389" stroke="#733d47" strokeWidth="7" fill="none" strokeLinecap="round" />
        )}
        <path d="M188 263 Q211 250 235 262 M266 262 Q289 250 311 263" stroke="#29334b" strokeWidth="8" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};
