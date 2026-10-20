import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Teacher} from '../characters/Teacher';
import {ElectricityDiagram} from '../scenes/ElectricityDiagram';

const captions = [
  {start: 0, end: 59, text: 'How is electricity generated?'},
  {start: 60, end: 119, text: 'A spinning turbine turns a generator.'},
  {start: 120, end: 179, text: 'Electricity then travels to our homes.'},
];

export const OfflineElectricityDemo = () => {
  const frame = useCurrentFrame();
  const sceneOpacity = interpolate(frame, [0, 12, 165, 179], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const caption = captions.find(({start, end}) => frame >= start && frame <= end)?.text ?? '';
  const diagramScale = interpolate(frame, [25, 145], [0.94, 1.02], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: 'linear-gradient(165deg, #102b4f, #174e70 67%, #187186)', color: '#f4fbfc', fontFamily: 'Arial, sans-serif'}}>
      <AbsoluteFill style={{opacity: sceneOpacity}}>
        <div style={{position: 'absolute', top: 115, left: 80, right: 80, fontSize: 44, fontWeight: 700, color: '#8ce6ef', letterSpacing: 4}}>OFFLINE M0 DEMO</div>
        <div style={{position: 'absolute', top: 190, left: 80, right: 80, fontSize: 89, fontWeight: 800, lineHeight: 1.07}}>How Electricity<br />Is Generated</div>
        <div style={{position: 'absolute', top: 500, left: 380, transform: `scale(${diagramScale})`, transformOrigin: 'center'}}><ElectricityDiagram /></div>
        <div style={{position: 'absolute', top: 780, left: 8}}><Teacher /></div>
        <div style={{position: 'absolute', bottom: 130, left: 70, right: 70, minHeight: 130, borderRadius: 24, backgroundColor: '#081d34e8', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px 38px', fontSize: 49, fontWeight: 700, lineHeight: 1.2}}>{caption}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
