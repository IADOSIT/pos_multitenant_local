interface Minutia {
    x: number;
    y: number;
    a: number;
}
export interface FmdCandidate {
    empleado_id: number;
    fmd_template: string | null | undefined;
}
export declare function isFmd(b64: string): boolean;
export declare function decodeFMD(b64: string | null | undefined): Minutia[] | null;
export declare function matchFMDs(fmd1B64: string | null | undefined, fmd2B64: string | null | undefined): number;
export declare const THRESHOLD = 45;
export declare const MIN_GAP = 10;
export declare function findMatch(probeB64: string, candidates: FmdCandidate[], threshold?: number, minGap?: number): number | null;
export {};
