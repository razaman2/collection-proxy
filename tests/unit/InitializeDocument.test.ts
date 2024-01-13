import faker from "faker";
import {getCollection, initializeTestApp} from "../../src/Testing";

describe("Initialize Document", () => {
    beforeAll(async () => {
        await initializeTestApp();
    });

    it("should initialize document without providing an id", async () => {
        const id1 = Date.now();
        const id2 = faker.datatype.uuid();

        const collection1 = getCollection({
            name: "tests",
            params: {
                payload: {
                    data: {id: id1},
                },
            },
        });

        const collection2 = getCollection({
            name: "tests",
            params: {
                payload: {
                    data: {value: {id: id2}},
                },
            },
        });

        await Promise.all([collection1.create(), collection2.create()]);
        await Promise.all([collection1.init(), collection2.init()]);

        expect.assertions(2);

        expect(collection1.getData("belongsTo")).toEqual([`${id1} tests`]);
        expect(collection2.getData("belongsTo")).toEqual([`${id2} tests`]);
    });

    it("should initialize document for provided id", async () => {
        const id1 = Date.now();
        const id2 = faker.datatype.uuid();

        await Promise.all([
            getCollection({
                name: "tests",
                params: {
                    payload: {
                        data: {value: {id: id1}},
                    },
                },
            }).create(),
            getCollection({
                name: "tests",
                params: {
                    payload: {
                        data: {value: {id: id2}},
                    },
                },
            }).create(),
        ]);

        const collection1 = getCollection({name: "tests"});

        const collection2 = getCollection({name: "tests"});

        await Promise.all([collection1.init(id1), collection2.init(id2)]);

        expect.assertions(2);

        expect(collection1.getData("belongsTo")).toEqual([`${id1} tests`]);
        expect(collection2.getData("belongsTo")).toEqual([`${id2} tests`]);
    });

    it("should initialize document to callback without providing an id", async () => {
        const id1 = Date.now();
        const id2 = faker.datatype.uuid();

        const collection1 = getCollection({
            name: "tests",
            params: {
                payload: {
                    data: {value: {id: id1}},
                },
            },
        });

        const collection2 = getCollection({
            name: "tests",
            params: {
                payload: {
                    data: {value: {id: id2}},
                },
            },
        });

        await Promise.all([collection1.create(), collection2.create()]);

        expect.assertions(2);

        await collection1.init((snapshot) => {
            expect(snapshot.get("belongsTo")).toEqual([`${id1} tests`]);
        });

        await collection2.init((snapshot) => {
            expect(snapshot.get("belongsTo")).toEqual([`${id2} tests`]);
        });
    });

    it("should initialize document to callback for provided id", async () => {
        const id1 = Date.now();
        const id2 = faker.datatype.uuid();

        const collection1 = getCollection({
            name: "tests",
            params: {
                payload: {
                    data: {value: {id: id1}},
                },
            },
        });

        const collection2 = getCollection({
            name: "tests",
            params: {
                payload: {
                    data: {value: {id: id2}},
                },
            },
        });

        await Promise.all([collection1.create(), collection2.create()]);

        expect.assertions(2);

        await collection1.init(id1, (snapshot) => {
            expect(snapshot.get("belongsTo")).toEqual([`${id1} tests`]);
        });

        await collection2.init(id2, (snapshot) => {
            expect(snapshot.get("belongsTo")).toEqual([`${id2} tests`]);
        });
    });
});
