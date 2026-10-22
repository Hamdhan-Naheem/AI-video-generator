import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Teacher} from '../characters/Teacher';
import {EducationalGraphic, graphicKindFor, type GraphicKind} from '../video/EducationalGraphics';
import {mouthOpenAt, type DraftScene, type DraftTimeline} from '../video/timeline';

const titles: Record<GraphicKind, string> = {
  socket: 'HOW IS ELECTRICITY GENERATED?',
  conversion: 'ENERGY CHANGES FORM',
  turbine: 'WHAT MAKES A TURBINE SPIN?',
  generator: 'INSIDE A GENERATOR',
  current: 'FROM MOTION TO CURRENT',
  transmission: 'FROM POWER STATION TO HOME',
  summary: 'NOW YOU KNOW THE JOURNEY',
};

const small = (value: string) => value.toUpperCase().replaceAll('_', ' ');

function SceneContent({scene, time}: {scene: DraftScene; time: number}) {
  const kind = graphicKindFor(scene.visuals.map((visual) => visual.description).join(' '), scene.templateId);
  const withTeacher = scene.templateId !== 'full_screen_diagram_v1';
  const actions = new Set(scene.animationActions);
  const elapsed = time - scene.startSeconds;
  const remaining = scene.endSeconds - time;
  const fade = actions.has('fade_transition') ? Math.min(1, elapsed / 0.32, remaining / 0.32) : Math.min(1, elapsed / 0.45);
  const mouth = withTeacher && mouthOpenAt(time, scene);
  const wave = actions.has('teacher_wave') && (elapsed < 2.5 || remaining < 2.2);
  const point = scene.templateId === 'teacher_explanation_v1' || scene.templateId === 'teacher_beside_diagram_v1';
  const graphic = <EducationalGraphic kind={kind} turbineSpin={actions.has('turbine_spin')} generatorPulse={actions.has('generator_pulse')} electricityFlow={actions.has('electricity_flow')} compact={withTeacher} />;

  return <AbsoluteFill style={{opacity: Math.max(0, fade)}}>
    <div style={{position: 'absolute', left: 66, top: 85, right: 66, display: 'flex', justifyContent: 'space-between', color: '#83dde8', fontSize: 29, fontWeight: 700, letterSpacing: 3}}>
      <span>SCIENCE IN MOTION</span><span>{scene.order.toString().padStart(2, '0')} / 07</span>
    </div>
    <div style={{position: 'absolute', left: 66, top: 180, right: 66, color: '#f4fcfc', fontSize: 70, lineHeight: 1.08, fontWeight: 900, letterSpacing: -1}}>{titles[kind]}</div>
    <div style={{position: 'absolute', left: 66, top: 385, right: 66, height: 4, background: 'linear-gradient(90deg, #fbd17d, #5eddeb, transparent)'}} />
    {scene.templateId === 'teacher_intro_v1' && <>
      <div style={{position: 'absolute', left: 40, top: 670, width: 500, height: 760}}><Teacher speechOpen={mouth} gesture={wave ? 'wave' : 'rest'} animateBlink={actions.has('teacher_blink')} animateHead={actions.has('teacher_head_motion')} /></div>
      <div style={{position: 'absolute', left: 515, top: 720, width: 520, height: 555}}>{graphic}</div>
      <div style={{position: 'absolute', left: 555, top: 1295, width: 430, color: '#ffd17a', fontWeight: 800, fontSize: 39, textAlign: 'center'}}>Let’s follow the energy!</div>
    </>}
    {scene.templateId === 'teacher_explanation_v1' && <>
      <div style={{position: 'absolute', left: 15, top: 700, width: 420, height: 700}}><Teacher width={420} height={700} speechOpen={mouth} gesture={point ? 'point' : 'rest'} animateBlink={actions.has('teacher_blink')} animateHead={actions.has('teacher_head_motion')} /></div>
      <div style={{position: 'absolute', left: 385, top: 650, width: 655, height: 600}}>{graphic}</div>
      <div style={{position: 'absolute', left: 475, top: 1280, width: 480, color: '#b9edf0', fontSize: 30, textAlign: 'center'}}>A source of energy becomes electrical power.</div>
    </>}
    {scene.templateId === 'teacher_beside_diagram_v1' && <>
      <div style={{position: 'absolute', left: 4, top: 730, width: 400, height: 680}}><Teacher width={400} height={680} speechOpen={mouth} gesture={point ? 'point' : 'rest'} animateBlink={actions.has('teacher_blink')} animateHead={actions.has('teacher_head_motion')} /></div>
      <div style={{position: 'absolute', left: 350, top: 615, width: 700, height: 675}}>{graphic}</div>
      <div style={{position: 'absolute', left: 406, top: 1295, width: 595, color: '#b9edf0', fontSize: 28, textAlign: 'center'}}>{kind === 'turbine' ? 'Wind, water and steam can drive the blades.' : 'Power moves through the transmission grid.'}</div>
    </>}
    {scene.templateId === 'full_screen_diagram_v1' && <>
      <div style={{position: 'absolute', left: 48, top: 515, width: 984, height: 900}}>{graphic}</div>
      <div style={{position: 'absolute', left: 95, top: 1450, right: 95, color: '#b9edf0', fontSize: 33, textAlign: 'center'}}>{kind === 'generator' ? 'Mechanical motion turns the generator core.' : 'A moving magnetic field produces electrical flow.'}</div>
    </>}
    {scene.templateId === 'teacher_conclusion_v1' && <>
      <div style={{position: 'absolute', left: 12, top: 690, width: 480, height: 730}}><Teacher width={480} height={730} speechOpen={mouth} gesture={wave ? 'wave' : 'rest'} animateBlink={actions.has('teacher_blink')} animateHead={actions.has('teacher_head_motion')} /></div>
      <div style={{position: 'absolute', left: 460, top: 730, width: 570, height: 550}}>{graphic}</div>
      <div style={{position: 'absolute', left: 520, top: 1295, width: 480, color: '#ffd17a', fontWeight: 800, fontSize: 35, textAlign: 'center'}}>Generation + transmission</div>
    </>}
  </AbsoluteFill>;
}

