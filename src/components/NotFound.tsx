/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { createHomePageUrl } from "../urls";
import ErrorPage from "./ErrorPage";
import { FormattedMessage, useIntl } from "react-intl";
import Link from "./Link";
import { useDeployment } from "../deployment";

interface NotFoundProps {
  href?: string;
}

const NotFound = ({ href }: NotFoundProps) => {
  const intl = useIntl();
  const { appNameFull } = useDeployment();
  return (
    <ErrorPage title={intl.formatMessage({ id: "not-found-title" })}>
      <Link
        color="brand.600"
        textDecoration="underline"
        href={href ? href : createHomePageUrl()}
      >
        <FormattedMessage id="not-found" values={{ appNameFull }} />
      </Link>
    </ErrorPage>
  );
};

export default NotFound;
