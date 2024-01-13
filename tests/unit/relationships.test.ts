import "../firebase";
import {describe, it, expect} from "vitest";
import {Collection} from "@razaman2/firestore-proxy";

describe("relationships", () => {
    it("should ", async () => {
        const collection = Collection.proxy("tests", {
            parent: Collection.proxy("tests", {
                // relationship: false
            }).setDoc(1),
            owners: [
                Collection.proxy("owner1", {
                    parent: Collection.proxy("owner1-parent"),
                    owners: [Collection.proxy("owner1-owner")],
                }),
                Collection.proxy("owner2", {
                    parent: Collection.proxy("owner2-parent"),
                    owners: [Collection.proxy("owner2-owner")],
                }),
            ],
            // relationship: false,
        });

        await collection.create();
    });
});
