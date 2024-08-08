import {
  Button,
  Grid,
  GridProps,
  HStack,
  Icon,
  VStack,
  VisuallyHidden,
} from "@chakra-ui/react";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Gesture,
  GestureContextState,
  useGestureActions,
  useGestureData,
} from "../gestures-hooks";
import { Confidences, mlSettings } from "../ml";
import { usePrediction } from "../ml-hooks";
import CertaintyThresholdGridItem from "./CertaintyThresholdGridItem";
import GestureNameGridItem from "./GestureNameGridItem";
import HeadingGrid from "./HeadingGrid";
import { RiArrowRightLine } from "react-icons/ri";
import CodeViewGridItem from "./CodeViewGridItem";
import { MakeCodeRenderBlocksProvider } from "@microbit-foundation/react-code-view";
import { getMakeCodeLang, useSettings } from "../settings";

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: "200px 360px 40px 1fr",
  gap: 3,
  px: 10,
  py: 2,
  w: "100%",
};

const headings = [
  {
    titleId: "content.model.output.action.descriptionTitle",
    descriptionId: "content.model.output.action.descriptionBody",
  },
  {
    titleId: "content.model.output.certainty.descriptionTitle",
    descriptionId: "content.model.output.certainty.descriptionBody",
  },
  {},
  {
    titleId: "content.model.output.output.descriptionTitle",
    descriptionId: "content.model.output.output.descriptionBody",
  },
];

const placeholderProject = {
  header: {
    target: "microbit",
    targetVersion: "3.0.17",
    name: "Untitled",
    meta: {},
    editor: "blocksprj",
    pubId: "",
    pubCurrent: false,
    _rev: null,
    id: "8dd48233-0ebb-4426-7b6d-9af3a1a887f0",
    recentUse: 1601371026,
    modificationTime: 1601371026,
    blobId: null,
    blobVersion: null,
    blobCurrent: false,
    isDeleted: false,
    githubCurrent: false,
    saveId: null,
  },
  text: {
    "main.blocks":
      '<xml xmlns="https://developers.google.com/blockly/xml"><block type="pxt-on-start" x="0" y="0"><statement name="HANDLER"><block type="playMelody"><value name="melody"><shadow type="melody_editor"><field name="melody">"C5 B A G F E D C "</field></shadow></value><value name="tempo"><shadow type="math_number_minmax"><mutation min="40" max="500" label="Tempo" precision="0"/><field name="SLIDER">120</field></shadow></value></block></statement></block></xml>',
    "main.ts": 'music.playMelody("C5 B A G F E D C ", 120)\n',
    "README.md": " ",
    "pxt.json":
      '{\n    "name": "Untitled",\n    "description": "",\n    "dependencies": {\n        "core": "*",\n        "radio": "*"\n    },\n    "files": [\n        "main.blocks",\n        "main.ts",\n        "README.md"\n    ],\n    "preferredEditor": "blocksprj"\n}\n',
    ".simstate.json": "{}",
  },
};

const TestModelGridView = () => {
  const intl = useIntl();
  const [gestures] = useGestureData();
  const { setRequiredConfidence } = useGestureActions();

  const confidences = usePrediction();
  const prediction = applyThresholds(gestures, confidences);
  const predicationLabel =
    prediction?.name ??
    intl.formatMessage({
      id: "content.model.output.estimatedGesture.none",
    });

  const [{ languageId }] = useSettings();
  const makeCodeLang = getMakeCodeLang(languageId);
  return (
    <MakeCodeRenderBlocksProvider
      key={makeCodeLang}
      options={{
        version: undefined,
        lang: makeCodeLang,
      }}
    >
      <VisuallyHidden aria-live="polite">
        <FormattedMessage
          id="content.model.output.estimatedGesture.label"
          values={{ action: predicationLabel }}
        />
      </VisuallyHidden>
      <HeadingGrid {...gridCommonProps} headings={headings}>
        <HStack>
          <Button variant="secondary" size="sm">
            <FormattedMessage id="reset-to-default-action" />
          </Button>
          <Button variant="secondary" size="sm">
            <FormattedMessage id="edit-in-makecode-action" />
          </Button>
        </HStack>
      </HeadingGrid>
      <Grid
        {...gridCommonProps}
        alignItems="start"
        autoRows="max-content"
        overflow="auto"
        flexGrow={1}
        h={0}
      >
        {gestures.data.map(
          ({ ID, name, requiredConfidence: threshold }, idx) => {
            return (
              <React.Fragment key={idx}>
                <GestureNameGridItem id={ID} name={name} readOnly={true} />
                <CertaintyThresholdGridItem
                  onThresholdChange={(val) => setRequiredConfidence(ID, val)}
                  currentConfidence={confidences?.[ID]}
                  requiredConfidence={
                    threshold ?? mlSettings.defaultRequiredConfidence
                  }
                  isTriggered={prediction?.ID === ID}
                />
                <VStack justifyContent="center" h="full">
                  <Icon as={RiArrowRightLine} boxSize={10} color="gray.600" />
                </VStack>
                <CodeViewGridItem project={placeholderProject} />
              </React.Fragment>
            );
          }
        )}
      </Grid>
    </MakeCodeRenderBlocksProvider>
  );
};

const applyThresholds = (
  gestureData: GestureContextState,
  confidences: Confidences | undefined
): Gesture | undefined => {
  if (!confidences) {
    return undefined;
  }

  // If more than one meet the threshold pick the highest
  const thresholded = gestureData.data
    .map((gesture) => ({
      gesture,
      thresholdDelta:
        confidences[gesture.ID] -
        (gesture.requiredConfidence ?? mlSettings.defaultRequiredConfidence),
    }))
    .sort((left, right) => {
      const a = left.thresholdDelta;
      const b = right.thresholdDelta;
      return a < b ? -1 : a > b ? 1 : 0;
    });

  const prediction = thresholded[thresholded.length - 1];
  return prediction.thresholdDelta >= 0 ? prediction.gesture : undefined;
};

export default TestModelGridView;
