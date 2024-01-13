import {describe, it, expect, beforeEach, afterEach} from "vitest";
import Factory from "@razaman2/js-factory";
import {Timestamp} from "firebase-admin/firestore";
import {Collection, Updates, WriteTypes} from "../../src/index";
import {initializeTestApp, getAdminContext, app} from "@razaman2/collection-testing";
import "../firebase-init-firestore";

describe("Admin", () => {
    beforeEach(async () => {
        await initializeTestApp();
    });

    afterEach(async () => {
        await app.config.clearFirestore();
    });

    it("should get collection path", () => {
        expect(getCollectionProxy({name: "tests"}).getCollection().path).toBe("tests");

        expect(getCollectionProxy({
            name: "level2",
            params: {
                parent: getCollectionProxy({
                    name: "level1",
                    params: {
                        payload: {
                            data: {id: 1},
                        },
                    },
                }),
            },
        }).getCollection().path).toBe("level1/1/level2");

        expect(getCollectionProxy({
            name: "level2",
            params: {
                parent: getCollectionProxy({name: "level1"}).setData({id: 1}),
            },
        }).getCollection().path).toBe("level1/1/level2");

        expect(getCollectionProxy({
            name: "level2",
            params: {
                parent: getCollectionProxy({name: "level1"}).setDoc(1),
            },
        }).getCollection().path).toBe("level1/1/level2");

        expect.assertions(4);
    });

    it("should get document path", () => {
        expect(getCollectionProxy({name: "tests"}).getDoc(1).path).toBe("tests/1");
        expect(getCollectionProxy({name: "tests"}).setDoc(1).getDoc().path).toBe("tests/1");
        expect(getCollectionProxy({name: "tests"}).setData({id: 1}).getDoc().path).toBe("tests/1");

        expect(getCollectionProxy({
            name: "level2",
            params: {
                parent: getCollectionProxy({
                    name: "level1",
                    params: {
                        payload: {
                            data: {id: 1},
                        },
                    },
                }),
            },
        }).getDoc(2).path).toBe("level1/1/level2/2");

        expect(getCollectionProxy({
            name: "level2",
            params: {
                parent: getCollectionProxy({name: "level1"}).setData({id: 1}),
            },
        }).getDoc(2).path).toBe("level1/1/level2/2");

        expect(getCollectionProxy({
            name: "level2",
            params: {
                parent: getCollectionProxy({name: "level1"}).setDoc(1),
            },
        }).getDoc(2).path).toBe("level1/1/level2/2");

        expect.assertions(6);
    });

    it("should get collection group documents", async () => {
        await getAdminContext(async (firestore) => {
            const parent1 = getCollectionProxy({
                name: "tests",
                config: {getFirestore: firestore},
            });

            const parent2 = getCollectionProxy({
                name: "tests",
                config: {getFirestore: firestore},
            });

            const test1 = getCollectionProxy({
                name: "level1",
                config: {getFirestore: firestore},
                params: {
                    payload: {
                        data: {createdAt: new Date("april 1, 2022")},
                    },
                    parent: parent1,
                },
            });

            const test2 = getCollectionProxy({
                name: "level1",
                config: {getFirestore: firestore},
                params: {
                    payload: {
                        data: {createdAt: new Date("april 1, 2022")},
                    },
                    parent: parent2,
                },
            });

            await Promise.all([parent1.create(), parent2.create()]);

            await Promise.all([test1.create(), test2.create()]);

            const documents = await getCollectionProxy({
                name: "level1",
                config: {getFirestore: firestore},
                params: {
                    payload: {data: []},
                },
            }).getDocuments({
                group: true,
                realtime: false,
                query: (ref) => {
                    return ref.where("belongsTo", "array-contains-any", [`${test1.getDoc().id} level1`, `${test2.getDoc().id} level1`]);
                },
            });

            const docs = {
                [test1.getDoc().id]: {
                    id: test1.getDoc().id,
                    belongsTo: [`${test1.getDoc().id} level1`, `${parent1.getDoc().id} tests`],
                    createdAt: {
                        seconds: Timestamp.fromDate(new Date("april 1, 2022")).seconds,
                        nanoseconds: Timestamp.fromDate(new Date("april 1, 2022")).nanoseconds,
                    },
                },
                [test2.getDoc().id]: {
                    id: test2.getDoc().id,
                    belongsTo: [`${test2.getDoc().id} level1`, `${parent2.getDoc().id} tests`],
                    createdAt: {
                        seconds: Timestamp.fromDate(new Date("april 1, 2022")).seconds,
                        nanoseconds: Timestamp.fromDate(new Date("april 1, 2022")).nanoseconds,
                    },
                },
            };

            documents.getData().forEach((item: {id: string, updatedAt: Timestamp}) => {
                const {updatedAt, ...data} = item;

                expect(data).toEqual(docs[data.id]);
            });

            expect.assertions(2);
        });
    });

    it("should create test document", async () => {
        const collection = getCollectionProxy({
            name: "tests",
            params: {
                payload: {
                    data: {
                        name: "test",
                        createdAt: new Date("april 1, 2022"),
                    },
                },
            },
        });

        await collection.create();

        const test = await getCollectionProxy({name: "tests"}).init(collection.getDoc().id);

        const {updatedAt, ...data} = test.getData();

        expect(data).toEqual({
            name: "test",
            id: collection.getDoc().id,
            belongsTo: [`${collection.getDoc().id} tests`],
            createdAt: {
                seconds: Timestamp.fromDate(new Date("april 1, 2022")).seconds,
                nanoseconds: Timestamp.fromDate(new Date("april 1, 2022")).nanoseconds,
            },
        });
    });

    it("should update test document", async () => {
        const collection = getCollectionProxy({
            name: "tests",
            params: {
                payload: {
                    data: {createdAt: new Date("april 1, 2022")},
                },
            },
        });

        await collection.create();

        await collection.update({
            merge: false,
            data: {
                name: "updated",
            },
        });

        const test = await getCollectionProxy({name: "tests"}).init(collection.getDoc().id);

        const {updatedAt, ...data} = test.getData();

        expect(data).toEqual({
            name: "updated",
            id: collection.getDoc().id,
            belongsTo: [`${collection.getDoc().id} tests`],
            createdAt: {
                seconds: Timestamp.fromDate(new Date("april 1, 2022")).seconds,
                nanoseconds: Timestamp.fromDate(new Date("april 1, 2022")).nanoseconds,
            },
        });
    });

    it("should init document after create", async () => {
        const collection = getCollectionProxy();
        const id = collection.getDoc(Date.now()).id;

        const response = collection.getDocument(id, {
            realtime: true,
        });

        await collection.create();

        expect(collection.getData("id")).toBe(id);
        expect(response).toBeTypeOf("function");
    });

    it("should delete test document", async () => {
        const collection = getCollectionProxy({
            name: "tests",
            params: {
                payload: {
                    data: {
                        name: "test",
                        createdAt: new Date("april 1, 2022"),
                    },
                },
            },
        });

        await collection.create();

        await collection.remove();

        const test = await getCollectionProxy({name: "tests"}).init(collection.getDoc().id);

        expect(test.getData()).toEqual({});
    });

    it("should use collection from factory", async () => {
        const collection = Collection.proxy("tests", {
            payload: {
                data: {
                    createdAt: new Date("april 1, 2022"),
                },
            },
            factory: TestFactory,
        });

        await collection.create();

        const test = await Collection.proxy("tests").init(collection.getDoc().id);

        const {updatedAt, ...data} = test.getData();

        expect(data).toEqual({
            id: collection.getDoc().id,
            testName: "factory",
            belongsTo: [`${collection.getDoc().id} tests`],
            createdAt: {
                seconds: Timestamp.fromDate(new Date("april 1, 2022")).seconds,
                nanoseconds: Timestamp.fromDate(new Date("april 1, 2022")).nanoseconds,
            },
            testDate: {
                seconds: Timestamp.fromDate(new Date("april 1, 2022")).seconds,
                nanoseconds: Timestamp.fromDate(new Date("april 1, 2022")).nanoseconds,
            },
        });
    });

    it("should overwrite ignored keys", () => {
        const collection = getCollectionProxy({
            name: "users",
            params: {
                payload: {
                    ignoredKeys: (keys: Array<string>) => keys.concat(["ignored1", "ignored2"]),
                },
            },
        });

        console.log(collection.getIgnoredKeys());
    });

    it("update test", () => {
        const collection = getCollectionProxy({
            name: "tests",
            params: {
                payload: {data: []},
                creator: getCollectionProxy({name: "users"}),
            },
        }).onWrite({
            handler: (collection: Collection) => new Updates(collection),
            triggers: ["create", "update", "delete"],
        });

        // collection.setData(['super', 'admin', 'user']);
        // collection.setData(0, 'super');
        collection.setData("1", "admin");

        console.log("log data:", collection.getData());

        // collection.create({
        //     data: {
        //         start: new Date(),
        //         end: new Date(),
        //     }
        // });
    });
});

class TestFactory extends Factory {
    protected getDefaultInstance() {
        return Collection;
    }

    protected getDefaultInstances() {
        return {
            tests: Tests,
        };
    }
}

class Tests extends Collection {
    protected transform(data: Record<string, any>, operation: WriteTypes) {
        return {
            ...data,
            testName: "factory",
            testDate: new Date("april 1, 2022"),
        };
    }

    getCollectionName() {
        return "tests";
    }
}
