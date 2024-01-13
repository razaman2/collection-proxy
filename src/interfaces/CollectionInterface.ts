import {CollectionReference, DocumentReference, Firestore} from "firebase/firestore";
import {UpdateHandler, WriteTypes} from "../Types";

export default interface CollectionInterface {
    doc?: (<T extends CollectionReference & Record<string, any>>(collection: T) => DocumentReference) | DocumentReference;
    data?: (<T extends Record<string, any>>(data: T) => T) | Record<string, any>;
    batch?: (<T extends Firestore>(firestore: T) => any) | any;
    update?: UpdateHandler;
    transform?: (data: {[key: string]: any}, type: WriteTypes) => {[key: string]: any},
    errors?: Array<Error>;
    merge?: boolean;
}

