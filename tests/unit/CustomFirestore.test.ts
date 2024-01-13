import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {initializeTestApp, getCollectionProxy, app} from "@razaman2/firestore-proxy-testing";

describe("CustomFirestore", () => {
    beforeEach(async () => {
        await initializeTestApp();
    });

    afterEach(async () => {
        await app.config.clearFirestore();
    });

    it("should resolve collection path", () => {
        const collection = getCollectionProxy({name: "collection1"});

        expect(collection.getCollection().path).toBe("collection1");
    });

    it("should resolve nested collection path", () => {
        const collection1 = getCollectionProxy({
            name: "collection2",
            params: {
                parent: getCollectionProxy({
                    name: "collection1",
                    params: {
                        payload: {
                            data: {id: "12"},
                        },
                    },
                }),
            },
        });

        const collection2 = getCollectionProxy({
            name: "collection3",
            params: {
                parent: getCollectionProxy({
                    name: "collection2",
                    params: {
                        payload: {
                            data: {id: "23"},
                        },
                        parent: getCollectionProxy({
                            name: "collection1",
                            params: {
                                payload: {
                                    data: {id: "12"},
                                },
                            },
                        }),
                    },
                }),
            },
        });

        expect(collection1.getCollection().path).toBe("collection1/12/collection2");

        expect(collection2.getCollection().path).toBe("collection1/12/collection2/23/collection3");
    });

    it("should resolve document path", () => {
        const collection = getCollectionProxy({
            name: "collection1",
            params: {
                payload: {
                    data: {id: "123"},
                },
            },
        });

        expect(collection.getDoc().path).toBe("collection1/123");
        expect(collection.getDoc("111").path).toBe("collection1/111");
    });

    it("should accept typeof number", () => {
        const collection = getCollectionProxy({
            name: "collection1",
        });

        expect(collection.getDoc(123).path).toBe("collection1/123");
    });

    it("should have default data", () => {
        const collection = getCollectionProxy();

        expect(collection.getPayload()).toHaveProperty("belongsTo");
        expect(collection.getPayload()).toHaveProperty("id");
        expect(collection.getPayload()).toHaveProperty("createdAt");
        expect(collection.getPayload()).toHaveProperty("updatedAt");
    });

    it("should have property createdBy", () => {
        const collection = getCollectionProxy({
            name: "collection1",
            params: {
                creator: getCollectionProxy(),
            },
        });

        expect(collection.getPayload()).toHaveProperty("createdBy");
    });

    it("should have collection name", () => {
        const collection1 = getCollectionProxy();
        const collection2 = getCollectionProxy({
            name: "collection1",
        });

        expect(collection1.getCollectionName()).toBe("tests");
        expect(collection2.getCollectionName()).toBe("collection1");
    });

    it("should set and get creator", () => {
        const collection = getCollectionProxy();

        expect(collection.getCreator()).toBeUndefined();

        collection.setCreator(getCollectionProxy());

        expect(collection.getCreator().getCollectionName()).toBe("tests");
    });

    it("should set and get parent", () => {
        const collection = getCollectionProxy();

        expect(collection.getParent()).toBeUndefined();

        collection.setParent(getCollectionProxy());

        expect(collection.getParent().getCollectionName()).toBe("tests");
    });

    it("should have default document owner", () => {
        const collection = getCollectionProxy({
            params: {
                payload: {
                    data: {id: "123"},
                },
            },
        });

        expect(collection.getDocumentOwners()).toMatchObject(["123 tests"]);
    });

    it("should add document owners", () => {
        const collection = getCollectionProxy({
            params: {
                payload: {
                    data: {id: "000"},
                },
                owners: [
                    getCollectionProxy({
                        name: "owner1",
                        params: {
                            payload: {
                                data: {id: "111"},
                            },
                        },
                    }),
                    getCollectionProxy({
                        name: "owner2",
                        params: {
                            payload: {
                                data: {id: "222"},
                            },
                        },
                    }),
                ],
            },
        });

        expect(collection.getDocumentOwners()).toMatchObject(["000 tests", "111 owner1", "222 owner2"]);
    });

    it("should exclude parent relationship", () => {
        const collection1 = getCollectionProxy({
            params: {
                payload: {
                    data: {id: "test"},
                },
                parent: getCollectionProxy({
                    name: "parents",
                    params: {
                        relationships: () => [],
                    },
                }),
            },
        });

        const collection2 = getCollectionProxy({
            params: {
                payload: {
                    data: {id: "test"},
                },
                parent: getCollectionProxy({
                    name: "parent1",
                    params: {
                        parent: getCollectionProxy({name: "parent2"}),
                    },
                }),
                relationships: (relationships) => relationships.filter((relationship) => RegExp(/\w+ tests/).test(relationship)),
            },
        });

        expect(collection1.getDocumentOwners()).toMatchObject(["test tests"]);
        expect(collection2.getDocumentOwners()).toMatchObject(["test tests"]);
    });

    it("should get collection data", () => {
        const collection = getCollectionProxy({
            params: {
                payload: {
                    data: {
                        firstName: "Jane",
                        lastName: "Doe",
                        weight: 100,
                        age: 10,
                    },
                },
            },
        });

        expect(collection.getData()).toStrictEqual({
            firstName: "Jane",
            lastName: "Doe",
            weight: 100,
            age: 10,
        });

        expect(collection.getData("firstName")).toBe("Jane");
        expect(collection.getData("lastName")).toBe("Doe");
    });

    it("should set collection data from object", () => {
        const collection = getCollectionProxy().setData({
            address: {
                address1: "123 main street",
            },
        });

        expect(collection.getData()).toStrictEqual({
            address: {
                address1: "123 main street",
            },
        });
    });

    it("should set collection data from string", () => {
        const collection = getCollectionProxy().setData("address.coords.lat", 100);

        expect(collection.getData()).toStrictEqual({
            address: {
                coords: {
                    lat: 100,
                },
            },
        });
    });
});
