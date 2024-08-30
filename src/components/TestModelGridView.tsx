import {
  Button,
  Grid,
  GridProps,
  HStack,
  Icon,
  VStack,
  VisuallyHidden,
} from "@chakra-ui/react";
import { MakeCodeRenderBlocksProvider } from "@microbit-foundation/react-code-view";
import React, { useCallback } from "react";
import { RiArrowRightLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { mlSettings } from "../ml";
import { getMakeCodeLang, useSettings } from "../settings";
import CertaintyThresholdGridItem from "./CertaintyThresholdGridItem";
import CodeViewCard from "./CodeViewCard";
import CodeViewGridItem from "./CodeViewGridItem";
import GestureNameGridItem from "./GestureNameGridItem";
import HeadingGrid from "./HeadingGrid";
import { useGestureActions, useGestures } from "../hooks/use-gestures";
import { PredictionResult } from "../hooks/use-ml-actions";
import { useProject } from "../hooks/use-project";
import { useEditCodeDialog } from "../hooks/use-edit-code-dialog";

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: "290px 360px 40px auto",
  gap: 3,
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
  // Empty heading for arrow column
  {},
  {
    titleId: "content.model.output.output.descriptionTitle",
    descriptionId: "content.model.output.output.descriptionBody",
  },
];

interface TestModelGridViewProps {
  prediction: PredictionResult | undefined;
}

const TestModelGridView = ({ prediction }: TestModelGridViewProps) => {
  const { detected, confidences } = prediction ?? {};
  const intl = useIntl();
  const [gestures] = useGestures();
  const { setRequiredConfidence } = useGestureActions();
  const { project, resetProject, projectEdited } = useProject();
  const { onOpen } = useEditCodeDialog();

  const detectedLabel =
    detected?.name ??
    intl.formatMessage({
      id: "content.model.output.estimatedGesture.none",
    });

  const [{ languageId }] = useSettings();
  const makeCodeLang = getMakeCodeLang(languageId);

  const handleResetProject = useCallback(() => {
    resetProject();
  }, [resetProject]);

  return (
    <>
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
            values={{ action: detectedLabel }}
          />
        </VisuallyHidden>
        <HeadingGrid {...gridCommonProps} px={10} headings={headings}>
          <HStack>
            <Button variant="secondary" size="sm" onClick={handleResetProject}>
              <FormattedMessage id="reset-to-default-action" />
            </Button>
            <Button variant="secondary" size="sm" onClick={onOpen}>
              <FormattedMessage id="edit-in-makecode-action" />
            </Button>
          </HStack>
        </HeadingGrid>
        <VStack
          px={10}
          w="full"
          h={0}
          justifyContent="start"
          flexGrow={1}
          alignItems="start"
          overflow="auto"
          flexShrink={1}
        >
          <HStack gap={0} h="min-content" w="full">
            <Grid
              {...gridCommonProps}
              {...(projectEdited ? { w: "fit-content", pr: 0 } : {})}
              autoRows="max-content"
              h="fit-content"
              alignSelf="start"
            >
              {gestures.map((gesture, idx) => {
                const {
                  ID,
                  name,
                  icon,
                  requiredConfidence: threshold,
                } = gesture;
                const isTriggered = detected ? detected.ID === ID : false;
                return (
                  <React.Fragment key={idx}>
                    <GestureNameGridItem
                      id={ID}
                      name={name}
                      icon={icon}
                      readOnly={true}
                      isTriggered={isTriggered}
                    />
                    <CertaintyThresholdGridItem
                      onThresholdChange={(val) =>
                        setRequiredConfidence(ID, val)
                      }
                      currentConfidence={confidences?.[ID]}
                      requiredConfidence={
                        threshold ?? mlSettings.defaultRequiredConfidence
                      }
                      isTriggered={isTriggered}
                    />
                    <VStack justifyContent="center" h="full">
                      <Icon
                        as={RiArrowRightLine}
                        boxSize={10}
                        color="gray.600"
                      />
                    </VStack>
                    <CodeViewGridItem
                      gesture={gesture}
                      projectEdited={projectEdited}
                    />
                  </React.Fragment>
                );
              })}
            </Grid>
            {projectEdited && <CodeViewCard project={project} />}
          </HStack>
        </VStack>
      </MakeCodeRenderBlocksProvider>
    </>
  );
};

export default TestModelGridView;
