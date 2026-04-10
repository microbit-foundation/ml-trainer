/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, Grid, GridItem, GridProps, Icon, VStack } from "@chakra-ui/react";
import { MakeCodeRenderBlocksProvider } from "@microbit/makecode-embed/react";
import { useRef } from "react";
import { RiArrowRightLine } from "react-icons/ri";
import { useIntl } from "react-intl";
import { useDataConnected } from "../data-connection-flow";
import { useProject } from "../hooks/project-hooks";
import { mlSettings } from "../mlConfig";
import { getMakeCodeLang } from "../settings";
import { useSettings, useStore } from "../store";
import ActionCertaintyCard from "./ActionCertaintyCard";
import ActionNameCard, { ActionCardNameViewMode } from "./ActionNameCard";
import CodeViewCard from "./CodeViewCard";
import CodeViewDefaultBlockCard from "./CodeViewDefaultBlockCard";
import HeadingGrid from "./HeadingGrid";

const blockCardMinWidth = "400px";

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: "290px 360px 40px minmax(400px, 1fr)",
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
  const isConnected = useDataConnected();
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
        flexShrink={1}
        ref={scrollableAreaRef}
      >
        <Grid
          {...gridCommonProps}
          py={2}
          autoRows="max-content"
          h="fit-content"
          alignSelf="start"
        >
          {actions.map((action, actionIdx) => {
            const { requiredConfidence: threshold } = action;
            return (
              <Box
                key={action.id}
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
                {!projectEdited && (
                  <GridItem position="relative">
                    <CodeViewDefaultBlockCard
                      action={action}
                      minW={blockCardMinWidth}
                      position="absolute"
                    />
                  </GridItem>
                )}

                {projectEdited && actionIdx === 0 && (
                  <GridItem
                    rowSpan={actions.length}
                    minW={0}
                    h="100%"
                    maxW="100%"
                    position="relative"
                  >
                    <CodeViewCard
                      parentRef={scrollableAreaRef}
                      project={project}
                    />
                  </GridItem>
                )}
              </Box>
            );
          })}
        </Grid>
      </VStack>
    </MakeCodeRenderBlocksProvider>
  );
};

export default TestingModelTable;
