import { createHomePageUrl } from "../urls";
import ErrorPage from "./ErrorPage";
import { FormattedMessage, useIntl } from "react-intl";
import Link from "./Link";

interface NotFoundProps {
  href?: string;
}

const NotFound = ({ href }: NotFoundProps) => {
  const intl = useIntl();
  return (
    <ErrorPage title={intl.formatMessage({ id: "not-found-title" })}>
      <Link color="brand.600" href={href ? href : createHomePageUrl()}>
        <FormattedMessage id="not-found" />
      </Link>
    </ErrorPage>
  );
};

export default NotFound;
