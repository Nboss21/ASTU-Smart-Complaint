declare module "mammoth" {
  export interface ExtractResult {
    value: string;
    messages: { type: string; message: string }[];
  }

  export function extractRawText(options: {
    buffer: Buffer;
  }): Promise<ExtractResult>;
}
