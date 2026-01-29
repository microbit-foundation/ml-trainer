import {
  Button,
  Card,
  CardBody,
  HStack,
  Icon,
  Image,
  LinkBox,
  LinkOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { RiCheckboxBlankCircleLine, RiRadioButtonLine } from "react-icons/ri";
import { useNavigate } from "react-router";
import actionRecording from "../images/action-recording.svg";
import { ProjectDataWithActions } from "../storage";
import { loadProjectAndModelFromStorage } from "../store";
import { createDataSamplesPageUrl } from "../urls";
import { timeAgo } from "../utils/datetime";

interface ProjectCardProps {
  projectData: ProjectDataWithActions;
  onClick?: (e: React.MouseEvent) => void;
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

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      if (onClick) {
        return onClick(e);
      }
      await handleLoadProject(e);
    },
    [handleLoadProject, onClick]
  );

  return (
    <LinkBox h="100%" w="100%">
      <Card h="100%" w="100%">
        <CardBody display="flex">
          <Stack h="100%" w="100%">
            <HStack justifyContent="space-between" gap={5}>
              <LinkOverlay
                aria-selected={isSelected}
                as={Button}
                textAlign="left"
                fontSize="xl"
                onClick={(e) => handleClick(e)}
                variant="unstyled"
                _focusVisible={{ boxShadow: "outline", outline: "none" }}
              >
                {name}
              </LinkOverlay>
              {onClick && (
                <Icon
                  color="brand.600"
                  h={5}
                  w={5}
                  as={
                    isSelected ? RiRadioButtonLine : RiCheckboxBlankCircleLine
                  }
                />
              )}
            </HStack>
            <Text noOfLines={2} mb="auto">
              Actions:{" "}
              {actions.length > 0
                ? actions.map((a) => a.name).join(", ")
                : "none"}
            </Text>
            <Image src={actionRecording} width="100%" />
            <Text align="right">{timeAgo(timestamp)}</Text>
          </Stack>
        </CardBody>
      </Card>
    </LinkBox>
  );
};

export default ProjectCard;
