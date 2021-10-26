import { Point } from "./Point";
import { FullProofOfExponent } from "./FullProofOfExponent";
import { UsageProofOfExponent } from "./UsageProofOfExponent";
import { ProofOfExponentInterface } from "./ProofOfExponentInterface";
export declare const Pedestren_G: Point;
export declare const Pedestren_H: Point;
export declare class AttestationCrypto {
    rand: bigint;
    static OID_SIGNATURE_ALG: string;
    private curveOrderBitLength;
    static BYTES_IN_DIGEST: number;
    constructor();
    private verifyCurveOrder;
    getType(type: string): number;
    makeCommitment(identifier: string, type: number, secret: bigint): Uint8Array;
    makeCommitmentFromHiding(identifier: string, type: number, hiding: Point): Uint8Array;
    injectIdentifierType(type: number, arr: Uint8Array): Uint8Array;
    mapToInteger(arr: Uint8Array): bigint;
    mapToCurveMultiplier(type: number, identifier: string): bigint;
    computePoint_bn256(x: bigint): Point;
    makeSecret(bytes?: number): bigint;
    static generateRandomHexString(len: number): string;
    computeAttestationProof(randomness: bigint, nonce?: Uint8Array): FullProofOfExponent;
    computeEqualityProof(commitment1: string, commitment2: string, randomness1: bigint, randomness2: bigint, nonce?: Uint8Array): UsageProofOfExponent;
    private constructSchnorrPOK;
    computeChallenge(t: Point, challengeList: Point[], nonce: Uint8Array): bigint;
    verifyFullProof(pok: FullProofOfExponent): boolean;
    verifyEqualityProof(commitment1: Uint8Array, commitment2: Uint8Array, pok: ProofOfExponentInterface): boolean;
    private verifyPok;
    makeArray(pointArray: Point[]): Uint8Array;
    static hashWithKeccak(data: Uint8Array): Uint8Array;
}