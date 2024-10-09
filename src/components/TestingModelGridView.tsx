import {
  Button,
  ButtonGroup,
  Grid,
  GridProps,
  HStack,
  Icon,
  Menu,
  MenuItem,
  MenuList,
  Portal,
  VStack,
} from "@chakra-ui/react";
import { MakeCodeRenderBlocksProvider } from "@microbit/makecode-embed/react";
import React from "react";
import { RiArrowRightLine, RiDeleteBin2Line } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { usePrediction } from "../hooks/ml-hooks";
import { useProject } from "../hooks/project-hooks";
import { mlSettings } from "../ml";
import { getMakeCodeLang } from "../settings";
import { useSettings, useStore } from "../store";
import { tourElClassname } from "../tours";
import CertaintyThresholdGridItem from "./CertaintyThresholdGridItem";
import CodeViewCard from "./CodeViewCard";
import CodeViewGridItem from "./CodeViewGridItem";
import GestureNameGridItem from "./GestureNameGridItem";
import HeadingGrid from "./HeadingGrid";
import LiveGraphPanel from "./LiveGraphPanel";
import MoreMenuButton from "./MoreMenuButton";

const gridCommonProps: Partial<GridProps> = {
  gridTemplateColumns: "290px 360px 40px auto",
  gap: 3,
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

const TestingModelGridView = () => {
  const prediction = usePrediction();
  const { detected, confidences } = prediction ?? {};
  const intl = useIntl();
  const gestures = useStore((s) => s.gestures);
  const setRequiredConfidence = useStore((s) => s.setRequiredConfidence);
  const { openEditor, project, resetProject, projectEdited } = useProject();

  const [{ languageId }] = useSettings();
  const makeCodeLang = getMakeCodeLang(languageId);

  return (
    <>
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
                      actionName={name}
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
      <VStack w="full" flexShrink={0} bottom={0} gap={0} bg="gray.25">
        <HStack
          justifyContent="right"
          px={5}
          py={2}
          w="full"
          borderBottomWidth={3}
          borderTopWidth={3}
          borderColor="gray.200"
          alignItems="center"
        >
          <Menu>
            <ButtonGroup isAttached>
              <Button
                variant="primary"
                onClick={openEditor}
                className={tourElClassname.editInMakeCodeButton}
              >
                <FormattedMessage id="edit-in-makecode-action" />
              </Button>
              <MoreMenuButton
                variant="primary"
                aria-label={intl.formatMessage({
                  id: "more-edit-in-makecode-options",
                })}
              />
              <Portal>
                <MenuList>
                  <MenuItem
                    icon={<RiDeleteBin2Line />}
                    onClick={resetProject}
                    isDisabled={!projectEdited}
                  >
                    <FormattedMessage id="reset-to-default-action" />
                  </MenuItem>
                </MenuList>
              </Portal>
            </ButtonGroup>
          </Menu>
        </HStack>
        <LiveGraphPanel detected={prediction?.detected} showPredictedGesture />
      </VStack>
    </>
  );
};

export default TestingModelGridView;
