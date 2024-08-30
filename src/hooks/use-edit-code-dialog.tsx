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
