import type {DataClient} from "@razaman2/data-manager";
import Factory from "@razaman2/js-factory";
import Collection from "../Collection";

export default interface CollectionParams {
    payload?: DataClient,
    parent?: Collection | boolean,
    creator?: Collection | boolean,
    factory?: new(...args: any) => Factory,
    owners?: Array<Collection>,
    relationships?: (relationships: Array<string>) => Array<string>
}
