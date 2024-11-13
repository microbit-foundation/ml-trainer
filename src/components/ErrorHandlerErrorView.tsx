import { Button, Text, VStack } from "@chakra-ui/react";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import ErrorPage from "./ErrorPage";
import Link from "./Link";

const ErrorHandlerErrorView = () => {
  return (
    <ErrorPage title="An unexpected error occurred">
      <VStack spacing={3}>
        <Text>
          <FormattedMessage
            id="support-request"
            values={{
              link: (chunks: ReactNode) => (
                <Link
                  color="brand.600"
                  textDecoration="underline"
                  href="https://support.microbit.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </Link>
              ),
            }}
          />
        </Text>
        <Text>
          <Button variant="primary" onClick={() => window.location.reload()}>
            <FormattedMessage id="reload-action" />
          </Button>
        </Text>
      </VStack>
    </ErrorPage>
  );
};

export default ErrorHandlerErrorView;
