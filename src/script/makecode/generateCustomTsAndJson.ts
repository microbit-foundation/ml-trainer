/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { compileModel } from 'ml4f';
import { generateBlob } from '@microbit-foundation/ml-header-generator';
import { LayersModel } from '@tensorflow/tfjs';
import Gesture from '../domain/Gesture';
import { ActionName, actionNamesFromLabels } from './utils';

const createMlEvents = (actionNames: ActionName[]) => {
  let code = '';
  actionNames.forEach((an, idx) => {
    const stringValue = JSON.stringify(an.actionLabel);
    code += `  //% fixedInstance block=${stringValue}\n`;
    code += `  export const ${an.actionVar} = new MlEvent(${idx + 2}, ${stringValue});\n`;
  });
  return code;
};

const createEventListeners = (actionNames: ActionName[]) => {
  actionNames.unshift({
    actionLabel: 'unknown',
    actionVar: 'Unknown',
  });
  const totalActions = actionNames.length;
  let code = '';
  for (let i = 0; i < totalActions; i++) {
    code += `  control.onEvent(MlRunnerIds.MlRunnerInference, ${i + 1}, () => {\n`;
    code += `    maybeUpdateEventStats(event.${actionNames[i].actionVar});\n`;
    code += `  });\n`;
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
  const actionNames = actionNamesFromLabels(gs.map(g => g.getName()));

  return `// Auto-generated. Do not edit.
namespace ml {
  export namespace event {
    ${createMlEvents(actionNames)}
    }
    
  events = [event.Unknown,${actionNames.map(an => `event.${an.actionVar}`)}];
    
${createEventListeners(actionNames)}
  getModelBlob = (): Buffer => {
    const result = hex\`${headerHexString + modelHexString}\`;
    return result;
  };

  simulatorSendData();
}

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
