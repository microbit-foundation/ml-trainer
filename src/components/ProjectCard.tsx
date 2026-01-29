import {
  Button,
  Card,
  CardBody,
  Image,
  LinkBox,
  LinkOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ReactNode, useCallback } from "react";
import { useNavigate } from "react-router";
import actionRecording from "../images/action-recording.svg";
import { ProjectDataWithActions } from "../storage";
import { loadProjectAndModelFromStorage } from "../store";
import { createDataSamplesPageUrl } from "../urls";
import { timeAgo } from "../utils/datetime";

interface ProjectCardProps {
  projectData: ProjectDataWithActions;
  projectCardActions?: ReactNode;
}

const ProjectCard = ({ projectData, projectCardActions }: ProjectCardProps) => {
  const navigate = useNavigate();
  const { id, name, actions, timestamp } = projectData;

  const handleLoadProject = useCallback(
    async (_e: React.MouseEvent) => {
      await loadProjectAndModelFromStorage(id);
      navigate(createDataSamplesPageUrl());
    },
    [id, navigate]
  );

  return (
    <LinkBox h="100%" w="100%">
      <Card h="100%" w="100%">
        <CardBody display="flex">
          <Stack h="100%" w="100%" spacing={0}>
            {projectCardActions}
            <Image src={actionRecording} width="100%" />
            <LinkOverlay
              as={Button}
              h={8}
              mb="auto"
              textAlign="left"
              fontSize="xl"
              onClick={handleLoadProject}
              variant="unstyled"
              _focusVisible={{ boxShadow: "outline", outline: "none" }}
            >
              {name}
            </LinkOverlay>
            {actions.length > 0 && (
              <Text noOfLines={2} color="blackAlpha.700">
                {actions.map((a) => a.name).join(", ")}
              </Text>
            )}
            <Text color="blackAlpha.700">{timeAgo(timestamp)}</Text>
          </Stack>
        </CardBody>
      </Card>
    </LinkBox>
  );
};

export default ProjectCard;
