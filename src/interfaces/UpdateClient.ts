import type {DataClient} from "@razaman2/data-manager";
import CustomFirestore from "../CustomFirestore";

export default interface UpdateClient extends DataClient {
    after?: <T extends CustomFirestore>(client: T) => Record<string, any>;
    before?: <T extends CustomFirestore>(client: T) => Record<string, any>;
    strict?: boolean;
}
