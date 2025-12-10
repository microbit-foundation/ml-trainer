/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  Grid,
  GridItem,
  GridProps,
  HStack,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { MakeCodeRenderBlocksProvider } from "@microbit/makecode-embed/react";
import { useRef } from "react";
import { RiArrowRightLine } from "react-icons/ri";
import { useIntl } from "react-intl";
import { useConnectionStage } from "../connection-stage-hooks";
import { useProject } from "../hooks/project-hooks";
import { mlSettings } from "../mlConfig";
import { getMakeCodeLang } from "../settings";
import { useSettings, useStore } from "../store";
import ActionCertaintyCard from "./ActionCertaintyCard";
import ActionNameCard, { ActionCardNameViewMode } from "./ActionNameCard";
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

const TestingModelTable = () => {
  const actions = useStore((s) => s.actions);
  const setRequiredConfidence = useStore((s) => s.setRequiredConfidence);
  const { project, projectEdited } = useProject();
  const { isConnected } = useConnectionStage();
  const [{ languageId }] = useSettings();
  const makeCodeLang = getMakeCodeLang(languageId);
  const scrollableAreaRef = useRef<HTMLDivElement>(null);
  const intl = useIntl();
  return (
    <MakeCodeRenderBlocksProvider key={makeCodeLang} lang={makeCodeLang}>
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
              return (
                <Box
                  key={idx}
                  role="region"
                  aria-label={intl.formatMessage(
                    {
                      id: "action-region",
                    },
                    { action: action.name }
                  )}
                  display="contents"
                >
                  <GridItem>
                    <ActionNameCard
                      value={action}
                      viewMode={ActionCardNameViewMode.ReadOnly}
                      disabled={!isConnected}
                    />
                  </GridItem>
                  <GridItem>
                    <ActionCertaintyCard
                      actionName={action.name}
                      actionId={action.id}
                      onThresholdChange={(val) =>
                        setRequiredConfidence(action.id, val)
                      }
                      requiredConfidence={
                        threshold ?? mlSettings.defaultRequiredConfidence
                      }
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
                </Box>
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
