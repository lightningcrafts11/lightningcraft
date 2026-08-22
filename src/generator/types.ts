export interface GenerationError {
  nodeId: string;
  componentType: string;
  message: string;
}

export interface GenerateLwcHtmlResult {
  html: string;
  errors: GenerationError[];
}
