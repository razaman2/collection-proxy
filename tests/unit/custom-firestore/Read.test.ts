import "../../firebase-init-firestore";
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {serverTimestamp, getFirestore, writeBatch} from "firebase/firestore";
import {initializeTestApp, app} from "@razaman2/collection-testing";
import {Collection} from "../../../src";

describe("Read Data", () => {
    beforeEach(async () => {
        await initializeTestApp();

        const batch = writeBatch(getFirestore());

        await Collection.proxy("tests").create({
            batch,
            data: {
                id: 1,
                name: "test data",
            },
        });

        await Collection.proxy("tests").create({
            batch,
            data: {
                id: 2,
                name: "test data2",
            },
        });

        await batch.commit();
    });

    afterEach(async () => {
        // await app.config.clearFirestore();
    });

    it("should not recursively process ignored paths", async () => {
        const collection1 = Collection.proxy("tests").setIgnoredPath(/testedAt\./);
        const collection2 = Collection.proxy("tests").setIgnoredPath("testedAt.");
        const collection3 = Collection.proxy("tests").setIgnoredPath([/tested1At\./, "tested2At."]);
        const batch = writeBatch(getFirestore());

        await Promise.all([
            collection1.create({
                batch,
                data: {
                    testedAt: serverTimestamp(),
                },
            }),
            collection2.create({
                batch,
                data: {
                    testedAt: serverTimestamp(),
                },
            }),
            collection3.create({
                batch,
                data: {
                    tested1At: serverTimestamp(),
                    tested2At: serverTimestamp(),
                },
            }),
        ]);

        await batch.commit();

        await Promise.all([
            collection1.init(),
            collection2.init(),
            collection3.init(),
        ]);

        expect(collection1.getData("testedAt").toDate()).toBeInstanceOf(Date);
        expect(collection2.getData("testedAt").toDate()).toBeInstanceOf(Date);
        expect(collection3.getData("tested1At").toDate()).toBeInstanceOf(Date);
        expect(collection3.getData("tested2At").toDate()).toBeInstanceOf(Date);
    });

    it("should get data with init and id", async () => {
        const collection = await Collection.proxy("tests").init(1);

        expect(collection.getData("name")).toBe("test data");
    });

    it("should get data with init after setDoc and id", async () => {
        const collection = await Collection.proxy("tests").setDoc(1).init();

        expect(collection.getData("name")).toBe("test data");
    });

    it("should get data with init after setting id on payload data", async () => {
        const collection = await Collection.proxy("tests", {
            payload: {
                data: {id: 1},
            },
        }).init();

        expect(collection.getData("name")).toBe("test data");
    });

    it("should get data with init after setting document path", async () => {
        const collection = await Collection.proxy().setPath("tests/1").init();

        expect(collection.getData("name")).toBe("test data");
    });

    it("should get data with getDocument and id", async () => {
        const collection = await Collection.proxy("tests").getDocument(1, {realtime: false});

        expect(collection.getData("name")).toBe("test data");
    });

    it("should get data with getDocument and id onSnapshot", () => {
        return new Promise((resolve) => {
            const collection = Collection.proxy("tests");

            collection.getDocument(1);

            setInterval(() => {
                if (collection.getData("id")) {
                    expect(collection.getData("name")).toBe("test data");

                    resolve(true);
                }
            }, 100);
        });
    });

    it("should get data with getDocument after setDoc and id", async () => {
        const collection = await Collection.proxy("tests").setDoc(1).getDocument({realtime: false});

        expect(collection.getData("name")).toBe("test data");
    });

    it("should get data with getDocument after setDoc and id onSnapshot", () => {
        return new Promise((resolve) => {
            const collection = Collection.proxy("tests").setDoc(1);

            collection.getDocument();

            setInterval(() => {
                if (collection.getData("id")) {
                    expect(collection.getData("name")).toBe("test data");

                    resolve(true);
                }
            }, 100);
        });
    });

    it("should get data with getDocument after setting id on payload data", async () => {
        const collection = await Collection.proxy("tests", {
            payload: {
                data: {id: 1},
            },
        }).getDocument({realtime: false});

        expect(collection.getData("name")).toBe("test data");
    });

    it("should get data with getDocument after setting id on payload data onSnapshot", () => {
        return new Promise((resolve) => {
            const collection = Collection.proxy("tests", {
                payload: {
                    data: {id: 1},
                },
            });

            collection.getDocument();

            setInterval(() => {
                if (collection.getData("id")) {
                    expect(collection.getData("name")).toBe("test data");

                    resolve(true);
                }
            }, 100);
        });
    });

    it("should get data with getDocument after setting document path", async () => {
        const collection = await Collection.proxy().setPath("tests/1").getDocument({realtime: false});

        expect(collection.getData("name")).toBe("test data");
    });

    it("should get data with getDocument after setting document path onSnapshot", () => {
        return new Promise((resolve) => {
            const collection = Collection.proxy().setPath("tests/1");

            collection.getDocument();

            setInterval(() => {
                if (collection.getData("id")) {
                    expect(collection.getData("name")).toBe("test data");

                    resolve(true);
                }
            }, 100);
        });
    });

    it("should get all documents with getDocuments from collection", async () => {
        const collection = await Collection.proxy("tests", {
            payload: {data: []},
        }).getDocuments({realtime: false});

        expect(collection.getData()).toHaveLength(2);
    });

    it("should get all documents with getDocuments from collection onSnapshot", () => {
        return new Promise((resolve) => {
            const collection = Collection.proxy("tests", {
                payload: {data: []},
            });

            collection.getDocuments();

            setInterval(() => {
                if (collection.getData().length) {
                    expect(collection.getData()).toHaveLength(2);

                    resolve(true);
                }
            }, 100);
        });
    });

    it("should get all documents with getDocuments after setting collection path", async () => {
        const collection = await Collection.proxy({
            payload: {data: []},
        }).setPath("tests").getDocuments({realtime: false});

        expect(collection.getData()).toHaveLength(2);
    });

    it("should get all documents with getDocuments after setting collection path onSnapshot", () => {
        return new Promise(async (resolve) => {
            const collection = Collection.proxy({
                payload: {data: []},
            }).setPath("tests");

            collection.getDocuments();

            setInterval(() => {
                if (collection.getData().length) {
                    expect(collection.getData()).toHaveLength(2);

                    resolve(true);
                }
            }, 100);
        });
    });
});
