import {Composition, getInputProps} from 'remotion';
import {OfflineElectricityDemo} from './compositions/OfflineElectricityDemo';
import {ElectricityStoryboardDraft} from './compositions/ElectricityStoryboardDraft';
import type {DraftTimeline} from './video/timeline';
import {validateDraftTimeline} from './video/timeline';
import {validateRenderSettings} from './video/render-settings';
import {ShowcaseVideo} from './showcase/ShowcaseVideo';
import {productShowcasePlan, softwareShowcasePlan, SHOWCASE_FPS, SHOWCASE_HEIGHT, SHOWCASE_WIDTH, showcaseDurationFrames, validateShowcasePlan} from './showcase/plans';
import {validateShowcaseVoiceoverTimeline} from './showcase/voiceover-timeline';

const showcaseMetadata = (expectedCategory: 'product' | 'project_explainer') => ({props}: {props: Parameters<typeof ShowcaseVideo>[0]}) => {
  validateRenderSettings(props, Boolean(props.voiceover));
  validateShowcasePlan(props.plan);
  if (props.plan.category !== expectedCategory) throw new Error(`Showcase category must be ${expectedCategory}`);
  if (props.voiceover) validateShowcaseVoiceoverTimeline(props.plan, undefined, props.voiceover);
  return {durationInFrames: props.voiceover?.durationFrames ?? showcaseDurationFrames(props.plan)};
};

export const Root = () => {
  const inputProps = getInputProps() as {timeline?: DraftTimeline};
  return (
    <>
    <Composition
      id="OfflineElectricityDemo"
      component={OfflineElectricityDemo}
      durationInFrames={180}
      fps={30}
      width={1080}
      height={1920}
    />
    {inputProps.timeline && <Composition
      id="ElectricityStoryboardDraft"
      component={ElectricityStoryboardDraft}
      defaultProps={{timeline: inputProps.timeline, includeAudio: false}}
      calculateMetadata={({props}) => {
        validateRenderSettings(props, false);
        validateDraftTimeline(props.timeline);
        return {durationInFrames: Math.round(props.timeline.durationSeconds * props.timeline.fps)};
      }}
      durationInFrames={2250}
      fps={30}
      width={1080}
      height={1920}
    />}
    <Composition
      id="ProductShowcaseDemo"
      component={ShowcaseVideo}
      defaultProps={{plan: productShowcasePlan}}
      durationInFrames={showcaseDurationFrames(productShowcasePlan)}
      calculateMetadata={showcaseMetadata('product')}
      fps={SHOWCASE_FPS}
      width={SHOWCASE_WIDTH}
      height={SHOWCASE_HEIGHT}
    />
    <Composition
      id="SoftwareExplainerDemo"
      component={ShowcaseVideo}
      defaultProps={{plan: softwareShowcasePlan}}
      durationInFrames={showcaseDurationFrames(softwareShowcasePlan)}
      calculateMetadata={showcaseMetadata('project_explainer')}
      fps={SHOWCASE_FPS}
      width={SHOWCASE_WIDTH}
      height={SHOWCASE_HEIGHT}
    />
    </>
  );
};
