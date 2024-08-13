import { Button, Image } from "@chakra-ui/react";
import test from "./../images/test.svg";
import {
  BlockLayout,
  MakeCodeProject,
  useMakeCodeRenderBlocks,
} from "@microbit-foundation/react-code-view";
import { useCallback } from "react";

// Non-user-facing component to log SVG of MakeCode block for development purposes

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
  return (
    <>
      <Image src={test} />
      <Button onClick={handleOnClick}>Get svg</Button>
    </>
  );
};

export default GetMakeCodeCodeViewSvgButton;
