import ResourceCard from "./ResourceCard";
import projectImage1 from "theme-package/images/ai-storytelling-friend.png";
import projectImage2 from "theme-package/images/simple-ai-exercise-timer.png";
import projectImage3 from "theme-package/images/ai-activity-timer.png";
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
];

export const createResourceCards = (intl: IntlShape, languageId: string) =>
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
