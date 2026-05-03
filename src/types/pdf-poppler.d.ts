// Minimal ambient module declaration for pdf-poppler. The package ships no
// types and we only use the convert() entry point in bloodwork-extractor.
declare module 'pdf-poppler' {
  export interface PopplerConvertOptions {
    format?: 'png' | 'jpeg' | 'tiff' | 'pdf' | 'ps' | 'eps' | 'svg';
    out_dir?: string;
    out_prefix?: string;
    page?: number | null;
    scale?: number;
  }
  export function convert(pdfPath: string, options: PopplerConvertOptions): Promise<unknown>;
}
