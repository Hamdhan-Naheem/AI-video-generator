import {useCurrentFrame} from 'remotion';

export type GraphicKind = 'socket' | 'conversion' | 'turbine' | 'generator' | 'current' | 'transmission' | 'summary';

const ink = '#dff6fa';
const cyan = '#6ee7ee';
const gold = '#ffd17a';
const blue = '#2b91b6';

export function graphicKindFor(description: string, templateId: string): GraphicKind {
  const text = description.toLowerCase();
  if (templateId === 'teacher_intro_v1' && /socket|outlet/.test(text)) return 'socket';
  if (templateId === 'teacher_explanation_v1' && /conversion|energy/.test(text)) return 'conversion';
  if (templateId === 'teacher_conclusion_v1' && /summary|generation/.test(text)) return 'summary';
  if (/transmission|power lines|pylons|regional/.test(text)) return 'transmission';
  if (/electrons|magnetic field|electric current/.test(text)) return 'current';
  if (/generator|copper coils|central shaft/.test(text)) return 'generator';
  if (/turbine|blade/.test(text)) return 'turbine';
  throw new Error(`No authored diagram matches ${templateId} visual description`);
}

const IconLabel = ({x, y, label}: {x: number; y: number; label: string}) => <text x={x} y={y} textAnchor="middle" fill={ink} fontSize="30" fontWeight="700">{label}</text>;

const Turbine = ({x, y, angle}: {x: number; y: number; angle: number}) => <g>
  <circle cx={x} cy={y} r="108" fill="#173f5b" stroke={cyan} strokeWidth="10" />
  <g transform={`rotate(${angle} ${x} ${y})`} fill={cyan}>
    <path d={`M${x - 15} ${y - 17} Q${x - 28} ${y - 74} ${x - 5} ${y - 92} Q${x + 26} ${y - 63} ${x + 12} ${y - 10}Z`} />
    <path d={`M${x + 14} ${y - 7} Q${x + 75} ${y - 36} ${x + 92} ${y - 8} Q${x + 64} ${y + 25} ${x + 8} ${y + 15}Z`} />
    <path d={`M${x + 2} ${y + 16} Q${x + 25} ${y + 72} ${x - 5} ${y + 93} Q${x - 36} ${y + 60} ${x - 12} ${y + 8}Z`} />
    <path d={`M${x - 15} ${y + 8} Q${x - 78} ${y + 36} ${x - 94} ${y + 5} Q${x - 61} ${y - 22} ${x - 9} ${y - 14}Z`} />
  </g>
  <circle cx={x} cy={y} r="20" fill={gold} />
</g>;

const Bolt = ({x, y, scale = 1}: {x: number; y: number; scale?: number}) => <path d="M0 0 L-23 56 H1 L-11 112 L39 36 H12 L27 0 Z" transform={`translate(${x} ${y}) scale(${scale})`} fill={gold} />;

const House = ({x, y}: {x: number; y: number}) => <g>
  <path d={`M${x - 60} ${y + 15} L${x} ${y - 40} L${x + 60} ${y + 15} V${y + 95} H${x - 60}Z`} fill="#c8ebee" stroke={blue} strokeWidth="8" />
  <rect x={x - 15} y={y + 35} width="30" height="60" fill={gold} />
</g>;

const Pylon = ({x, y}: {x: number; y: number}) => <g stroke={cyan} strokeWidth="7" fill="none">
  <path d={`M${x} ${y - 90} L${x - 43} ${y + 100} M${x} ${y - 90} L${x + 43} ${y + 100} M${x - 70} ${y - 38} H${x + 70} M${x - 58} ${y + 3} H${x + 58} M${x - 43} ${y + 43} H${x + 43} M${x - 48} ${y + 100} H${x + 48}`} />
</g>;