export function ElectricityStoryboardDraft({timeline, includeAudio = false, showSubtitles = true}: {timeline: DraftTimeline; includeAudio?: boolean; showSubtitles?: boolean}) {
  if (includeAudio) throw new Error('Draft narration is private; render without audio and mux the saved WAV afterward');
  const frame = useCurrentFrame();
  const time = frame / timeline.fps;
  const scene = timeline.scenes.find((item) => time >= item.startSeconds && time < item.endSeconds) ?? timeline.scenes.at(-1)!;
  const subtitle = scene.subtitles.find((item) => time >= item.startSeconds && time < item.endSeconds + 0.04);
  const progress = interpolate(time, [0, timeline.durationSeconds], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: 'radial-gradient(circle at 80% 25%, #276982 0%, #143c5b 48%, #102b4b 100%)', fontFamily: 'Arial, sans-serif', overflow: 'hidden'}}>
    <SceneContent scene={scene} time={time} />
    {showSubtitles && subtitle && <div style={{position: 'absolute', left: 60, right: 60, bottom: 100, height: 195, borderRadius: 25, background: '#061c35ed', border: '2px solid #5ba6b5', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '13px 28px', boxSizing: 'border-box'}}>
      <div style={{color: '#ffffff', textAlign: 'center', fontSize: 47, fontWeight: 750, lineHeight: 1.16, textShadow: '1px 2px 4px #000'}}>{subtitle?.text ?? ''}</div>
    </div>}
    <div style={{position: 'absolute', bottom: 55, left: 60, right: 60, height: 7, borderRadius: 8, background: '#2b6175'}}><div style={{height: 7, borderRadius: 8, background: '#ffd17a', width: `${progress}%`}} /></div>
    <div style={{position: 'absolute', bottom: 20, right: 60, color: '#9ad9e0', fontSize: 18, letterSpacing: 2}}>{small(scene.id)}</div>
  </AbsoluteFill>;
}
