import Collection from "../../src/Collection";
import Firestore from "../../src/CustomFirestore";
import {assertFails, assertSucceeds, initializeTestEnvironment} from "@firebase/rules-unit-testing";
import {connectFirestoreEmulator, doc, getFirestore, getDocs, getDoc} from "firebase/firestore";
import {initializeApp} from "firebase/app";

describe("Reactive Vue Firestore Get Doc", () => {
    // const firebase = initializeTestApp({
    //     projectId: 'sable-crm-b8a96'
    // });

    const setup = (data: object = {}) => {
        // const firestore = firebase.firestore();

        return new Firestore(data, {} as never);
    };

    it("should return a doc reference for the provided id", () => {
        const document = setup({data: {id: "abc"}});

        expect(document.getDoc().id).toBe("abc");
    });

    it("should return a doc reference for an auto-generated id", () => {
        const document = setup();

        expect(document.getDoc().id).toHaveLength(20);
    });

    it("should return the same id when called multiple times with provided id", () => {
        const document = setup({data: {id: "123"}});

        for (let index = 0; index < 10; index++) {
            expect(document.getDoc().id).toBe("123");
        }
    });

    it("should return the same id when called multiple times with auto-generated id", () => {
        const document = setup();
        const id = document.getDoc().id;

        for (let index = 0; index < 10; index++) {
            expect(document.getDoc().id).toBe(id);
        }
    });

    it("collection test", async () => {
        initializeApp({projectId: "test"});
        connectFirestoreEmulator(getFirestore(), "localhost", 8080);

        const collection = Collection.proxy("a", {
            payload: {
                data: {value: {id: "a123"}},
            },
            parent: Collection.proxy("b", {
                payload: {
                    data: {value: {id: "b123"}},
                },
                parent: Collection.proxy("c", {
                    payload: {
                        data: {value: {id: "c123"}},
                    },
                    parent: Collection.proxy("d", {
                        payload: {
                            data: {value: {id: "d123"}},
                        },
                        parent: Collection.proxy("e", {
                            payload: {
                                data: {value: {id: "e123"}},
                            },
                            parent: Collection.proxy("f", {
                                payload: {
                                    data: {value: {id: "f123"}},
                                },
                            }),
                        }),
                    }),
                }),
            }),
        });

        console.log("collection path:", collection.getDocumentOwners());
        console.log("collection path:", collection.getCollection().path);
        // tests.create({
        //     // "@testing": (payload: Record<string, any>) => console.log("my testing payload:", payload),
        // });


        const results = await getDocs(collection.getCollection());

        console.log("results:", results.size);

        // await tests.create({data: (data) => ({...data, name: "gill"})});
        // await assertSucceeds(tests.remove({doc: (collection) => doc(collection, "t5xod4x4eQzK3hXmTxMC")}));
        // console.log(tests.getData());

        // const docs = new Collection({
        //     data: {
        //         logging: false,
        //     },
        // }, getFirestore());
        //
        // docs.getDocuments({
        //     callback: (snapshot) => {
        //         docs.replaceData(snapshot.docs.map((doc) => doc.data()));
        //
        //         console.log("output:", docs.getData());
        //     },
        // });
        //
        // await docs.create({
        //     data: {name: "zoom jay"},
        // });
    });
});