export const EducationalGraphic = ({kind, turbineSpin, generatorPulse, electricityFlow, compact = false}: {
  kind: GraphicKind;
  turbineSpin: boolean;
  generatorPulse: boolean;
  electricityFlow: boolean;
  compact?: boolean;
}) => {
  const frame = useCurrentFrame();
  const angle = turbineSpin ? frame * 3 : 0;
  const glow = generatorPulse ? 0.55 + 0.42 * (Math.sin(frame / 9) + 1) / 2 : 0.75;
  const dash = electricityFlow ? -frame * 4 : 0;
  return <svg width="100%" height="100%" viewBox="0 0 800 680" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${kind} educational animation`}>
    <defs>
      <linearGradient id={`panel-${kind}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#173a5b" /><stop offset="1" stopColor="#245b73" /></linearGradient>
      <filter id={`glow-${kind}`}><feGaussianBlur stdDeviation="8" /></filter>
    </defs>
    <rect x="12" y="12" width="776" height="656" rx="36" fill={`url(#panel-${kind})`} stroke="#4689a0" strokeWidth="4" />
    {kind === 'socket' && <>
      <circle cx="402" cy="280" r="166" fill="#286985" opacity="0.65" />
      <rect x="304" y="181" width="196" height="196" rx="42" fill="#e6f6f2" stroke={cyan} strokeWidth="14" />
      <rect x="353" y="238" width="22" height="59" rx="11" fill="#1c5270" /><rect x="429" y="238" width="22" height="59" rx="11" fill="#1c5270" />
      <path d="M391 323 Q403 335 415 323" stroke="#1c5270" strokeWidth="12" fill="none" />
      <Bolt x={516} y={116} scale={0.8} /><IconLabel x={400} y={505} label="Where does power begin?" />
    </>}
    {kind === 'conversion' && <>
      <IconLabel x={400} y={88} label="ENERGY CONVERSION" />
      <g fill="#225f7e" stroke={cyan} strokeWidth="5"><rect x="80" y="175" width="190" height="252" rx="26" /><rect x="305" y="175" width="190" height="252" rx="26" /><rect x="530" y="175" width="190" height="252" rx="26" /></g>
      <text x="175" y="295" textAnchor="middle" fill={gold} fontSize="90">☀</text>
      <Turbine x={400} y={296} angle={angle} />
      <Bolt x={614} y={236} scale={0.9} />
      <path d="M267 303 H305 M493 303 H532" stroke={gold} strokeWidth="13" markerEnd="none" />
      <IconLabel x={175} y={485} label="SOURCE" /><IconLabel x={400} y={485} label="MOTION" /><IconLabel x={625} y={485} label="POWER" />
      <text x="400" y="590" textAnchor="middle" fill={ink} fontSize="27">Different energy sources can make electricity.</text>
    </>}
    {kind === 'turbine' && <>
      <IconLabel x={400} y={86} label="WHAT TURNS A TURBINE?" />
      <g fill="#2a7894" stroke={cyan} strokeWidth="5"><rect x="62" y="126" width="204" height="112" rx="22" /><rect x="299" y="126" width="204" height="112" rx="22" /><rect x="536" y="126" width="204" height="112" rx="22" /></g>
      <IconLabel x={164} y={195} label="WIND" /><IconLabel x={400} y={195} label="WATER" /><IconLabel x={638} y={195} label="STEAM" />
      <path d="M165 255 Q200 320 290 362 M400 253 V344 M638 255 Q598 320 508 362" fill="none" stroke={gold} strokeWidth="12" strokeDasharray="18 12" strokeDashoffset={dash} />
      <Turbine x={400} y={455} angle={angle} />
      <IconLabel x={400} y={624} label="Moving energy spins the blades" />
    </>}
    {kind === 'generator' && <>
      <IconLabel x={400} y={80} label="TURBINE → SHAFT → GENERATOR" />
      <Turbine x={172} y={340} angle={angle} />
      <path d="M290 340 H440" stroke={gold} strokeWidth="24" strokeLinecap="round" strokeDasharray="25 12" strokeDashoffset={dash} />
      <rect x="435" y="194" width="295" height="290" rx="40" fill="#174b6d" stroke={cyan} strokeWidth="10" />
      {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={492 + i * 62} cy="340" rx="24" ry="107" fill="none" stroke="#efaa67" strokeWidth="13" />)}
      <g transform={`rotate(${angle} 582 340)`}><rect x="544" y="290" width="76" height="100" rx="15" fill={gold} opacity={glow} /><text x="581" y="354" textAnchor="middle" fill="#173a5b" fontSize="35" fontWeight="900">N S</text></g>
      <IconLabel x={172} y={548} label="TURBINE" /><IconLabel x={582} y={548} label="COPPER COILS + MAGNET" />
      <text x="400" y="612" textAnchor="middle" fill={ink} fontSize="26">The shaft carries rotation into the generator.</text>
    </>}
    {kind === 'current' && <>
      <IconLabel x={400} y={83} label="MAGNETIC MOTION → ELECTRICAL FLOW" />
      <circle cx="220" cy="326" r="130" fill="#2c7291" opacity={glow} filter={`url(#glow-${kind})`} />
      <circle cx="220" cy="326" r="106" fill="#1c5876" stroke={cyan} strokeWidth="12" />
      <g transform={`rotate(${angle || frame * 2} 220 326)`}><path d="M165 305 H275 V347 H165Z" fill={gold} /><text x="220" y="337" textAnchor="middle" fill="#143653" fontSize="33" fontWeight="800">N  S</text></g>
      {[0, 1, 2].map((i) => <ellipse key={i} cx={475 + 65 * i} cy="326" rx="28" ry="125" stroke="#e8a86d" strokeWidth="15" fill="none" />)}
      <path d="M370 505 H690" stroke={cyan} strokeWidth="20" strokeDasharray="23 19" strokeDashoffset={dash} />
      <Bolt x={704} y={455} scale={0.65} /><IconLabel x={220} y={554} label="ROTATING FIELD" /><IconLabel x={541} y={610} label="CURRENT IN WIRES" />
    </>}
    {kind === 'transmission' && <>
      <IconLabel x={400} y={80} label="ELECTRICITY TRAVELS" />
      <rect x="69" y="352" width="142" height="127" rx="15" fill="#d8eeee" stroke={cyan} strokeWidth="9" />
      <rect x="105" y="300" width="69" height="52" fill="#d8eeee" stroke={cyan} strokeWidth="8" />
      <Pylon x={350} y={363} /><Pylon x={532} y={363} /><House x={698} y={354} />
      <path d="M193 288 Q344 185 520 267 Q605 235 690 300" fill="none" stroke={gold} strokeWidth="9" strokeDasharray="20 20" strokeDashoffset={dash} />
      <IconLabel x={142} y={555} label="POWER STATION" /><IconLabel x={439} y={555} label="TRANSMISSION" /><IconLabel x={692} y={555} label="HOMES" />
      <text x="400" y="620" textAnchor="middle" fill={ink} fontSize="26">High-voltage lines carry power long distances.</text>
    </>}
    {kind === 'summary' && <>
      <Turbine x={190} y={302} angle={angle} />
      <path d="M306 302 H481" stroke={cyan} strokeWidth="15" strokeDasharray="26 18" strokeDashoffset={dash} />
      <rect x="483" y="193" width="161" height="218" rx="30" fill="#2e7492" stroke={cyan} strokeWidth="11" />
      <Bolt x={554} y={244} scale={0.8} />
      <IconLabel x={190} y={481} label="MOTION" /><IconLabel x={564} y={481} label="ELECTRICITY" />
      <text x="400" y="574" textAnchor="middle" fill={gold} fontSize="40" fontWeight="800">KEEP EXPLORING SCIENCE!</text>
    </>}
    {compact && <rect x="12" y="12" width="776" height="656" rx="36" stroke={gold} strokeWidth="3" fill="none" opacity="0.35" />}
  </svg>;
};
