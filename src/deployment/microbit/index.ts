// We disable checking as the open source project doesn't include the Micro:bit Educational Foundation deployment package.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import externalDeploymentFactory from "@microbit-foundation/ml-trainer-microbit";
import "@microbit-foundation/ml-trainer-microbit/fonts/fonts.css";
import simpleAiExerciseTimer from "@microbit-foundation/ml-trainer-microbit/images/simple-ai-exercise-timer.png";
import aiActivityTimer from "@microbit-foundation/ml-trainer-microbit/images/ai-activity-timer.png";
import { DeploymentConfig } from "..";

// We have to pull the assets into the build/deployment here for build-related/ESM reasons.
// We import the fonts above.
const assetDecoratedDeploymentFactory = (...args): DeploymentConfig => {
  const result = externalDeploymentFactory(args);
  return {
    ...result,
    projectImages: [aiActivityTimer, simpleAiExerciseTimer],
  };
};

export default assetDecoratedDeploymentFactory;
