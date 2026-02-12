import ResourceCard from "./ResourceCard";
import projectImage1 from "theme-package/images/ai-storytelling-friend.png";
import projectImage2 from "theme-package/images/simple-ai-exercise-timer.png";
import projectImage3 from "theme-package/images/ai-activity-timer.png";
import projectImage4 from "theme-package/images/ai-light-switch.png";
import projectImage5 from "theme-package/images/ai-sports-data-logger.png";
import { projectUrl } from "../utils/external-links";
import { IntlShape } from "react-intl";

interface ProjectIdeaConfig {
  titleId: string;
  url: string;
  imgSrc: string;
}

const projectIdeas: ProjectIdeaConfig[] = [
  {
    titleId: "ai-storytelling-friend-resource-title",
    url: "ai-storytelling-friend",
    imgSrc: projectImage1,
  },
  {
    titleId: "simple-ai-exercise-timer-resource-title",
    url: "simple-ai-exercise-timer",
    imgSrc: projectImage2,
  },
  {
    titleId: "ai-activity-timer-resource-title",
    url: "ai-activity-timer",
    imgSrc: projectImage3,
  },
  {
    titleId: "ai-light-switch-resource-title",
    url: "ai-light-switch",
    imgSrc: projectImage4,
  },
  {
    titleId: "ai-sports-data-logger-resource-title",
    url: "ai-sports-data-logger",
    imgSrc: projectImage5,
  },
];

export const createProjectIdeaCards = (intl: IntlShape, languageId: string) =>
  projectIdeas.map((project) => (
    <ResourceCard
      key={project.titleId}
      title={intl.formatMessage({
        id: project.titleId,
      })}
      url={projectUrl(project.url, languageId)}
      imgSrc={project.imgSrc}
    />
  ));
