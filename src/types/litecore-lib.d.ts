declare module 'litecore-lib' {
    export class PrivateKey {
        constructor(key?: string);
        public static fromWIF(wif: string): PrivateKey;
        toPublicKey(): PublicKey;
    }

    export class PublicKey {
        toAddress(): Address;
    }

    export class Address {
        toString(): string;
    }

    export class Transaction {
        from(utxos: any[]): this;
        to(address: string, amount: number): this;
        fee(amount: number): this;
        change(address: string): this;
        sign(privateKey: PrivateKey): this;
        serialize(): string;
    }
}
