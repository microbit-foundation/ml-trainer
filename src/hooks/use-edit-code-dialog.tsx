/**
 * (c) 2021 - 2022, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useDisclosure, UseDisclosureProps } from "@chakra-ui/react";
import { createContext, ReactNode, useContext } from "react";

const EditCodeDialogContext = createContext<UseDisclosureProps | undefined>(
  undefined
);

export const useEditCodeDialog = (): UseDisclosureProps => {
  const editCodeDialog = useContext(EditCodeDialogContext);
  if (!editCodeDialog) {
    throw new Error("Missing provider");
  }
  return editCodeDialog;
};

const EditCodeDialogProvider = ({ children }: { children: ReactNode }) => {
  const editCodeDialog = useDisclosure();
  return (
    <EditCodeDialogContext.Provider value={editCodeDialog}>
      {children}
    </EditCodeDialogContext.Provider>
  );
};

export default EditCodeDialogProvider;
