import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {Collection} from "../../src/index";
import {initializeFirestoreProxy} from "../firebase-init-firestore";
import {initializeTestApp, getDefaultContext, app} from "@razaman2/collection-testing";
import {getFirestore, doc, collection} from "firebase/firestore";

describe("WriteData", () => {
    beforeEach(async () => {
        await initializeTestApp();
    });

    afterEach(async () => {
        await app.config.clearFirestore();
    });

    it("should write string key", () => {
        const collection1 = Collection.proxy();
        const collection2 = Collection.proxy();

        collection1.setData(" ", "non empty string");
        collection2.setData("", "empty string");

        expect(collection1.getData(" ")).toBe("non empty string");
        expect(collection2.getData("")).toBe("empty string");

        expect.assertions(2);
    });

    it("should write number key", () => {
        const collection1 = Collection.proxy();
        const collection2 = Collection.proxy();

        collection1.setData(0, "zero");
        collection2.setData(1, "one");

        expect(collection1.getData(0)).toBe("zero");
        expect(collection2.getData(1)).toBe("one");

        expect.assertions(2);
    });

    it("should write object", () => {
        const collection = Collection.proxy();

        collection.setData({firstName: "john", lastName: "doe"});

        expect(collection.getData()).toEqual({firstName: "john", lastName: "doe"});

        expect.assertions(1);
    });

    it("should write array", () => {
        const collection = Collection.proxy({
            payload: {data: []},
        });

        collection.setData(["super", "admin"]);

        expect(collection.getData()).toEqual(["super", "admin"]);

        expect.assertions(1);
    });

    it("should write number value", () => {
        const collection1 = Collection.proxy();
        const collection2 = Collection.proxy();

        collection1.setData(0);
        collection2.setData(1);

        expect(collection1.getData()).toBe(0);
        expect(collection2.getData()).toBe(1);

        expect.assertions(2);
    });

    it("should write string value", () => {
        const collection1 = Collection.proxy();
        const collection2 = Collection.proxy();

        collection1.setData(" ");
        expect(collection1.getData()).toBe(" ");

        collection2.setData("");
        expect(collection2.getData()).toBe("");

        expect.assertions(2);
    });

    it.only("test path", async () => {
        // console.log(Collection.proxy().setPath("test/1/test/2/test/3/test/4/test/5/test/6/test/7/test/8/test/9/test/10").getDoc().path);
        // console.log(Collection.proxy().setPath("test/1/test/2/test/3/test/4/test/5/test/6/test/7/test/8/test/9/test/10").getParent().getParent().getParent().getParent().getParent().getParent().getParent().getParent().getParent().getDoc().id);
        // console.log(Collection.proxy().setPath("test/1/test/2/test/3/test/4/test/5/test/6/test/7/test/8/test/9/test").getCollection().path);
        // console.log(Collection.proxy().setPath("test1/1/test2/2/test3/3/test4/4/test5/5/test6/6/test7/7/test8/8/test9/9/test10").getDoc().path);
        //
        // console.log(doc(getFirestore(), "test1/1/test2/2/test3/3/test4/4/test5/5/test6/6/test7/7/test8/8/test9/9/test10/123").path);
        // console.log(Collection.proxy().setPath("test1/1/test2/2/test3/3/test4/4/test5/5/test6/6/test7/7/test8/8/test9/9/test10").getCollection().path);
        // console.log(collection(getFirestore(), "test1/1/test2/2/test3/3/test4/4/test5/5/test6/6/test7/7/test8/8/test9/9/test10").path);

        // console.log(Collection.proxy("test", {
        //     parent: Collection.proxy("test", {
        //         parent: Collection.proxy("test", {
        //             parent: Collection.proxy("test", {
        //                 parent: Collection.proxy("test", {
        //                     parent: Collection.proxy("test", {
        //                         parent: Collection.proxy("test", {
        //                             parent: Collection.proxy("test", {
        //                                 parent: Collection.proxy("test", {
        //                                     parent: Collection.proxy("test").setDoc(1),
        //                                 }).setDoc(2),
        //                             }).setDoc(3),
        //                         }).setDoc(4),
        //                     }).setDoc(5),
        //                 }).setDoc(6),
        //             }).setDoc(7),
        //         }).setDoc(8),
        //     }).setDoc(9),
        // }).getCollection().path);

        // console.log(Collection.proxy("test", {
        //     parent: Collection.proxy("test", {
        //         parent: Collection.proxy("test", {
        //             parent: Collection.proxy("test", {
        //                 parent: Collection.proxy("test", {
        //                     parent: Collection.proxy("test", {
        //                         parent: Collection.proxy("test", {
        //                             parent: Collection.proxy("test", {
        //                                 parent: Collection.proxy("test", {
        //                                     parent: Collection.proxy("test").setDoc(1),
        //                                 }).setDoc(2),
        //                             }).setDoc(3),
        //                         }).setDoc(4),
        //                     }).setDoc(5),
        //                 }).setDoc(6),
        //             }).setDoc(7),
        //         }).setDoc(8),
        //     }).setDoc(9),
        // }).getDoc(10).path);

        getDefaultContext(async (getFirestore) => {
            initializeFirestoreProxy();
            // Collection.proxy({getFirestore});

            console.log(Collection.proxy("test", {
                parent: Collection.proxy("test", {
                    parent: Collection.proxy("test", {
                        parent: Collection.proxy("test", {
                            parent: Collection.proxy("test", {
                                parent: Collection.proxy("test", {
                                    parent: Collection.proxy("test", {
                                        parent: Collection.proxy("test", {
                                            parent: Collection.proxy("test", {
                                                parent: Collection.proxy("test").setDoc(1),
                                            }).setDoc(2),
                                        }).setDoc(3),
                                    }).setDoc(4),
                                }).setDoc(5),
                            }).setDoc(6),
                        }).setDoc(7),
                    }).setDoc(8),
                }).setDoc(9),
            }).getDoc(10).path);

            console.log(Collection.proxy().setPath(`test/1/test/2/test/3/test/4/test/5/test/6/test/7/test/8/test/9/test`).getDoc(10).path);

            console.log(Collection.proxy("test", {
                parent: Collection.proxy("test", {
                    parent: Collection.proxy("test", {
                        parent: Collection.proxy("test", {
                            parent: Collection.proxy("test", {
                                parent: Collection.proxy("test", {
                                    parent: Collection.proxy("test", {
                                        parent: Collection.proxy("test", {
                                            parent: Collection.proxy("test", {
                                                parent: Collection.proxy("test").setDoc(1),
                                            }).setDoc(2),
                                        }).setDoc(3),
                                    }).setDoc(4),
                                }).setDoc(5),
                            }).setDoc(6),
                        }).setDoc(7),
                    }).setDoc(8),
                }).setDoc(9),
            }).getCollection().path);

            console.log(Collection.proxy().setPath("test/1/test/2/test/3/test/4/test/5/test/6/test/7/test/8/test/9/test").getCollection().path);
        });
    });
});
