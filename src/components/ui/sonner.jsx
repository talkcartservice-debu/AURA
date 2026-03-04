import { Toaster as SonnerToaster } from "sonner";

const Toaster = ({ ...props }) => {
  return <SonnerToaster className="toaster group" toastOptions={{ classNames: { toast: "group toast" } }} {...props} />;
};

export { Toaster };