import { toast } from "sonner";

export type NotifyOptions = {
  duration?: number;
  description?: string;
  id?: string | number;
};

const DEFAULT_DURATION = 5000;

function options(value?: NotifyOptions) {
  return {
    duration: value?.duration ?? DEFAULT_DURATION,
    description: value?.description,
    id: value?.id,
  };
}

export const notify = {
  success(message: string, value?: NotifyOptions) {
    return toast.success(message, options(value));
  },
  error(message: string, value?: NotifyOptions) {
    return toast.error(message, options(value));
  },
  warning(message: string, value?: NotifyOptions) {
    return toast.warning(message, options(value));
  },
  info(message: string, value?: NotifyOptions) {
    return toast.info(message, options(value));
  },
  message(message: string, value?: NotifyOptions) {
    return toast(message, options(value));
  },
  dismiss(id?: string | number) {
    toast.dismiss(id);
  },
};
