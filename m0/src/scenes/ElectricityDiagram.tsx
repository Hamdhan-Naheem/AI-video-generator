import {interpolate, useCurrentFrame} from 'remotion';

export const ElectricityDiagram = () => {
  const frame = useCurrentFrame();
  const rotation = frame * 5;
  const glow = interpolate(Math.sin(frame / 8), [-1, 1], [0.45, 1]);

  return (
    <svg width="680" height="610" viewBox="0 0 680 610" role="img" aria-label="Turbine drives a generator and sends electricity to homes">
      <defs>
        <linearGradient id="flow" x1="0" x2="1">
          <stop stopColor="#66daf0" />
          <stop offset="1" stopColor="#f3c96c" />
        </linearGradient>
      </defs>
      <path d="M120 287 H560" stroke="url(#flow)" strokeWidth="19" strokeLinecap="round" strokeDasharray="27 17" strokeDashoffset={-frame * 4} opacity={glow} />
      <circle cx="145" cy="287" r="105" fill="#e5f9f9" stroke="#26799b" strokeWidth="15" />
      <g transform={`rotate(${rotation} 145 287)`} fill="#2b92af">
        <path d="M145 272 L128 193 Q145 171 164 195 Z" />
        <path d="M159 290 L226 245 Q248 251 238 274 Z" />
        <path d="M141 304 L171 380 Q159 401 139 381 Z" />
        <path d="M129 293 L63 333 Q40 325 51 304 Z" />
      </g>
      <circle cx="145" cy="287" r="24" fill="#183b63" />
      <rect x="331" y="192" width="139" height="190" rx="25" fill="#dfecee" stroke="#23648d" strokeWidth="13" />
      <circle cx="400" cy="286" r="49" fill="#f3c96c" opacity={glow} />
      <path d="M402 245 L380 292 H403 L389 331 L425 277 H402 L418 245 Z" fill="#173e68" />
      <path d="M547 288 L608 236 L665 288 V390 H547 Z" fill="#dfecee" stroke="#23648d" strokeWidth="13" />
      <rect x="583" y="320" width="30" height="70" fill="#f3c96c" />
      <text x="145" y="455" textAnchor="middle" fontSize="35" fontWeight="700" fill="#e5f9f9">TURBINE</text>
      <text x="401" y="455" textAnchor="middle" fontSize="35" fontWeight="700" fill="#e5f9f9">GENERATOR</text>
      <text x="601" y="455" textAnchor="middle" fontSize="35" fontWeight="700" fill="#e5f9f9">HOME</text>
    </svg>
  );
};
