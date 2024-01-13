import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {initializeFirestoreProxy} from "../firebase-init-firestore";
import {initializeTestApp, getCollectionProxy, app} from "@razaman2/firestore-testing";

describe("test document creation", () => {
    beforeEach(async () => {
        await initializeTestApp();
        initializeFirestoreProxy();
    });

    afterEach(async () => {
        await app.config.clearFirestore();
    });

    it("should delete document without providing id", async () => {
        const collection1 = getCollectionProxy({
            params: {
                payload: {
                    data: {
                        id: "123",
                        name: "jane doe",
                    },
                },
            },
        });

        await collection1.create();
        await collection1.init();

        expect(collection1.getData("id")).toBe("123");
        expect(collection1.getData("name")).toBe("jane doe");

        await collection1.remove();

        const collection2 = await getCollectionProxy().init("123");
        expect(collection2.getData()).toEqual({});
    });
});
