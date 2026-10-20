import {Composition} from 'remotion';
import {OfflineElectricityDemo} from './compositions/OfflineElectricityDemo';

export const Root = () => (
  <Composition
    id="OfflineElectricityDemo"
    component={OfflineElectricityDemo}
    durationInFrames={180}
    fps={30}
    width={1080}
    height={1920}
  />
);
