import type {CSSProperties} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {showcaseDurationFrames, type ShowcasePlan, type ShowcaseScene} from './plans';
import type {ShowcaseVoiceoverTimeline, VoiceoverScene} from './voiceover-timeline';

const motion = (frame: number, delay = 0, distance = 42): CSSProperties => {
  const amount = interpolate(frame, [delay, delay + 21], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {opacity: amount, transform: `translateY(${(1 - amount) * distance}px)`};
};

function SceneHeading({scene, frame, accent}: {scene: ShowcaseScene; frame: number; accent: string}) {
  return <div style={{position: 'absolute', left: 74, right: 74, top: 225}}>
    <div style={{...motion(frame, 3), color: accent, letterSpacing: 5, fontSize: 30, fontWeight: 800}}>{scene.eyebrow}</div>
    <div style={{...motion(frame, 8), whiteSpace: 'pre-line', marginTop: 29, fontSize: 92, lineHeight: 1.06, letterSpacing: -4, fontWeight: 850, color: '#fffaf0'}}>{scene.title}</div>
  </div>;
}

function ProductLamp({frame, compact = false}: {frame: number; compact?: boolean}) {
  const appear = interpolate(frame, [0, 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const float = Math.sin(frame / 18) * 9;
  const glow = 0.68 + Math.sin(frame / 21) * 0.08;
  return <svg viewBox="0 0 500 650" width={compact ? 350 : 500} height={compact ? 455 : 650} style={{overflow: 'visible', opacity: appear, transform: `translateY(${(1 - appear) * 120 + float}px) scale(${0.78 + appear * 0.22})`}} role="img" aria-label="Original illustrated portable lamp">
    <defs>
      <linearGradient id="lampShade" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff5cf"/><stop offset="0.55" stopColor="#e6d59f"/><stop offset="1" stopColor="#9b8053"/></linearGradient>
      <linearGradient id="lampStem" x1="0" x2="1"><stop stopColor="#a58b5c"/><stop offset="0.5" stopColor="#fff3c9"/><stop offset="1" stopColor="#9b8158"/></linearGradient>
      <radialGradient id="lampGlow"><stop stopColor="#ffe9a0" stopOpacity=".8"/><stop offset="1" stopColor="#ffe9a0" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="250" cy="255" rx="245" ry="245" fill="url(#lampGlow)" opacity={glow}/>
    <ellipse cx="250" cy="606" rx="179" ry="27" fill="#0a1824" opacity=".55"/>
    <rect x="236" y="295" width="28" height="247" rx="13" fill="url(#lampStem)"/>
    <path d="M110 235 Q250 88 390 235 L365 341 Q250 392 135 341 Z" fill="url(#lampShade)" stroke="#fff9dd" strokeWidth="9"/>
    <ellipse cx="250" cy="339" rx="116" ry="21" fill="#fff5cb" opacity=".8"/>
    <path d="M178 541 Q250 520 322 541 L375 579 Q379 592 362 598 L138 598 Q121 592 125 579 Z" fill="url(#lampStem)" stroke="#fff4c9" strokeWidth="6"/>
    <circle cx="250" cy="566" r="10" fill="#fff7db"/>
  </svg>;
}

const featureData = [
  {number: '01', title: 'Touch control', detail: 'Set the mood in a tap.'},
  {number: '02', title: 'Rechargeable', detail: 'Carry your light anywhere.'},
  {number: '03', title: 'Warm glow', detail: 'A softer kind of bright.'},
];

export function cueFrame(span: VoiceoverScene | undefined, word: string, fallback: number) {
  const cue = span?.words.find(({text}) => text.toLowerCase().replace(/[^a-z]/g, '') === word.toLowerCase());
  return cue ? Math.max(0, Math.round(cue.startSeconds * 30) - span!.startFrame) : fallback;
}

function ProductLayout({scene, frame, voiceover, span}: {scene: ShowcaseScene; frame: number; voiceover: boolean; span?: VoiceoverScene}) {
  if (scene.layout === 'product_hero') return <>
    <div style={{position: 'absolute', left: 290, top: 740}}><ProductLamp frame={frame} /></div>
    {!voiceover && <div style={{...motion(frame, 30), position: 'absolute', left: 74, right: 74, bottom: 235, textAlign: 'center', color: '#e8dfc9', fontSize: 36}}>{scene.caption}</div>}
  </>;
  if (scene.layout === 'product_features') return <>
    <div style={{position: 'absolute', left: 34, top: 850}}><ProductLamp frame={frame} compact /></div>
    <div style={{position: 'absolute', left: 420, right: 73, top: 725, display: 'grid', gap: 26}}>
      {featureData.map((feature, index) => <div key={feature.number} style={{...motion(frame, voiceover ? cueFrame(span, ['tap', 'recharge', 'comfortable'][index], 11 + index * 13) : 11 + index * 13), borderRadius: 27, padding: '29px 32px', minHeight: 153, boxSizing: 'border-box', background: '#fff5dc16', border: '2px solid #ebd38c66', boxShadow: '0 20px 40px #0c141d44'}}>
        <div style={{color: '#e8ce86', fontSize: 24, fontWeight: 800, letterSpacing: 3}}>{feature.number} / FEATURE</div>
        <div style={{color: '#fff9e9', fontSize: 41, fontWeight: 800, marginTop: 8}}>{feature.title}</div>
        <div style={{color: '#d9d8ce', fontSize: 27, marginTop: 4}}>{feature.detail}</div>
      </div>)}
    </div>
    {!voiceover && <div style={{...motion(frame, 48), position: 'absolute', left: 74, right: 74, bottom: 212, color: '#d9d8ce', fontSize: 32, textAlign: 'center'}}>{scene.caption}</div>}
  </>;
  return <>
    <div style={{position: 'absolute', left: 290, top: 670}}><ProductLamp frame={frame} /></div>
    <div style={{...motion(frame, 30), position: 'absolute', left: 194, right: 194, bottom: voiceover ? 390 : 260, height: 110, borderRadius: 60, background: '#e9d18d', color: '#24313a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 850, boxShadow: '0 18px 55px #e9d18d55'}}>{scene.caption}</div>
  </>;
}

function DashboardPanel({frame, mode, workflowRange, chartStart}: {frame: number; mode: 'overview' | 'workflow' | 'insights'; workflowRange?: [number, number]; chartStart?: number}) {
  const rows = ['Launch page', 'Customer research', 'Product walkthrough'];
  const move = interpolate(frame, workflowRange ?? [15, 52], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bar = interpolate(frame, [chartStart ?? 16, (chartStart ?? 16) + 64], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <div style={{...motion(frame, 6, 80), position: 'absolute', left: 66, right: 66, top: 690, height: 900, borderRadius: 35, overflow: 'hidden', background: '#f5f9fc', boxShadow: '0 45px 100px #031c3588', border: '4px solid #d4e9f1'}}>
    <div style={{height: 84, background: '#e8f1f5', display: 'flex', alignItems: 'center', padding: '0 32px', gap: 12}}>
      {['#fc7778', '#ffd36b', '#63d2a4'].map((color) => <span key={color} style={{width: 20, height: 20, background: color, borderRadius: 20}} />)}
      <span style={{marginLeft: 150, fontSize: 26, fontWeight: 800, color: '#314b61'}}>northstar / workspace</span>
    </div>
    <div style={{display: 'flex', height: 816}}>
      <div style={{width: 205, background: '#dfeef2', padding: '37px 22px', boxSizing: 'border-box', color: '#344e5f', fontSize: 25, fontWeight: 750}}>
        <div style={{color: '#077e82', fontSize: 31, marginBottom: 51}}>✦ NORTHSTAR</div>
        <div style={{padding: '18px 12px', borderRadius: 16, background: '#c6e5e8'}}>Overview</div>
        <div style={{padding: '24px 12px'}}>Projects</div><div style={{padding: '12px'}}>Team</div>
      </div>
      <div style={{flex: 1, padding: '35px 30px', color: '#1e394a'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><b style={{fontSize: 39}}>{mode === 'insights' ? 'Project pulse' : 'Launch workspace'}</b><span style={{fontSize: 22, color: '#398889'}}>● On track</span></div>
        <div style={{fontSize: 23, color: '#72838d', marginTop: 6}}>One clear place for the next step</div>
        {mode === 'insights' ? <>
          <div style={{display: 'flex', gap: 15, marginTop: 47}}>{[['24', 'Tasks done'], ['08', 'In progress'], ['03', 'This week']].map(([value, label], i) => <div key={label} style={{...motion(frame, 16 + i * 8), flex: 1, borderRadius: 19, background: '#dff0ee', padding: '24px 15px'}}><b style={{fontSize: 42, color: '#117d80'}}>{value}</b><div style={{fontSize: 20, color: '#527b81'}}>{label}</div></div>)}</div>
          <div style={{marginTop: 56, fontSize: 29, fontWeight: 800}}>Weekly momentum</div>
          <div style={{height: 250, marginTop: 22, borderRadius: 22, background: '#eaf4f5', display: 'flex', alignItems: 'end', justifyContent: 'space-around', padding: '25px'}}>{[0.43, 0.63, 0.52, 0.82, 0.7].map((height, i) => <div key={i} style={{width: 60, height: `${height * bar * 100}%`, borderRadius: '12px 12px 0 0', background: i === 3 ? '#25b9ad' : '#83d5ce'}} />)}</div>
        </> : <>
          <div style={{display: 'flex', gap: 15, marginTop: 46}}>{['TO DO', 'IN PROGRESS', 'DONE'].map((label, i) => <div key={label} style={{flex: 1, background: i === 1 ? '#dff3f1' : '#edf3f5', color: '#52727d', borderRadius: 14, padding: '17px 11px', fontSize: 20, fontWeight: 800}}>{label}</div>)}</div>
          <div style={{display: 'flex', gap: 15, marginTop: 18}}>{[0, 1, 2].map((column) => <div key={column} style={{flex: 1, minHeight: 425, borderRadius: 20, background: column === 1 ? '#e9f6f4' : '#f1f5f6', padding: 12}}>
            {rows.filter((_, index) => mode === 'workflow' ? column === 0 && index > 0 : index === column).map((row) => <div key={row} style={{borderRadius: 14, padding: '22px 12px', marginBottom: 12, background: '#fff', boxShadow: '0 8px 16px #b7cbd555', fontSize: 21, fontWeight: 750, minHeight: 112}}>{row}<div style={{width: 65, height: 9, borderRadius: 5, background: '#6cc9c1', marginTop: 24}} /></div>)}
          </div>)}</div>
          {mode === 'workflow' && <>
            <div style={{position: 'absolute', left: 252 + move * 227, top: 330 - Math.sin(move * Math.PI) * 30, width: 199, minHeight: 112, boxSizing: 'border-box', borderRadius: 14, padding: '22px 12px', background: '#fff', boxShadow: '0 12px 25px #8fb4be77', fontSize: 21, fontWeight: 750, zIndex: 2}}>Launch page<div style={{width: 65, height: 9, borderRadius: 5, background: '#6cc9c1', marginTop: 24}} /></div>
            <div style={{position: 'absolute', left: 375 + move * 130, top: 370 + move * 95, color: '#166d80', fontSize: 65, textShadow: '0 4px 6px #fff', zIndex: 3}}>↗</div>
          </>}
        </>}
      </div>
    </div>
  </div>;
}

function SoftwareLayout({scene, frame, voiceover, span}: {scene: ShowcaseScene; frame: number; voiceover: boolean; span?: VoiceoverScene}) {
  const mode = scene.layout === 'software_insights' ? 'insights' : scene.layout === 'software_workflow' ? 'workflow' : 'overview';
  const workflowRange: [number, number] | undefined = voiceover && span && mode === 'workflow' ? [cueFrame(span, 'move', 15), cueFrame(span, 'progress', 52) + 20] : undefined;
  const chartStart = voiceover && span && mode === 'insights' ? cueFrame(span, 'weekly', 16) : undefined;
  return <><DashboardPanel frame={frame} mode={mode} workflowRange={workflowRange} chartStart={chartStart} />{!voiceover && <div style={{...motion(frame, 24), position: 'absolute', left: 74, right: 74, bottom: 190, color: '#cde7e9', fontSize: 35, textAlign: 'center'}}>{scene.caption}</div>}</>;
}

export type ShowcaseVideoProps = {plan: ShowcasePlan; voiceover?: ShowcaseVoiceoverTimeline; includeAudio?: boolean; showSubtitles?: boolean};

export function ShowcaseVideo({plan, voiceover, includeAudio = false, showSubtitles = true}: ShowcaseVideoProps) {
  const absoluteFrame = useCurrentFrame();
  const span = voiceover?.scenes.find(({startFrame, endFrame}) => absoluteFrame >= startFrame && absoluteFrame < endFrame);
  const scene = voiceover ? plan.scenes.find(({id}) => id === (span?.sceneId ?? voiceover.scenes.at(-1)!.sceneId))! : plan.scenes.find(({startFrame, durationFrames}) => absoluteFrame >= startFrame && absoluteFrame < startFrame + durationFrames) ?? plan.scenes.at(-1)!;
  const startFrame = span?.startFrame ?? scene.startFrame;
  const durationFrames = span ? span.endFrame - span.startFrame : scene.durationFrames;
  const localFrame = absoluteFrame - startFrame;
  const opacity = interpolate(localFrame, [0, 13, durationFrames - 14, durationFrames - 1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const progress = Math.min(1, absoluteFrame / ((voiceover?.durationFrames ?? showcaseDurationFrames(plan)) - 1));
  const product = plan.category === 'product';
  const timeSeconds = absoluteFrame / 30;
  const subtitle = voiceover && showSubtitles ? span?.subtitles.find(({startSeconds, endSeconds}) => timeSeconds >= startSeconds && timeSeconds < endSeconds) : undefined;
  return <AbsoluteFill style={{fontFamily: 'Arial, sans-serif', overflow: 'hidden', background: product ? 'radial-gradient(circle at 55% 45%, #64583a 0%, #25353a 48%, #14252b 100%)' : 'radial-gradient(circle at 60% 35%, #24647a 0%, #173e57 50%, #10283e 100%)'}}>
    {voiceover && includeAudio && <Audio src={staticFile(voiceover.audioStaticPath)} />}
    <div style={{position: 'absolute', inset: 35, border: `2px solid ${plan.accent}55`, borderRadius: 45}} />
    <div style={{position: 'absolute', left: 75, top: 72, color: plan.accent, fontSize: 38, fontWeight: 900, letterSpacing: 7}}>{plan.brand}</div>
    <div style={{position: 'absolute', right: 75, top: 79, color: '#e4e9e7', fontSize: 24, letterSpacing: 3}}>M0 / VISUAL STUDY</div>
    <div style={{opacity}}>
      <SceneHeading scene={scene} frame={localFrame} accent={plan.accent} />
      {product ? <ProductLayout scene={scene} frame={localFrame} voiceover={Boolean(voiceover)} span={span} /> : <SoftwareLayout scene={scene} frame={localFrame} voiceover={Boolean(voiceover)} span={span} />}
    </div>
    {subtitle && <div style={{position: 'absolute', left: 74, right: 74, bottom: 180, minHeight: 118, borderRadius: 23, padding: '15px 24px', boxSizing: 'border-box', background: '#071b2bec', border: `2px solid ${plan.accent}88`, color: '#fff', fontSize: 38, fontWeight: 750, lineHeight: 1.16, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>{subtitle.text}</div>}
    <div style={{position: 'absolute', left: 75, right: 75, bottom: 94, height: 8, borderRadius: 8, background: '#ffffff33'}}><div style={{height: '100%', width: `${progress * 100}%`, borderRadius: 8, background: plan.accent}} /></div>
    <div style={{position: 'absolute', left: 75, bottom: 128, color: '#e7ece8', fontSize: 22, letterSpacing: 3}}>0{plan.scenes.indexOf(scene) + 1} / 0{plan.scenes.length}</div>
    <div style={{position: 'absolute', right: 75, bottom: 128, color: '#e7ece8', fontSize: 22, letterSpacing: 2}}>FICTIONAL {product ? 'PRODUCT' : 'SOFTWARE'} DEMO</div>
  </AbsoluteFill>;
}
