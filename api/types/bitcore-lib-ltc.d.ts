// src/types/bitcore-lib-ltc.d.ts
declare module "bitcore-lib-ltc" {
  import * as bitcore from "bitcore-lib";

  export interface UTXO {
    txid: string;
    vout: number;
    scriptPubKey: string;
    amount: number;
  }

  export class PrivateKey extends bitcore.PrivateKey {
    constructor(wif: string);
    toAddress(): bitcore.Address;
  }

  export class Address extends bitcore.Address {}

  export class Transaction {
    constructor();
    from(utxos: UTXO[]): void;
    to(address: string, amount: number): void;
    change(address: Address): void;
    fee(amount: number): void;
    sign(privateKey: PrivateKey): void;
    serialize(): string;
  }
}
