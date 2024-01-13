import {
    Timestamp,
    collection,
    collectionGroup,
    setDoc,
    connectFirestoreEmulator,
    getFirestore,
    getDocs,
    getDoc,
    doc,
} from "firebase/firestore";
import Collection from "../../src/Collection";
import Firestore from "../../src/CustomFirestore";
import {initializeApp} from "firebase/app";

class Snapshot {
    constructor(protected items: Array<any>) {
    }
    
    docChanges() {
        return this.items.map((item) => {
            return new DocChange(item);
        });
    }
}

class DocChange {
    constructor(protected change: any) {
    }
    
    public type = "added";
    
    public doc = {
        data: () => {
            return this.change;
        },
    };
}

describe(`Synchronize internal and external doc id's`, () => {
    // const snapshot = new Snapshot([
    //     {
    //         id: 1,
    //         name: 'one'
    //     },
    //     {
    //         id: 2,
    //         name: 'two'
    //     },
    //     {
    //         id: 3,
    //         name: 'three'
    //     },
    //     {
    //         id: 1,
    //         name: 'one'
    //     }
    // ]);
    //
    // it('can generate array with duplicates', () => {
    //     const results = new FirestoreUpdater([]).process((snapshot as unknown) as firebase.firestore.QuerySnapshot);
    //
    //     expect(results).toHaveLength(4);
    // });
    //
    // it('should generate array with only unique values based on provided key', () => {
    //     const results = new FirestoreUpdater([]).unique('id').process((snapshot as unknown) as firebase.firestore.QuerySnapshot);
    //
    //     expect(results).toHaveLength(3);
    // });
    //
    // it('should generate array with only unique values based on provided filter function', () => {
    //     const snapshot = new Snapshot([
    //         {
    //             id: 1,
    //             name: 'John Doe'
    //         },
    //         {
    //             id: 2,
    //             name: 'Jane Doe'
    //         },
    //         {
    //             id: 3,
    //             name: 'John Doe'
    //         }
    //     ]);
    //
    //     const results = new FirestoreUpdater([]).unique((item, items) => {
    //         return !items.find((a) => a.name === item.name);
    //     }).process((snapshot as unknown) as firebase.firestore.QuerySnapshot);
    //
    //     expect(results).toHaveLength(2);
    // });
    
    beforeAll(() => {
        initializeApp({projectId: "durand-cutting"});
        // connectFirestoreEmulator(getFirestore(), "localhost", 5001);
    });
    
    it("external doc id should match internal doc id when no doc provided.", () => {
        const collection = new Firestore({}, getFirestore());
        
        expect.assertions(1);
        
        collection.create({
            $testing: (payload, doc) => expect(payload.id).toBe(doc.id),
        });
    });
    
    it("external doc id should match internal doc id when a doc provided.", () => {
        const collection = new Firestore({}, getFirestore());
        const document = doc(collection.getCollection());
        
        expect.assertions(1);
        
        collection.create({
            $testing: (payload) => expect(payload.id).toBe(document.id),
            doc: document,
        });
    });
    
    it("external doc id should match internal doc id when using the getDoc helper.", () => {
        const collection = new Firestore({}, getFirestore());
        const doc = collection.getDoc();
        
        expect.assertions(1);
        
        collection.create({
            $testing: (payload) => expect(payload.id).toBe(doc.id),
            doc,
        });
    });
    
    it("external doc id should match internal doc id when doc is provided via function.", () => {
        const collection = new Firestore({}, getFirestore());
        
        expect.assertions(1);
        
        collection.create({
            $testing: (payload, doc) => expect(payload.id).toBe(doc.id),
            doc: (collection) => doc(collection),
        });
    });
    
    it("should update internal and external doc id with id from the provided doc", () => {
        const collection = new Firestore({
            data: {id: "12345"},
        }, getFirestore());
        
        expect.assertions(1);
        
        collection.create({
            $testing: (payload, doc) => expect(payload.id).toBe(doc.id),
            doc: (collection) => doc(collection),
        });
    });
    
    it("should create parent hierarchy for base collection", () => {
        const collection = Collection.proxy("a", {
            payload: {
                data: {id: "a123"},
            },
            parent: Collection.proxy("b", {
                payload: {
                    data: {id: "b123"},
                },
                parent: Collection.proxy("c", {
                    payload: {
                        data: {id: "c123"},
                    },
                    parent: Collection.proxy("d", {
                        payload: {
                            data: {id: "d123"},
                        },
                        parent: Collection.proxy("e", {
                            payload: {
                                data: {id: "e123"},
                            },
                            parent: Collection.proxy("f", {
                                payload: {
                                    data: {id: "f123"},
                                },
                            }),
                        }),
                    }),
                }),
            }),
        });
        
        expect.assertions(2);
        
        expect(collection.getCollection().path).toBe("f/f123/e/e123/d/d123/c/c123/b/b123/a");
        expect(collection.getDocumentOwners()).toMatchObject(["a123 a", "b123 b", "c123 c", "d123 d", "e123 e", "f123 f"]);
    });
    
    describe("Owner Relationships", () => {
        it("should add belongsTo relationship by adding owner collections", () => {
            const owner = Collection.proxy("owners", {
                payload: {
                    data: {id: "owner123"},
                },
            });
            
            const test = Collection.proxy("tests", {
                payload: {
                    logging: false,
                },
                owners: [owner],
            });
            
            expect.assertions(1);
            
            test.create({
                $testing: (payload, doc) => {
                    expect(payload.belongsTo).toMatchObject([`${doc.id} tests`, "owner123 owners"]);
                },
            });
        });
        
        it("should add belongsTo relationship by merging owner collections of all owners", () => {
            const owner1 = Collection.proxy("owners", {
                payload: {
                    data: {id: "owner1"},
                },
                parent: Collection.proxy("parents", {
                    payload: {
                        data: {id: "parent1"},
                    },
                }),
            });
            
            const owner2 = Collection.proxy("owners", {
                payload: {
                    data: {id: "owner2"},
                },
                parent: Collection.proxy("parents", {
                    payload: {
                        data: {id: "parent2"},
                    },
                }),
                owners: [owner1],
            });
            
            const owner3 = Collection.proxy("owners", {
                payload: {
                    data: {id: "owner3"},
                },
                parent: Collection.proxy("parents", {
                    payload: {
                        data: {id: "parent3"},
                    },
                }),
                owners: [owner2],
            });
            
            const test = Collection.proxy("tests", {
                payload: {
                    logging: false,
                },
                owners: [
                    Collection.proxy("owners", {
                        payload: {
                            data: {id: "owner4"},
                        },
                    }),
                ],
                parent: owner3,
            });
            
            expect.assertions(1);
            
            test.create({
                $testing: (payload, doc) => {
                    expect(payload.belongsTo).toMatchObject([
                        `${doc.id} tests`,
                        "owner3 owners",
                        "parent3 parents",
                        "owner2 owners",
                        "parent2 parents",
                        "owner1 owners",
                        "parent1 parents",
                        "owner4 owners",
                    ]);
                },
                
            });
        });
    });
    
    describe("Document Relationships", () => {
        it("should merge belongsTo array values into belongsTo relationship", () => {
            const test = Collection.proxy("tests", {
                payload: {
                    logging: false,
                    data: {
                        belongsTo: ["array1", "array2"],
                    },
                },
            });
            
            expect.assertions(1);
            
            test.create({
                $testing: (payload, doc) => {
                    expect(payload.belongsTo).toMatchObject(["array1", "array2", `${doc.id} tests`]);
                },
            });
        });
        
        it("should merge belongsTo function values into belongsTo relationship", () => {
            const test = Collection.proxy("tests", {
                payload: {
                    logging: false,
                    data: {
                        belongsTo: (owners: Array<string>) => ["function1", "function2"].concat(owners),
                    },
                },
            });
            
            expect.assertions(1);
            
            test.create({
                $testing: (payload, doc) => {
                    expect(payload.belongsTo).toMatchObject(["function1", "function2", `${doc.id} tests`]);
                },
            });
        });
    });
    
    describe("Document Timestamps", () => {
        it("should merge createdAt javascript date object into payload as firebase timestamp", () => {
            const test = Collection.proxy("tests", {
                payload: {
                    logging: false,
                    data: {
                        createdAt: new Date("january 1, 2000"),
                    },
                },
            });
            
            expect.assertions(1);
            
            test.create({
                $testing: (payload) => {
                    expect(payload.createdAt.toDate()).toEqual(new Date("january 1, 2000"));
                },
            });
        });
        
        it("should merge createdAt firebase timestamp into payload", () => {
            const test = Collection.proxy("tests", {
                payload: {
                    logging: false,
                    data: {
                        createdAt: Timestamp.fromDate(new Date("march 29, 1985")),
                    },
                },
            });
            
            expect.assertions(1);
            
            test.create({
                $testing: (payload) => {
                    expect(payload.createdAt.toDate()).toEqual(new Date("march 29, 1985"));
                },
            });
        });
        
        it("should merge createdAt function that receives the data and merge javascript date object into payload as firebase timestamp", () => {
            const test = Collection.proxy("tests", {
                payload: {
                    logging: false,
                    data: {
                        createdAt: (data: Record<string, any>) => new Date("july 4, 1966"),
                    },
                },
            });
            
            expect.assertions(1);
            
            test.create({
                $testing: (payload) => {
                    expect(payload.createdAt.toDate()).toEqual(new Date("july 4, 1966"));
                },
            });
        });
        
        it("should merge createdAt function that receives the data and merge firebase timestamp into payload", () => {
            const test = Collection.proxy("tests", {
                payload: {
                    logging: false,
                    data: {
                        createdAt: (data: Record<string, any>) => Timestamp.fromDate(new Date("december 25, 1920")),
                    },
                },
            });
            
            expect.assertions(1);
            
            test.create({
                $testing: (payload) => {
                    expect(payload.createdAt.toDate()).toEqual(new Date("december 25, 1920"));
                },
            });
        });
        
        it("should add createdAt property to payload as firebase timestamp when a valid createdAt value was not supplied", () => {
            const test = Collection.proxy("tests", {
                payload: {logging: false},
            });
            
            expect.assertions(1);
            
            test.create({
                $testing: (payload) => {
                    expect(payload.createdAt.constructor.name).toEqual("ServerTimestampFieldValueImpl");
                },
            });
        });
    });
    
    it("should create valid document path", () => {
        const test = Collection.proxy("one", {
            payload: {
                logging: false,
                data: {id: "one123"},
            },
            parent: Collection.proxy("two", {
                payload: {
                    data: {id: "two123"},
                },
                parent: Collection.proxy("three", {
                    payload: {
                        data: {id: "three123"},
                    },
                }),
            }),
        });
        
        expect.assertions(1);
        
        test.create({
            $testing: (payload, doc) => {
                expect(doc.path).toBe("three/three123/two/two123/one/one123");
            },
        });
    });
    
    it("read test", async () => {
        await Collection.proxy("tests", {
            payload: {
                data: {
                    belongsTo: ["123 users", "456 emails", "789 phones"],
                    name: "test one",
                    age: 50,
                    weight: 200,
                },
                logging: false,
            },
        }, getFirestore()).create();
        
        const documents = await getDocs(Collection.proxy("tests").getCollection());
        
        console.log("what are the docs:", documents.size);
    });
});
