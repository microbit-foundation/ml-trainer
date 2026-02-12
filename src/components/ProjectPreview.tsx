/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  Grid,
  Heading,
  HStack,
  HTMLChakraProps,
  Input,
  SkeletonText,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { MakeCodeProject } from "@microbit/makecode-embed/vanilla";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ButtonWithLoading } from "../components/ButtonWithLoading";
import { ActionData } from "../model";
import DataSamplesTableRow from "./DataSamplesTableRow";
import { useSettings } from "../store";
import { getMakeCodeLang } from "../settings";
import {
  BlockLayout,
  MakeCodeBlocksRendering,
  MakeCodeRenderBlocksProvider,
} from "@microbit/makecode-embed";
import { validateProjectName } from "../project-utils";

interface ProjectPreviewProps {
  dataset?: ActionData[];
  descriptionTextId?: string;
  isLoading: boolean;
  onOpenProject: () => void;
  project?: MakeCodeProject;
  projectName: string;
  setProjectName: (value: string) => void;
  sourceInfo?: ReactNode;
  titleId: string;
}

const ProjectPreview = ({
  dataset,
  descriptionTextId,
  isLoading,
  onOpenProject,
  project,
  projectName,
  setProjectName,
  sourceInfo = null,
  titleId,
}: ProjectPreviewProps) => {
  return (
    <VStack as="main" justifyContent="center" paddingBottom={20}>
      <Stack
        bgColor="white"
        spacing={5}
        my={[0, 0, 20]}
        borderRadius={[0, "20px"]}
        borderWidth={[null, null, 1]}
        borderBottomWidth={1}
        borderColor={[null, null, "gray.300"]}
        p={10}
        minW={[null, null, "xl"]}
        alignItems={"stretch"}
        width={["full", "full", "3xl", "4xl"]}
        mb="5"
      >
        <Heading as="h1" mb={5}>
          <FormattedMessage id={titleId} />
        </Heading>
        <ProjectLoadDetails
          descriptionTextId={descriptionTextId}
          name={projectName}
          setName={setProjectName}
        />
        {sourceInfo}
        <OpenProjectButton
          onClick={onOpenProject}
          isLoading={isLoading}
          projectName={projectName}
        />
        {!isLoading && (
          <>
            {dataset && <DataPreview dataset={dataset} />}
            {project && <MakeCodePreview project={project} />}
            <OpenProjectButton
              onClick={onOpenProject}
              isLoading={isLoading}
              projectName={projectName}
            />
          </>
        )}
      </Stack>
    </VStack>
  );
};

interface ProjectLoadDetailsProps {
  name: string;
  setName: (name: string) => void;
  descriptionTextId?: string;
}
const ProjectLoadDetails = ({
  descriptionTextId,
  name,
  setName,
}: ProjectLoadDetailsProps) => {
  const intl = useIntl();
  const nameLabel = intl.formatMessage({ id: "name-text" });
  return (
    <>
      {descriptionTextId && (
        <Text>
          <FormattedMessage id={descriptionTextId} />
        </Text>
      )}
      <Stack py={2} spacing={5}>
        <Heading size="md" as="h2">
          <FormattedMessage id="name-text" />
        </Heading>
        <Input
          aria-label={nameLabel}
          autoComplete="off"
          data-testid="name-text"
          minW="25ch"
          value={name}
          placeholder={nameLabel}
          size="lg"
          onChange={(e) => setName(e.currentTarget.value)}
        />
      </Stack>
    </>
  );
};

interface OpenProjectButtonProps {
  projectName: string;
  isLoading: boolean;
  onClick: () => void;
}

const OpenProjectButton = ({
  isLoading,
  onClick,
  projectName,
}: OpenProjectButtonProps) => {
  const isValidSetup = validateProjectName(projectName);
  return (
    <HStack pt={5} justifyContent="flex-end">
      <ButtonWithLoading
        isDisabled={isLoading || !isValidSetup}
        isLoading={isLoading}
        variant="primary"
        onClick={onClick}
        size="lg"
      >
        <FormattedMessage id="open-shared-project-action" />
      </ButtonWithLoading>
    </HStack>
  );
};

const previewFrameOuter: HTMLChakraProps<"div"> = {
  p: 2,
  bg: "whitesmoke",
  borderRadius: "sm",
};

const previewFrame: HTMLChakraProps<"div"> = {
  overflow: "auto",
  h: 96,
  minW: "100%",
};

interface DataPreviewProps {
  dataset: ActionData[];
}

const DataPreview = ({ dataset }: DataPreviewProps) => {
  return (
    <>
      <Heading size="md" as="h2">
        <FormattedMessage id="data-preview-title" />
      </Heading>
      <Text>
        <FormattedMessage id="open-shared-project-data-preview-description" />
      </Text>
      <Box {...previewFrameOuter}>
        <Box {...previewFrame}>
          <Grid gap={3} gridTemplateColumns="290px 1fr">
            {dataset.map((action) => (
              <DataSamplesTableRow
                preview={true}
                key={action.id}
                action={action}
                selected={false}
                hint={null}
              />
            ))}
          </Grid>
        </Box>
      </Box>
    </>
  );
};

interface MakeCodePreviewProps {
  project: MakeCodeProject;
}

const MakeCodePreview = ({ project }: MakeCodePreviewProps) => {
  const [{ languageId }] = useSettings();
  const makeCodeLang = getMakeCodeLang(languageId);
  return (
    <>
      <Heading size="md" as="h2" pt={[1, 3, 5]}>
        <FormattedMessage id="blocks-preview-title" />
      </Heading>
      <Text>
        <FormattedMessage id="open-shared-project-blocks-preview-description" />
      </Text>
      <MakeCodeRenderBlocksProvider key={makeCodeLang} lang={makeCodeLang}>
        <Box
          {...previewFrameOuter}
          sx={{
            "> div": previewFrame,
            img: { maxWidth: "unset", height: "unset" },
          }}
        >
          <MakeCodeBlocksRendering
            code={project}
            layout={BlockLayout.Clean}
            loaderCmp={
              <SkeletonText
                w="xs"
                noOfLines={5}
                spacing="5"
                skeletonHeight="2"
              />
            }
          />
        </Box>
      </MakeCodeRenderBlocksProvider>
    </>
  );
};

export default ProjectPreview;
