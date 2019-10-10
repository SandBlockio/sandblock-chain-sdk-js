/** ******************************************************************************
 *  (c) 2019 Sandblock
 *  (c) 2019 ZondaX GmbH
 *  (c) 2016-2017 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ******************************************************************************* */
export declare function getBech32FromPK(hrp: any, pk: any): any;
export declare function signGetChunks(path: any, message: any): any;
export default class SandblockApp {
    transport: any;
    constructor(transport: any, scrambleKey?: string);
    getVersion(): Promise<any>;
    appInfo(): Promise<any>;
    deviceInfo(): Promise<any>;
    publicKey(path: any): Promise<any>;
    getAddressAndPubKey(path: any, hrp: any): Promise<any>;
    signSendChunk(chunk_idx: any, chunk_num: any, chunk: any): Promise<any>;
    sign(path: number[] | undefined, message: any): Promise<{
        return_code: any;
        error_message: any;
    } | {
        return_code: any;
        error_message: any;
        signature: null;
    }>;
    isAppOpen(): Promise<boolean>;
    versionString({ major, minor, patch }: {
        major: Number;
        minor: Number;
        patch: Number;
    }): string;
}
