import { Heading, Stack, Text, VStack } from "@chakra-ui/react";
import DefaultPageLayout, { HomeMenuItem, HomeToolbarItem } from "../components/DefaultPageLayout";
import { FormattedMessage } from "react-intl";
import {  useParams } from "react-router";
import NotFound from "../components/NotFound";
import { useEffect, useState } from "react";
import { useProject } from "../hooks/project-hooks";

export const ImportSharedURLPage = () => {

    const { shortId } = useParams();
    const { importSharedURL } = useProject();
    const [isLoadError, setLoadError] = useState<boolean>(false);

    const idIsValid = !!shortId && /^_[a-zA-Z0-9]+$/.test(shortId);

    useEffect(() => {
        if (!idIsValid) return;
        importSharedURL(shortId)
        .catch(e => {
            console.error("Loading shared project failed", e);
            setLoadError(true);
        });
    }, [importSharedURL, idIsValid, shortId]);

    if (!idIsValid) {
        return <NotFound />;
    }

      return (
    <DefaultPageLayout
      titleId="import-shared-url-title"
      toolbarItemsRight={<HomeToolbarItem />}
      menuItems={<HomeMenuItem />}
    >
      <VStack as="main" justifyContent="center">
        <Stack
          bgColor="white"
          spacing={5}
          m={[0, 5, 20]}
          borderRadius={[0, "20px"]}
          borderWidth={[null, 1]}
          borderBottomWidth={1}
          borderColor={[null, "gray.300"]}
          py={[5, 8]}
          px={[3, 5, 8]}
          minW={[null, null, "xl"]}
          alignItems="stretch"
          width={["unset", "unset", "2xl", "2xl"]}
          maxW="2xl"
        >
          <Heading as="h1" mb={5}>
            <FormattedMessage id="import-shared-url-title" />
          </Heading>
          {isLoadError ?? <Text>Error loading project</Text>}
        </Stack>
      </VStack>
    </DefaultPageLayout>
  );
};
