import ResourceCard from "./ResourceCard";
import lessonImage1 from "theme-package/images/createai-taster-lessons.svg";
import lessonImage2 from "theme-package/images/first-lessons-with-microbit-createai.svg";
import { lessonUrl } from "../utils/external-links";
import { IntlShape } from "react-intl";

interface LessonConfig {
  titleId: string;
  url: string;
  imgSrc: string;
}

const lessons: LessonConfig[] = [
  {
    titleId: "createai-taster-lessons-resource-title",
    url: "createai-taster-lessons",
    imgSrc: lessonImage1,
  },
  {
    titleId: "first-lessons-with-microbit-createai-resource-title",
    url: "first-lessons-with-microbit-createai",
    imgSrc: lessonImage2,
  },
];

export const createLessonCards = (intl: IntlShape) =>
  lessons.map((lesson) => (
    <ResourceCard
      key={lesson.titleId}
      title={intl.formatMessage({
        id: lesson.titleId,
      })}
      url={lessonUrl(lesson.url)}
      imgSrc={lesson.imgSrc}
      aspectRatio={1}
      imagePadding={5}
    />
  ));
