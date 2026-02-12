import ResourceCard from "./ResourceCard";
import helpImage1 from "theme-package/images/user-guide.jpg";
import helpImage2 from "theme-package/images/troubleshooting.png";
import { supportSiteFolderUrl, userGuideUrl } from "../utils/external-links";
import { IntlShape } from "react-intl";

interface HelpConfig {
  titleId: string;
  url: string;
  imgSrc: string;
  imagePadding?: number;
  aspectRatio?: number;
}

const helpConfig: HelpConfig[] = [
  {
    titleId: "user-guide",
    url: userGuideUrl(),
    imgSrc: helpImage1,
  },
  {
    titleId: "troubleshooting-resource-title",
    url: supportSiteFolderUrl(),
    imgSrc: helpImage2,
  },
];

export const createHelpCards = (intl: IntlShape) =>
  helpConfig.map((help) => (
    <ResourceCard
      key={help.titleId}
      title={intl.formatMessage({
        id: help.titleId,
      })}
      url={help.url}
      imgSrc={help.imgSrc}
      imagePadding={help.imagePadding}
      aspectRatio={help.aspectRatio}
    />
  ));
