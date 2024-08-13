import { Button } from "@chakra-ui/react";
import {
  BlockLayout,
  MakeCodeProject,
  useMakeCodeRenderBlocks,
} from "@microbit-foundation/react-code-view";
import { useCallback } from "react";

// Non-user-facing component for development purposes
// to log SVG of MakeCode block

const GetMakeCodeCodeViewSvgButton = ({
  code: project,
}: {
  code: MakeCodeProject;
}) => {
  const { renderBlocks } = useMakeCodeRenderBlocks({});
  const handleOnClick = useCallback(async () => {
    const result = await renderBlocks({
      code: project,
      options: { layout: BlockLayout.Flow },
    });
    console.log(result.svg);
  }, [project, renderBlocks]);
  return <Button onClick={handleOnClick}>Get svg</Button>;
};

export default GetMakeCodeCodeViewSvgButton;
