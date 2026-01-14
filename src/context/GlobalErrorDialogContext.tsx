/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ErrorDialogContextType {
  showError: (title: string, message: string) => void;
}

const ErrorDialogContext = createContext<ErrorDialogContextType | undefined>(
  undefined,
);

export const useErrorDialog = () => {
  const context = useContext(ErrorDialogContext);
  if (!context) {
    throw new Error(
      "useErrorDialog must be used within an ErrorDialogProvider",
    );
  }
  return context;
};

export const ErrorDialogProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const showError = (t: string, m: string) => {
    setTitle(t);
    setMessage(m);
    setOpen(true);
  };

  return (
    <ErrorDialogContext.Provider value={{ showError }}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription>{message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ErrorDialogContext.Provider>
  );
};
