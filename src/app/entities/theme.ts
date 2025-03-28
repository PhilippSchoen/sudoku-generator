export type Theme = {
  id: number;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    black: string;
    gray: string;
    error: string;
  };
  pattern?: string;
}
