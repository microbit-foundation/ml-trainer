import {
  Grid,
  GridItem,
  GridProps,
  HStack,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { MakeCodeRenderBlocksProvider } from "@microbit/makecode-embed/react";
import React, { useRef } from "react";
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
  const actions = useStore((s) => s.gestures);
  const setRequiredConfidence = useStore((s) => s.setRequiredConfidence);
  const { project, projectEdited } = useProject();
  const { isConnected } = useConnectionStage();
  const [{ languageId }] = useSettings();
  const makeCodeLang = getMakeCodeLang(languageId);
  const scrollableAreaRef = useRef<HTMLDivElement>(null);
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
        ref={scrollableAreaRef}
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
            {actions.map((action, idx) => {
              const { requiredConfidence: threshold } = action;
              const isTriggered = detected ? detected.ID === action.ID : false;
              return (
                <React.Fragment key={idx}>
                  <GridItem>
                    <ActionNameCard
                      value={action}
                      readOnly={true}
                      isTriggered={isTriggered}
                      disabled={!isConnected}
                    />
                  </GridItem>
                  <GridItem>
                    <ActionCertaintyCard
                      actionName={action.name}
                      onThresholdChange={(val) =>
                        setRequiredConfidence(action.ID, val)
                      }
                      currentConfidence={confidences?.[action.ID]}
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
                      <CodeViewDefaultBlockCard action={action} />
                    )}
                  </GridItem>
                </React.Fragment>
              );
            })}
          </Grid>
          {projectEdited && (
            <CodeViewCard parentRef={scrollableAreaRef} project={project} />
          )}
        </HStack>
      </VStack>
    </MakeCodeRenderBlocksProvider>
  );
};

export default TestingModelTable;
