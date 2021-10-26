import { stringToHex, hexStringToArray, base64ToUint8array, uint8tohex, formatGeneralizedDateTime } from "./utils";
const matchAll = require('string.prototype.matchall');
const Asn1DerTagByType = {
    END_OF_CONTENT: 0,
    BOOLEAN: 1,
    INTEGER: 2,
    BIT_STRING: 3,
    OCTET_STRING: 4,
    NULL_VALUE: 5,
    OBJECT_ID: 6,
    OBJECT_DESCRIPTOR: 7,
    EXTERNAL: 8,
    REAL: 9,
    ENUMERATED: 10,
    EMBEDDED_PDV: 11,
    UTF8STRING: 12,
    RELATIVE_OID: 13,
    SEQUENCE_10: 16,
    SET_OF: 17,
    NUMERABLE_STRING: 18,
    PRINTABLE_STRING: 19,
    T61STRING: 20,
    VIDEO_TEX_STRING: 21,
    IA5STRING: 22,
    UTC_TIME: 23,
    GENERALIZED_TIME: 24,
    GRAPHIC_STRING: 25,
    VISIBLE_STRING: 26,
    GENERAL_STRING: 27,
    UNIVERSAL_STRING: 28,
    CHARACTER_STRING: 29,
    BMP_STRING: 30,
    SEQUENCE_30: 48,
    SET: 49
};
const Asn1DerTagById = {
    0: "END_OF_CONTENT",
    1: "BOOLEAN",
    2: "INTEGER",
    3: "BIT_STRING",
    4: "OCTET_STRING",
    5: "NULL_VALUE",
    6: "OBJECT_ID",
    7: "OBJECT_DESCRIPTOR",
    8: "EXTERNAL",
    9: "REAL",
    10: "ENUMERATED",
    11: "EMBEDDED_PDV",
    12: "UTF8STRING",
    13: "RELATIVE_OID",
    16: "SEQUENCE_10",
    19: "PRINTABLE_STRING",
    22: "IA5STRING",
    24: "GENERALIZED_TIME",
    26: "VISIBLE_STRING",
    48: "SEQUENCE_30",
    49: "SET",
};
export class Asn1Der {
    static encodeAsInteger(value) {
        return this.encode('INTEGER', value);
    }
    static encodeObjectId(objectId) {
        return Asn1Der.encode('SEQUENCE_30', Asn1Der.encode('OBJECT_ID', objectId));
    }
    static encodeName(str) {
        let matches = str.matchAll(/(\w+)=("[\w\s]+"|\w+)/g);
        let set = '';
        let alg = '';
        let itemData = '';
        if (!matches) {
            throw new Error('wrong Name format');
        }
        for (const match of matches) {
            let type = match[1];
            let value = match[2];
            if (value.substr(0, 1) == "\"" && value.substr(-1) == "\"") {
                value = value.slice(1, value.length - 1);
            }
            ;
            switch (type.toUpperCase()) {
                case 'CN':
                    alg = "2.5.4.3";
                    break;
                case 'C':
                    alg = "2.5.4.6";
                    break;
                case 'O':
                    alg = "2.5.4.10";
                    break;
                case 'OU':
                    alg = "2.5.4.11";
                    break;
                case 'L':
                    alg = "2.5.4.7";
                    break;
                default:
                    throw new Error('Type "' + type + '" not implemented yet');
            }
            itemData = Asn1Der.encode('OBJECT_ID', alg) + Asn1Der.encode('UTF8STRING', value);
            set += Asn1Der.encode('SEQUENCE_30', itemData);
        }
        return Asn1Der.encode('SEQUENCE_30', Asn1Der.encode('SET', set));
    }
    static encode(type, value, id = 0) {
        if (typeof value === "undefined") {
            throw new Error('Missing value for Der encoding');
        }
        let encType = Asn1DerTagByType[type];
        let encValue = '';
        switch (type) {
            case 'OBJECT_ID':
                if (typeof value !== "string") {
                    throw new Error('OBJECT_ID value must be a string');
                }
                let valArr = value.split('.');
                let v1 = valArr.shift();
                let v2 = valArr.shift();
                valArr.unshift((parseInt(v1) * 40 + parseInt(v2)).toString());
                valArr.forEach(v => {
                    let num = parseInt(v);
                    let singleVal = '';
                    let firstByte = true;
                    do {
                        let tail127 = num & 127;
                        num = num >> 7;
                        tail127 += firstByte ? 0 : 128;
                        singleVal = tail127.toString(16).padStart(2, '0') + singleVal;
                        firstByte = false;
                    } while (num);
                    encValue += singleVal;
                });
                break;
            case "NULL_VALUE":
                encValue = '';
                break;
            case 'GENERALIZED_TIME':
                encValue = stringToHex(formatGeneralizedDateTime(value));
                break;
            case "VISIBLE_STRING":
            case "UTF8STRING":
                encValue = stringToHex(value);
                break;
            case 'INTEGER':
                encValue = BigInt(value).toString(16);
                encValue = (encValue.length % 2 ? '0' : '') + encValue;
                if (parseInt('0x' + encValue.slice(0, 1), 16) > 7) {
                    encValue = '00' + encValue;
                }
                break;
            case 'TAG':
                if (id > 15) {
                    throw new Error('DER TAG more than 15 is not implemented');
                }
                encType = parseInt('0xA' + id);
            case "SEQUENCE_30":
            case "SET":
            case "OCTET_STRING":
                if (typeof value == "string") {
                    encValue = value;
                }
                else if (value.constructor === Uint8Array) {
                    encValue = uint8tohex(value);
                }
                else {
                    throw new Error('Wrong data type for OCTET_STRING');
                }
                break;
            case "BIT_STRING":
                encValue = '00' + value;
                break;
            case "BOOLEAN":
                encValue = parseInt(value).toString().padStart(2, '0');
                break;
            default:
                throw new Error('Sorry, ' + type + ' not implemented.');
        }
        let encLength = '';
        let dataLength = Math.ceil(encValue.length / 2);
        let dataLengthHex = dataLength.toString(16);
        if (!dataLength)
            dataLengthHex = '00';
        dataLengthHex = (dataLengthHex.length % 2 ? '0' : '') + dataLengthHex;
        if (dataLength < 128) {
            encLength = dataLengthHex;
        }
        else {
            encLength = (128 + Math.round(dataLengthHex.length / 2)).toString(16) + dataLengthHex;
        }
        encValue = (encValue.length % 2 ? '0' : '') + encValue;
        return encType.toString(16).padStart(2, '0') + encLength + encValue;
    }
    decode(byteArray) {
        let arr = Array.from(byteArray);
        return this.read(arr);
    }
    lenEncoded(derArr) {
        let b1 = derArr.shift();
        if (b1 < 128) {
            return b1;
        }
        else if (b1 > 128) {
            let extLength = 0;
            for (let i = 0; i < (b1 - 128); i++) {
                extLength = (extLength << 8) + derArr.shift();
            }
            return extLength;
        }
        else if (b1 == 128) {
            throw new Error('have to code variable length');
        }
    }
    readFromHexString(str) {
        return this.read(hexStringToArray(str));
    }
    readFromUint8Array(u8) {
        return this.read(Array.from(u8));
    }
    readFromBase64String(base64str) {
        return this.readFromUint8Array(base64ToUint8array(base64str));
    }
    readFromUrlBase64String(urlBase64str) {
        let base64str = urlBase64str
            .split('_').join('/')
            .split('-').join('+')
            .split('.').join('=');
        return this.readFromBase64String(base64str);
    }
    read(derArr) {
        let typeTag = derArr.shift();
        let len = this.lenEncoded(derArr);
        let typeTagName = Asn1DerTagById[typeTag];
        let content = [];
        for (let i = 0; i < len; i++) {
            content.push(derArr.shift());
        }
        let outputStr = '';
        switch (typeTagName) {
            case "SEQUENCE_30":
                return this.BodySequence(content);
            case "INTEGER":
            case "BIT_STRING":
                let output = 0n;
                while (content.length) {
                    output = output << 8n;
                    output += BigInt(content.shift());
                }
                return output;
            case "OCTET_STRING":
                while (content.length) {
                    outputStr += content.shift().toString(16).padStart(2, '0');
                }
                return outputStr;
            case "GENERALIZED_TIME":
            case "VISIBLE_STRING":
                while (content.length) {
                    outputStr += String.fromCharCode(content.shift());
                }
                return outputStr;
        }
    }
    BodySequence(derArr) {
        let entries = [];
        while (derArr.length) {
            entries.push(this.read(derArr));
        }
        return entries;
    }
}