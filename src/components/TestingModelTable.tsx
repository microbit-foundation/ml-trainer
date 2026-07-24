/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
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
import { Box, css, Flex, Grid, GridItem, Icon, VStack } from "@microbit/ui";
import { useResizeObserverContentRect } from "../hooks/use-resize-observer";

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
          <HeadingGrid
            className={css({
              gridTemplateColumns: "290px 360px 40px minmax(400px, 1fr)",
              gap: 3,
              w: "100%",
              px: 5,
            })}
            headings={headings}
          />
          <VStack
            // Scrollbar-compensated width; inline style (computed value).
            style={{ width: `calc(100vw - ${scrollbarWidth}px)` }}
            h={0}
            justifyContent="start"
            flexGrow={1}
            alignItems="start"
            flexShrink={1}
            ref={gridAreaRef}
          >
            <Grid
              gridTemplateColumns="290px 360px 40px minmax(400px, 1fr)"
              gap={3}
              w="100%"
              py={2}
              px={5}
              gridAutoRows="max-content"
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
                        css={{ width: 10, height: 10, color: "gray.600" }}
                      />
                    </VStack>
                    {!projectEdited && (
                      <GridItem position="relative" w="100%">
                        <CodeViewDefaultBlockCard
                          action={action}
                          className={css({ position: "absolute" })}
                        />
                      </GridItem>
                    )}

                    {projectEdited && actionIdx === 0 && (
                      <GridItem
                        minW={0}
                        h="100%"
                        maxW="100%"
                        position="relative"
                        // Extra row to extend beyond the grid. Dynamic value,
                        // so an inline style (Panda can't extract computed
                        // spans).
                        style={{ gridRow: `span ${actions.length + 1}` }}
                      >
                        <CodeViewCard
                          parentRef={gridAreaRef}
                          project={project}
                          // To remove extra gap for extra row.
                          className={css({ mb: 3 })}
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
