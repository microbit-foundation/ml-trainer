/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { compileModel } from 'ml4f';
import { generateBlob } from 'ml-header-generator';
import { LayersModel } from '@tensorflow/tfjs';

const createMlEvents = (actions: string[]) => {
  let code = '';
  actions.forEach((action, idx) => {
    code += `    //% fixedInstance\n`;
    code += `    export const ${action} = new MlEvent(${idx + 2}, "${action}");\n`;
  });
  return code;
};

const arrayBufferToHexString = (input: Uint8Array): string =>
  Array.from(input, i => i.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

export const getModelHexString = (actionNames: string[], m: LayersModel) => {
  const customHeaderBlob = generateBlob({
    samples_period: 25,
    samples_length: 80,
    sample_dimensions: 3,
    labels: actionNames,
  });
  const headerHexString = arrayBufferToHexString(new Uint8Array(customHeaderBlob));
  const { machineCode } = compileModel(m, {});
  const modelHexString = arrayBufferToHexString(machineCode);
  return headerHexString + modelHexString;
};

export const generateCustomTs = (actions: string[], modelHexString: string) => {
  return `// Auto-generated. Do not edit.
  namespace mlrunner {
    export namespace Action {
  ${createMlEvents(actions)}
      actions = [None,${actions.toString()}];
    }
  }
  
  getModelBlob = (): Buffer =>  {
    const result = hex\`${modelHexString}\`;
    return result;
  }
  
  mlrunner.simulatorSendData();
  
  // Auto-generated. Do not edit. Really.
  `;
};
