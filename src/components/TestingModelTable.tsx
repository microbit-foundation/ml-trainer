/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  Flex,
  Grid,
  GridItem,
  GridProps,
  Icon,
  VStack,
} from "@chakra-ui/react";
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
import { useResizeObserverContentRect } from "../hooks/use-resize-observer";

const blockCardMinWidth = "400px";
const gap = 3;

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: `290px 360px 40px minmax(${blockCardMinWidth}, 1fr)`,
  gap,
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
  const gridAreaRef = useRef<HTMLDivElement>(null);
  const intl = useIntl();

  const scrollableAreaRef = useRef<HTMLDivElement>(null);
  const contentRect = useResizeObserverContentRect(scrollableAreaRef);
  const scrollbarWidth = scrollableAreaRef.current
    ? scrollableAreaRef.current.offsetWidth -
      (contentRect?.width ?? scrollableAreaRef.current.offsetWidth)
    : 0;

  return (
    <MakeCodeRenderBlocksProvider key={makeCodeLang} lang={makeCodeLang}>
      <Flex
        flexGrow={1}
        flexDir="column"
        overflow="auto"
        ref={scrollableAreaRef}
      >
        <Flex flexGrow={1} flexDir="column" w="max-content">
          <HeadingGrid {...gridCommonProps} px={5} headings={headings} />
          <VStack
            w={`calc(100vw - ${scrollbarWidth}px)`}
            h={0}
            justifyContent="start"
            flexGrow={1}
            alignItems="start"
            flexShrink={1}
            ref={gridAreaRef}
          >
            <Grid
              {...gridCommonProps}
              py={2}
              px={5}
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
                      <Icon
                        as={RiArrowRightLine}
                        boxSize={10}
                        color="gray.600"
                      />
                    </VStack>
                    {!projectEdited && (
                      <GridItem position="relative" w="100%">
                        <CodeViewDefaultBlockCard
                          action={action}
                          position="absolute"
                        />
                      </GridItem>
                    )}

                    {projectEdited && actionIdx === 0 && (
                      <GridItem
                        // Extra row to extend beyond the grid.
                        rowSpan={actions.length + 1}
                        minW={0}
                        h="100%"
                        maxW="100%"
                        position="relative"
                      >
                        <CodeViewCard
                          parentRef={gridAreaRef}
                          project={project}
                          // To remove extra gap for extra row.
                          mb={gap}
                        />
                      </GridItem>
                    )}
                  </Box>
                );
              })}
            </Grid>
          </VStack>
        </Flex>
      </Flex>
    </MakeCodeRenderBlocksProvider>
  );
};

export default TestingModelTable;
