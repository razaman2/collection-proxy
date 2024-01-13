import "./firebase-init-firestore";
import {Collection} from "../src";
import {initializeTestApp, getAdminContext} from "@razaman2/firestore-testing";
import {getAuth, createUserWithEmailAndPassword} from "firebase/auth";

export default {
    initialize: async () => {
        await initializeTestApp();

        await getAdminContext(async (getFirestore) => {
            const batch = getFirestore.batch();
            const email = "user@firestore.com".trim().toLowerCase();
            const password = "password";
            const auth = await createUserWithEmailAndPassword(getAuth(), email, password);

            const user = Collection.proxy("users", {
                payload: {
                    data: {
                        id: auth.user.uid,
                        firstName: "Ainsley",
                        lastName: "Clarke",
                    },
                },
            }, {getFirestore});

            await Promise.all([
                user.create({batch}),

                Collection.proxy("settings", {parent: user}).create({
                    batch,
                    data: {
                        id: user.getDoc().id,
                        status: "active",
                        path: `user/${user.getDoc().id}`,
                    },
                }),

                Collection.proxy("emails", {parent: user}).create({
                    batch,
                    data: {address: email, primary: true},
                }),

                Collection.proxy("roles", {parent: user}).create({
                    batch,
                    data: {id: "super"},
                }),

                Collection.proxy("settings").create({
                    batch,
                    data: {
                        id: 1,
                        user: {
                            statuses: [
                                {id: "active", name: "Active"},
                                {id: "inactive", name: "Inactive"},
                                {id: "trial", name: "Trial"},
                            ],
                        },
                        company: {
                            statuses: [
                                {id: "active", name: "Active"},
                                {id: "inactive", name: "Inactive"},
                                {id: "trial", name: "Trial"},
                            ],
                        },
                    },
                }),
            ].concat(["Super", "Admin", "User"].map((role) => {
                return Collection.proxy("roles").create({
                    batch,
                    data: {
                        id: role.trim().toLowerCase(),
                        name: role,
                    },
                });
            })));

            await batch.commit();
        });
    },
};
