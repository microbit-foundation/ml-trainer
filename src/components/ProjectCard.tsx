import {
  Button,
  Card,
  CardBody,
  HStack,
  LinkBox,
  LinkOverlay,
  Radio,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { ProjectDataWithActions } from "../storage";
import { loadProjectAndModelFromStorage } from "../store";
import { createDataSamplesPageUrl } from "../urls";
import { timeAgo } from "../utils/datetime";

interface ProjectCardProps {
  projectData: ProjectDataWithActions;
  onClick?: () => void;
  isSelected?: boolean;
}

const ProjectCard = ({
  projectData,
  onClick,
  isSelected = false,
}: ProjectCardProps) => {
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
          <Stack h="100%" w="100%">
            <Stack mb={16}>
              <HStack justifyContent="space-between">
                <LinkOverlay
                  as={Button}
                  textAlign="left"
                  fontSize="xl"
                  onClick={onClick ?? handleLoadProject}
                  variant="unstyled"
                  _focusVisible={{ boxShadow: "outline", outline: "none" }}
                >
                  {name}
                </LinkOverlay>
                {onClick && <Radio isChecked={isSelected} />}
              </HStack>
              <Text>
                Actions:{" "}
                {actions.length > 0
                  ? actions.map((a) => a.name).join(", ")
                  : "none"}
              </Text>
            </Stack>
            <Text align="right" mt="auto">
              {timeAgo(timestamp)}
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </LinkBox>
  );
};

export default ProjectCard;
