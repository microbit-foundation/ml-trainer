import {
  Button,
  Grid,
  GridProps,
  HStack,
  Icon,
  VStack,
  VisuallyHidden,
  useDisclosure,
} from "@chakra-ui/react";
import {
  MakeCodeProject,
  MakeCodeRenderBlocksProvider,
} from "@microbit-foundation/react-code-view";
import { EditorProject } from "@microbit-foundation/react-editor-embed";
import React, { useCallback } from "react";
import { RiArrowRightLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useConnectionStage } from "../connection-stage-hooks";
import { useGestureActions, useGestureData } from "../gestures-hooks";
import { mlSettings } from "../ml";
import { PredictionResult } from "../ml-hooks";
import { getMakeCodeLang, useSettings } from "../settings";
import { useMakeCodeProject } from "../user-projects-hooks";
import CertaintyThresholdGridItem from "./CertaintyThresholdGridItem";
import CodeViewCard from "./CodeViewCard";
import CodeViewGridItem from "./CodeViewGridItem";
import EditCodeDialog from "./EditCodeDialog";
import GestureNameGridItem from "./GestureNameGridItem";
import HeadingGrid from "./HeadingGrid";

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
  const editCodeDialogDisclosure = useDisclosure();
  const [gestures] = useGestureData();
  const { setRequiredConfidence } = useGestureActions();
  const { actions } = useConnectionStage();

  const { hasStoredProject, userProject, setUserProject } =
    useMakeCodeProject();

  const detectedLabel =
    detected?.name ??
    intl.formatMessage({
      id: "content.model.output.estimatedGesture.none",
    });

  const [{ languageId }] = useSettings();
  const makeCodeLang = getMakeCodeLang(languageId);

  const handleCodeChange = useCallback(
    (code: EditorProject) => {
      setUserProject(code as MakeCodeProject);
    },
    [setUserProject]
  );

  const handleResetProject = useCallback(() => {
    // Clear stored project
    setUserProject(undefined);
  }, [setUserProject]);

  const handleSave = useCallback((save: { name: string; hex: string }) => {
    const blob = new Blob([save.hex], { type: "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${save.name}.hex`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  const handleDownload = useCallback(
    async (download: { name: string; hex: string }) => {
      await actions.startDownloadUserProjectHex(download.hex);
    },
    [actions]
  );
  return (
    <>
      <EditCodeDialog
        code={userProject}
        editorVersion={undefined}
        isOpen={editCodeDialogDisclosure.isOpen}
        onChange={handleCodeChange}
        onBack={editCodeDialogDisclosure.onClose}
        onDownload={handleDownload}
        onSave={handleSave}
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
            values={{ action: detectedLabel }}
          />
        </VisuallyHidden>
        <HeadingGrid {...gridCommonProps} px={10} headings={headings}>
          <HStack>
            <Button variant="secondary" size="sm" onClick={handleResetProject}>
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
              {...(hasStoredProject ? { w: "fit-content", pr: 0 } : {})}
              autoRows="max-content"
              h="fit-content"
              alignSelf="start"
            >
              {gestures.data.map((gesture, idx) => {
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
                      hasStoredProject={hasStoredProject}
                    />
                  </React.Fragment>
                );
              })}
            </Grid>
            {hasStoredProject && <CodeViewCard project={userProject} />}
          </HStack>
        </VStack>
      </MakeCodeRenderBlocksProvider>
    </>
  );
};

export default TestModelGridView;
