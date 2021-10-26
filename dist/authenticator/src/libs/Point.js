import { mod, invert, bnToBuf, uint8merge, BnPowMod, uint8ToBn, hexStringToUint8 } from "./utils";
export let CURVE_SECP256k1 = {
    P: 2n ** 256n - 2n ** 32n - 977n,
    n: 2n ** 256n - 432420386565659656852420866394968145599n,
    magicExp: (2n ** 256n - 2n ** 32n - 977n + 1n) / 4n,
    A: 0n,
    B: 7n
};
export let CURVES = {
    p256: {
        P: BigInt('0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF'),
        A: BigInt('0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC'),
        B: BigInt('0x5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B'),
        n: BigInt('0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551'),
        GX: BigInt('0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296'),
        GY: BigInt('0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5'),
        h: 1n
    },
    secp256k1: {
        P: 2n ** 256n - 2n ** 32n - 977n,
        A: 0n,
        B: 7n,
        n: 2n ** 256n - 432420386565659656852420866394968145599n,
        GX: 55066263022277343669578718895168534326250603453777594175500187360389116729240n,
        GY: 32670510020758816978083085130507043184471273380659243275938904335757337482424n,
    },
    BN256: {
        P: 115792089237314936872688561244471742058375878355761205198700409522629664518163n,
        n: 115792089237314936872688561244471742058035595988840268584488757999429535617037n,
        magicExp: 115792089237314936872688561244471742058375878355761205198700409522629664518164n >> 2n,
        A: 0n,
        B: 3n,
        h: 1n
    }
};
export let CURVE_BN256 = {
    P: 21888242871839275222246405745257275088696311157297823662689037894645226208583n,
    n: 21888242871839275222246405745257275088548364400416034343698204186575808495617n,
    A: 0n,
    B: 3n,
    h: 1n
};
export class Point {
    constructor(x, y, useCurve = CURVES.secp256r1) {
        this.x = x;
        this.y = y;
        this.useCurve = useCurve;
    }
    double() {
        const X1 = this.x;
        const Y1 = this.y;
        const lam = mod(3n * X1 ** 2n * invert(2n * Y1, this.useCurve.P), this.useCurve.P);
        const X3 = mod(lam * lam - 2n * X1, this.useCurve.P);
        const Y3 = mod(lam * (X1 - X3) - Y1, this.useCurve.P);
        return new Point(X3, Y3, this.useCurve);
    }
    newZero() {
        return new Point(0n, 0n, this.useCurve);
    }
    add(other) {
        const [a, b] = [this, other];
        const [X1, Y1, X2, Y2] = [a.x, a.y, b.x, b.y];
        if (X1 === 0n || Y1 === 0n)
            return b;
        if (X2 === 0n || Y2 === 0n)
            return a;
        if (X1 === X2 && Y1 === Y2)
            return this.double();
        if (X1 === X2 && Y1 === -Y2)
            return this.newZero();
        const lam = mod((Y2 - Y1) * invert(X2 - X1, this.useCurve.P), this.useCurve.P);
        const X3 = mod(lam * lam - X1 - X2, this.useCurve.P);
        const Y3 = mod(lam * (X1 - X3) - Y1, this.useCurve.P);
        return new Point(X3, Y3, this.useCurve);
    }
    multiplyDA(n) {
        let p = this.newZero();
        let d = this;
        while (n > 0n) {
            if (n & 1n)
                p = p.add(d);
            d = d.double();
            n >>= 1n;
        }
        return p;
    }
    isInfinity() {
        return this.x == null || this.y == null;
    }
    getEncoded(compressed = false) {
        if (this.isInfinity()) {
            return new Uint8Array(0);
        }
        let X = bnToBuf(this.x, 32);
        if (compressed) {
            return uint8merge([Uint8Array.from([2]), X]);
        }
        return uint8merge([Uint8Array.from([4]), X, bnToBuf(this.y, 32)]);
    }
    equals(other) {
        if (null == other) {
            return false;
        }
        let i1 = this.isInfinity();
        let i2 = other.isInfinity();
        if (i1 || i2) {
            return (i1 && i2);
        }
        let p1 = this;
        let p2 = other;
        return (p1.x === p2.x) && (p1.y === p2.y);
    }
    static decodeFromHex(hex, useCurve = CURVE_SECP256k1) {
        if (hex.length != 130) {
            throw new Error('only decompressed points allowed. 65 bytes.');
        }
        return Point.decodeFromUint8(hexStringToUint8(hex), useCurve);
    }
    static decodeFromUint8(uint, useCurve = CURVE_SECP256k1) {
        if (uint.length != 65) {
            throw new Error('only decompressed points allowed. 65 bytes.');
        }
        let p;
        let type = uint[0];
        switch (type) {
            case 4:
                let X = uint8ToBn(uint.slice(1, 33));
                let Y = uint8ToBn(uint.slice(33));
                p = new Point(X, Y, useCurve);
                break;
            default:
                throw new Error('only decompressed points allowed');
        }
        if (!p.validate()) {
            let m = `Point is not valid (` + p.x.toString(16) + ',' + p.y.toString(16) + `)`;
            console.log(m);
            throw new Error(m);
        }
        return p;
    }
    validate() {
        let res = mod(mod(this.y * this.y, this.useCurve.P) - mod(BnPowMod(this.x, 3n, this.useCurve.P)
            + mod(this.x * this.useCurve.A, this.useCurve.P) + this.useCurve.B, this.useCurve.P), this.useCurve.P);
        return res == 0n;
    }
    negate() {
        return new Point(this.x, this.useCurve.P - this.y, this.useCurve);
    }
    subtract(anotherPoint) {
        return this.add(anotherPoint.negate());
    }
}