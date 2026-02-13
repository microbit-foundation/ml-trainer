import {
  Button,
  Card,
  CardBody,
  Icon,
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
import { useIntl } from "react-intl";
import { RiShakeHandsLine } from "react-icons/ri";

interface ProjectCardProps {
  projectData: ProjectDataWithActions;
  projectCardActions?: ReactNode;
}

const ProjectCard = ({ projectData, projectCardActions }: ProjectCardProps) => {
  const navigate = useNavigate();
  const intl = useIntl();
  const { id, name, actions, timestamp } = projectData;

  const handleLoadProject = useCallback(
    async (_e: React.MouseEvent) => {
      await loadProjectAndModelFromStorage(id);
      navigate(createDataSamplesPageUrl());
    },
    [id, navigate]
  );

  return (
    <LinkBox h="100%" w="100%" role="group">
      <Card h="100%" w="100%">
        <CardBody display="flex">
          <Stack h="100%" w="100%" spacing={0}>
            {projectCardActions}
            <Icon width={32} height="auto" color="brand.500" ml={-5} mt={-5}>
              <svg
                width="27"
                height="22"
                viewBox="0 0 27 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.9004 17.9004C11.2004 17.9004 10.9004 17.5004 9.30039 9.10039C9.30039 8.80039 9.20039 8.40039 9.10039 8.10039C8.70039 9.50039 8.30039 11.2004 7.90039 12.9004C7.90039 13.2004 7.50039 13.5004 7.20039 13.5004H5.10039C4.70039 13.5004 4.40039 13.2004 4.40039 12.8004C4.40039 12.4004 4.70039 12.1004 5.10039 12.1004H6.60039C8.30039 4.90039 8.60039 4.90039 9.20039 4.90039C9.50039 4.90039 9.90039 5.10039 10.0004 5.40039C10.1004 5.70039 10.3004 6.60039 10.7004 9.00039C11.0004 10.5004 11.4004 12.8004 11.8004 14.4004C12.5004 11.8004 12.7004 11.2004 13.4004 11.2004C13.6004 11.2004 13.9004 11.2004 14.2004 11.6004C14.5004 11.9004 15.0004 12.4004 15.5004 12.9004C15.8004 11.9004 16.1004 11.2004 16.7004 11.0004C18.0004 10.4004 18.8004 12.0004 19.2004 12.7004C19.8004 12.7004 21.2004 12.2004 22.3004 11.8004C22.7004 11.7004 23.1004 11.8004 23.2004 12.2004C23.3004 12.6004 23.2004 13.0004 22.8004 13.1004C18.7004 14.7004 18.3004 14.0004 18.1004 13.7004C18.1004 13.7004 18.0004 13.5004 17.9004 13.4004C17.8004 13.2004 17.5004 12.6004 17.3004 12.4004C17.1004 12.7004 16.9004 13.4004 16.8004 13.8004C16.6004 14.6004 16.4004 15.2004 15.8004 15.2004C15.7004 15.2004 15.2004 15.2004 15.0004 14.7004C15.0004 14.5004 14.3004 13.9004 13.8004 13.3004C13.6004 13.9004 13.3004 14.9004 13.2004 15.5004C13.0004 16.5004 12.8004 17.0004 12.7004 17.4004C12.6004 17.7004 12.3004 17.9004 11.9004 17.9004Z"
                  fill="currentColor"
                />
              </svg>
            </Icon>
            <LinkOverlay
              as={Button}
              mt="auto"
              h={8}
              textAlign="left"
              fontSize="xl"
              isTruncated
              onClick={handleLoadProject}
              variant="unstyled"
              _focusVisible={{ boxShadow: "outline", outline: "none" }}
            >
              {name}
            </LinkOverlay>
            <Text noOfLines={1} h="1lh">
              {actions.map((a) => a.name).join(", ")}
            </Text>
            <Text fontSize="sm" pt={2} color="blackAlpha.700">
              {timeAgo(intl, timestamp)}
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </LinkBox>
  );
};

export default ProjectCard;
