/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { compileModel } from 'ml4f';
import { generateBlob } from '@microbit-foundation/ml-header-generator';
import { LayersModel } from '@tensorflow/tfjs';
import Gesture from '../domain/Gesture';
import { varFromActionLabel } from './utils';

const createMlEvents = (actions: string[]) => {
  let code = '';
  actions.forEach((action, idx) => {
    code += `    //% fixedInstance\n`;
    code += `    export const ${varFromActionLabel(action)} = new MlEvent(${idx + 2}, "${action}");\n`;
  });
  return code;
};

const createEventListeners = (actions: string[]) => {
  actions.unshift("None")
  const totalActions = actions.length;
  let code = '';
  for (let i = 0; i < totalActions; i++) {
    code += `    control.onEvent(MlRunnerIds.MlRunnerInference, ${i + 1}, () => {\n`;
    code += `      maybeUpdateActionStats(${varFromActionLabel(actions[i])});\n`;
    code += `    });${i === totalActions ? '' : '\n'}`;
  }
  return code;
};

const arrayBufferToHexString = (input: Uint8Array): string =>
  Array.from(input, i => i.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

export const generateCustomTs = (gs: Gesture[], m: LayersModel) => {
  const customHeaderBlob = generateBlob({
    samples_period: 25,
    samples_length: 80,
    sample_dimensions: 3,
    actions: gs.map(g => ({
      label: g.getName(),
      threshold: g.getConfidence().getRequiredConfidence(),
    })),
  });
  const headerHexString = arrayBufferToHexString(new Uint8Array(customHeaderBlob));
  const { machineCode } = compileModel(m, {});
  const modelHexString = arrayBufferToHexString(machineCode);
  const actionLabels = gs.map(g => g.getName());

  return `// Auto-generated. Do not edit.
namespace mlrunner {
  export namespace Action {
${createMlEvents(actionLabels)}
    actions = [None,${actionLabels
      .map((actionLabel) => varFromActionLabel(actionLabel))
      .toString()}];

${createEventListeners(actionLabels)}
  }
}


getModelBlob = (): Buffer => {
  const result = hex\`${headerHexString + modelHexString}\`;
  return result;
};

mlrunner.simulatorSendData();

// Auto-generated. Do not edit. Really.
`;
};

export const generateCustomJson = (gs: Gesture[]) => {
  return JSON.stringify(
    gs.map(g => ({
      ID: g.getId(),
      name: g.getName(),
      numRecordings: g.getRecordings().length,
      requiredConfidence: g.getConfidence().getRequiredConfidence(),
    })),
  );
};
