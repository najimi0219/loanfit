export type InputField = {
    id: string;
    label: string;
    type: "number" | "text" | "select";
    options?: string[];
    required?: boolean;
  };