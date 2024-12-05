/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Icon, MenuItem } from "@chakra-ui/react";
import { IoMdGlobe } from "react-icons/io";
import { FormattedMessage } from "react-intl";

interface LanguageMenuItemProps {
  onOpen: () => void;
}

const LanguageMenuItem = ({ onOpen }: LanguageMenuItemProps) => {
  return (
    <MenuItem icon={<Icon h={5} w={5} as={IoMdGlobe} />} onClick={onOpen}>
      <FormattedMessage id="language" />
    </MenuItem>
  );
};

export default LanguageMenuItem;
