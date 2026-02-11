import { ReactNode, Suspense } from "react";
import LoadingPage from "./LoadingPage";
import { Await, useLoaderData } from "react-router";

const ProjectLoadWrapper = ({ children }: { children: ReactNode }) => {
  const { projectLoaded } = useLoaderData() as { projectLoaded: boolean };

  return (
    <Suspense fallback={<LoadingPage />}>
      <Await resolve={projectLoaded}>{children}</Await>
    </Suspense>
  );
};

export default ProjectLoadWrapper;
