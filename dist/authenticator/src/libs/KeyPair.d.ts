import { PrivateKeyInfo, PublicKeyInfoValue, SubjectPublicKeyInfo } from "../asn1/shemas/AttestationFramework";
export declare class KeyPair {
    private constructor();
    private privKey;
    private pubKey;
    algorithm: string;
    private ethereumPrefix;
    private algorithmASNList;
    getPrivateAsUint8(): Uint8Array;
    getPrivateAsHexString(): string;
    getPrivateAsBigInt(): bigint;
    static privateFromBigInt(priv: bigint): KeyPair;
    static fromPublicHex(publicHex: string): KeyPair;
    static fromPrivateUint8(privateUint: Uint8Array, keyAlg?: string): KeyPair;
    static publicFromBase64(base64: string): KeyPair;
    static publicFromSubjectPublicKeyInfo(spki: SubjectPublicKeyInfo): KeyPair;
    static publicFromSubjectPublicKeyValue(spki: PublicKeyInfoValue): KeyPair;
    static publicFromUint(key: Uint8Array): KeyPair;
    static privateFromKeyInfo(spki: PrivateKeyInfo): KeyPair;
    getAlgorithNameFromASN1(alg: string): string;
    static privateFromPEM(pem: string): KeyPair;
    static publicFromPEM(pem: string): KeyPair;
    static generateKeyAsync(): Promise<KeyPair>;
    static createKeys(): KeyPair;
    getPublicKeyAsHexStr(): string;
    getAsnDerPublic(): string;
    getAddress(): string;
    signBytes(bytes: number[]): string;
    signStringWithEthereum(message: string): string;
    signHexStringWithEthereum(message: string): string;
    signBytesWithEthereum(bytes: number[]): string;
    signDeterministicSHA256(bytes: number[]): string;
    verifyDeterministicSHA256(bytes: number[], signature: string): boolean;
    verifyHexStringWithEthereum(message: string, signature: string): boolean;
    signRawBytesWithEthereum(bytes: number[]): string;
    verifyBytesWithEthereum(bytes: number[], signature: string): boolean;
    getJWTParams(): {
        crv: string;
        d: string;
        key_ops: string[];
        kty: string;
        x: string;
        y: string;
    };
    getSubtlePrivateKey(): any;
    getSubtlePublicKey(): any;
    signStringWithSubtle(msg: string): Promise<ArrayBuffer>;
    verifyStringWithSubtle(signature: Uint8Array, msg: string): Promise<boolean>;
    verifyStringWithSubtleDerSignature(signature: Uint8Array, msg: string): Promise<boolean>;
    static anySignatureToRawUint8(derSignature: Uint8Array | string): Uint8Array;
}