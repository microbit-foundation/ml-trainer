import { compileModel } from 'ml4f';
import { model } from './stores/mlStore';
import { get } from 'svelte/store';

interface OnGestureRecognisedConfig {
  name: string;
  iconName: string;
}

const iconNames: string[] = [
  'Heart',
  'SmallHeart',
  'Yes',
  'No',
  'Happy',
  'Sad',
  'Confused',
  'Angry',
  'Asleep',
  'Surprised',
  'Silly',
  'Fabulous',
  'Meh',
  'TShirt',
  'Rollerskate',
  'Duck',
  'House',
  'Tortoise',
  'Butterfly',
  'StickFigure',
  'Ghost',
  'Sword',
  'Giraffe',
  'Skull',
  'Umbrella',
  'Snake',
  'Rabbit',
  'Cow',
  'QuarterNote',
  'EigthNote',
  'EighthNote',
  'Pitchfork',
  'Target',
  'Triangle',
  'LeftTriangle',
  'Chessboard',
  'Diamond',
  'SmallDiamond',
  'Square',
  'SmallSquare',
  'Scissors',
];

// TODO: Can possibly write a test for this
export const generateMakeCodeMain = (actionNames: string[]) => {
  const configs = actionNames.map((name, idx) => ({
    name,
    iconName: iconNames[idx % iconNames.length],
  }));

  return {
    'main.blocks': generateMakeCodeMainBlocksXml(configs),
    'main.ts': generateMakeCodeMainTs(configs),
    'Machine_Learning_POC.ts': generateWorkaroundTs(configs),
  };
};

export const generateMakeCodeMainTs = (configs: OnGestureRecognisedConfig[]) => {
  return `basic.showIcon(IconNames.${onStartIcon})
  ${configs
    .map(
      ({ name, iconName }: OnGestureRecognisedConfig) => `
mlrunner.onMlEvent(MlRunnerLabels.${name}, function () {
  basic.showIcon(IconNames.${iconName})
})`,
    )
    .join(`\n    `)}`;
};

const getShowIconBlock = (iconName: string) => {
  return `<block type=\"basic_show_icon\"><field name=\"i\">IconNames.${iconName}</field></block>`
}

const onStartIcon = "Square"

export const generateMakeCodeMainBlocksXml = (configs: OnGestureRecognisedConfig[]) => {
  const onStartPos = { x: 0, y: 0 };
  return `
    <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="pxt-on-start" x="${onStartPos.x}" y="${onStartPos.y}">
        <statement name="HANDLER">
          ${getShowIconBlock(onStartIcon)}       
        </statement>
      </block>

      ${configs.map((c, idx) =>
        onGestureRecognisedBlock({
          x: onStartPos.x + 300,
          y: onStartPos.y + idx * 200,
          ...c,
        }),
      ).join(`
      `)}
    </xml>`;
};

const onGestureRecognisedBlock = ({
  x,
  y,
  name,
  iconName,
}: OnGestureRecognisedBlock) => `
  <block type=\"mlrunner_on_ml_event\" x=\"${x}\" y=\"${y}\">
    <field name=\"value\">MlRunnerLabels.${name}</field>
    <statement name="HANDLER">
      ${getShowIconBlock(iconName)}       
    </statement>
  </block>
`;

interface OnGestureRecognisedBlock extends OnGestureRecognisedConfig {
  x: number;
  y: number;
}

const createActionEnum = (actions: string[]) => {
  let code = '';
  actions.forEach((action, idx) => {
    code += `
    //% block="${action}"
    ${action} = ${idx},
    `;
  });
  return code;
};

// TODO: Throwing errors
const getModelAsHexString = () => {
  const m = get(model);
  const result = compileModel(m, {});
  return Array.from(result.machineCode, i => i.toString(16).padStart(2, '0')).join('');
};

export const generateWorkaroundTs = (configs: OnGestureRecognisedConfig[]) => {
  const actions = configs.map(c => c.name);

  return `// Auto-generated. Do not edit.
  enum MlRunnerLabels {${createActionEnum(actions)}}
  
  actions = ${JSON.stringify(actions)}

  getModelBlob = (): Buffer =>  {
    const result = hex\`${getModelAsHexString()}\`;
    return result
  }
  
  mlrunner.simulatorSendData()

  // Auto-generated. Do not edit. Really.
  `;
};
