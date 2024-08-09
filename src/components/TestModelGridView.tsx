import {
  Box,
  Button,
  Card,
  Grid,
  GridProps,
  HStack,
  Icon,
  SkeletonText,
  VStack,
  VisuallyHidden,
  useDisclosure,
} from "@chakra-ui/react";
import {
  BlockLayout,
  MakeCodeBlocksRendering,
  MakeCodeProject,
  MakeCodeRenderBlocksProvider,
} from "@microbit-foundation/react-code-view";
import React, { useCallback } from "react";
import { RiArrowRightLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Gesture,
  GestureContextState,
  useGestureActions,
  useGestureData,
} from "../gestures-hooks";
import { useMakeCodeProject } from "../user-projects-hooks";
import { Confidences, mlSettings } from "../ml";
import { usePrediction } from "../ml-hooks";
import { getMakeCodeLang, useSettings } from "../settings";
import CertaintyThresholdGridItem from "./CertaintyThresholdGridItem";
import CodeViewGridItem from "./CodeViewGridItem";
import EditCodeDialog from "./EditCodeDialog";
import FullScreenBackButton from "./FullScreenBackButton";
import GestureNameGridItem from "./GestureNameGridItem";
import HeadingGrid from "./HeadingGrid";
import { EditorProject } from "@microbit-foundation/react-editor-embed";

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: "200px 360px 40px auto",
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

const TestModelGridView = () => {
  const intl = useIntl();
  const editCodeDialogDisclosure = useDisclosure();
  const [gestures] = useGestureData();
  const { setRequiredConfidence } = useGestureActions();

  const { hasStoredProject, project, setProject, createGestureDefaultProject } =
    useMakeCodeProject(gestures.data);

  const confidences = usePrediction();
  const prediction = applyThresholds(gestures, confidences);
  const predicationLabel =
    prediction?.name ??
    intl.formatMessage({
      id: "content.model.output.estimatedGesture.none",
    });

  const [{ languageId }] = useSettings();
  const makeCodeLang = getMakeCodeLang(languageId);

  const handleCodeChange = useCallback(
    (code: EditorProject) => {
      setProject(code as MakeCodeProject);
    },
    [setProject]
  );
  return (
    <>
      <EditCodeDialog
        code={project}
        editorVersion={undefined}
        isOpen={editCodeDialogDisclosure.isOpen}
        onChange={handleCodeChange}
        toolbarItemsLeft={
          <FullScreenBackButton onClick={editCodeDialogDisclosure.onClose}>
            <FormattedMessage id="back-action" />
          </FullScreenBackButton>
        }
      />
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
            {/* TODO: Reset to default action */}
            <Button variant="secondary" size="sm">
              <FormattedMessage id="reset-to-default-action" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={editCodeDialogDisclosure.onOpen}
            >
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
          {gestures.data.map((gesture, idx) => {
            const { ID, name, requiredConfidence: threshold } = gesture;
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
                <CodeViewGridItem
                  // TODO: To memoize operation. Maybe create a TestModelGridRow component
                  project={createGestureDefaultProject(gesture)}
                />
              </React.Fragment>
            );
          })}
        </Grid>
      </MakeCodeRenderBlocksProvider>
    </>
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
