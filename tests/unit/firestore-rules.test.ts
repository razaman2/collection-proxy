import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {initializeFirestoreProxy} from "../firebase-init-firestore";
import {initializeTestApp, getCollectionProxy, getAdminContext, getDefaultContext, assertFails, assertSucceeds, app} from "@razaman2/firestore-testing";
import {Collection, Updates} from "../../src/index";
import faker from "faker";
import {collection} from "firebase/firestore";

beforeEach(async () => {
    await initializeTestApp();
    initializeFirestoreProxy();
});

afterEach(async () => {
    await app.config.clearFirestore();
});

it("should identify document owner on the createdBy property", async () => {
    const collection = getCollectionProxy({
        params: {
            creator: getCollectionProxy().setDoc(123),
        },
    });

    await collection.create();
    await collection.init();

    expect(collection.getData("createdBy")).toBe("123");
});

it("only users with super or admin roles can create user documents", async () => {
    const data = {
        id: faker.datatype.uuid(),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
    };

    await getAdminContext(async (firestore) => {
        const user = getCollectionProxy({
            name: "users",
            config: {getFirestore: firestore},
            params: {
                payload: {data},
            },
        });

        const batch = firestore.batch();

        await Promise.all([
            user.create({batch}),

            getCollectionProxy({
                name: "roles",
                config: {getFirestore: firestore},
                params: {
                    payload: {
                        data: {id: "super"},
                    },
                    parent: user,
                },
            }).create({batch}),
        ]);

        await batch.commit();
    });

    await Promise.all([
        getCollectionProxy({
            name: "users",
            // config: {getFirestore: firestore},
            // auth: data,
        }).create(),

        getCollectionProxy({
            name: "users",
            // config: {getFirestore: firestore},
            // auth: data,
        }).create(),
    ]);
});

it("should update document", async () => {
    const collection1 = Collection.proxy({
        payload: {
            data: {
                name: "jane doe",
            },
        },
    });

    const collection2 = Collection.proxy();

    await collection1.create();
    await collection2.init(collection1.getDoc().id);

    expect(collection2.getData("name")).toBe("jane doe");

    await collection1.update({
        data: {name: "john doe"},
        merge: false,
    });

    await collection2.init(collection1.getDoc().id);

    expect(collection2.getData("name")).toBe("john doe");
});

it("should create document", async () => {
    const collection = getCollectionProxy({
        name: "users",
        params: {
            parent: getCollectionProxy().setDoc(111),
            creator: getCollectionProxy({name: "users"}).setDoc(222),
        },
    }).setDoc(333);

    await collection.create();
    await collection.init();

    expect(collection.getData("id")).toBe("333");
    expect(collection.getData("createdBy")).toBe("222");
    expect(collection.getData("createdAt").toDate()).toBeInstanceOf(Date);
    expect(collection.getData("updatedAt").toDate()).toBeInstanceOf(Date);
    expect(collection.getData("belongsTo")).toHaveLength(2);
    expect(collection.getData("belongsTo")).toContain("111 tests");
    expect(collection.getData("belongsTo")).toContain("333 users");
});

it("should write update at root", async () => {
    await getDefaultContext(async (firestore) => {
        const collection = getCollectionProxy({
            config: {getFirestore: firestore},
            params: {
                // payload: {
                //     data: {
                //         belongsTo: ["000 companies"],
                //     },
                // },
                creator: getCollectionProxy(),
                owners: [getCollectionProxy({name: "companies"}).setDoc("000")],
            },
        });

        await collection.create({
            update: (collection) => new Updates(collection, {getFirestore: firestore}).setDoc(111),
        });

        const created = await getCollectionProxy({
            name: "updates",
            config: {getFirestore: firestore},
            auth: {id: 1},
        }).setDoc(111).init();

        expect(created.getData("id")).toBe("111");
    });

    // await collection.update({
    //     update: (collection) => new Updates(collection, {
    //         parent: collection,
    //     }),
    //     data: {
    //         name: "jane doe"
    //     }
    // })

    // await collection.remove({
    //     update: (collection) => new Updates(collection, {
    //         parent: collection,
    //     }),
    // });
});
