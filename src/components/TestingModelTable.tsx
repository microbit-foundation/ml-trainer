import {
  Grid,
  GridItem,
  GridProps,
  HStack,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { MakeCodeRenderBlocksProvider } from "@microbit/makecode-embed/react";
import React from "react";
import { RiArrowRightLine } from "react-icons/ri";
import { useConnectionStage } from "../connection-stage-hooks";
import { PredictionResult } from "../hooks/ml-hooks";
import { useProject } from "../hooks/project-hooks";
import { mlSettings } from "../mlConfig";
import { getMakeCodeLang } from "../settings";
import { useSettings, useStore } from "../store";
import ActionNameCard from "./ActionNameCard";
import ActionCertaintyCard from "./ActionCertaintyCard";
import CodeViewCard from "./CodeViewCard";
import CodeViewDefaultBlockCard from "./CodeViewDefaultBlockCard";
import HeadingGrid from "./HeadingGrid";

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: "290px 360px 40px auto",
  gap: 3,
  w: "100%",
};

const headings = [
  {
    titleId: "action-label",
    descriptionId: "action-tooltip",
  },
  {
    titleId: "certainty-label",
    descriptionId: "certainty-tooltip",
  },
  // Empty heading for arrow column
  {},
  {
    titleId: "code-label",
    descriptionId: "code-tooltip",
  },
];

const TestingModelTable = ({
  prediction,
}: {
  prediction: PredictionResult | undefined;
}) => {
  const { detected, confidences } = prediction ?? {};
  const gestures = useStore((s) => s.gestures);
  const setRequiredConfidence = useStore((s) => s.setRequiredConfidence);
  const { project, projectEdited } = useProject();
  const { isConnected } = useConnectionStage();
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
      <HeadingGrid {...gridCommonProps} px={5} headings={headings} />
      <VStack
        px={5}
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
            py={2}
            autoRows="max-content"
            h="fit-content"
            alignSelf="start"
          >
            {gestures.map((gesture, idx) => {
              const { requiredConfidence: threshold } = gesture;
              const isTriggered = detected ? detected.ID === gesture.ID : false;
              return (
                <React.Fragment key={idx}>
                  <GridItem>
                    <ActionNameCard
                      value={gesture}
                      readOnly={true}
                      isTriggered={isTriggered}
                      disabled={!isConnected}
                    />
                  </GridItem>
                  <GridItem>
                    <ActionCertaintyCard
                      actionName={gesture.name}
                      onThresholdChange={(val) =>
                        setRequiredConfidence(gesture.ID, val)
                      }
                      currentConfidence={confidences?.[gesture.ID]}
                      requiredConfidence={
                        threshold ?? mlSettings.defaultRequiredConfidence
                      }
                      isTriggered={isTriggered}
                      disabled={!isConnected}
                    />
                  </GridItem>
                  <VStack justifyContent="center" h="full">
                    <Icon as={RiArrowRightLine} boxSize={10} color="gray.600" />
                  </VStack>
                  <GridItem>
                    {!projectEdited && (
                      <CodeViewDefaultBlockCard gesture={gesture} />
                    )}
                  </GridItem>
                </React.Fragment>
              );
            })}
          </Grid>
          {projectEdited && <CodeViewCard project={project} />}
        </HStack>
      </VStack>
    </MakeCodeRenderBlocksProvider>
  );
};

export default TestingModelTable;
