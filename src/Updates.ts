import ObjectManager from "@razaman2/object-manager";
import Collection from "./Collection";
import CustomFirestore from "./index";
import CollectionInterface from "./interfaces/CollectionInterface";
import CollectionParams from "./interfaces/CollectionParams";
import FirestoreConfig from "./interfaces/FirestoreConfig";
import UpdateClient from "./interfaces/UpdateClient";
import type {WriteTypes} from "./Types";

interface UpdateParams extends CollectionParams, UpdateClient {}

export default class Updates extends Collection {
    public constructor(protected client: Collection, protected params: UpdateParams = {}, config?: Partial<FirestoreConfig>) {
        super(params, config);

        if (!this.getParent()) {
            this.setParent(client.getParent());
        }

        if (!this.getCreator()) {
            if (client.getCreator()) {
                this.setCreator(client.getCreator());
            } else {
                throw new Error(`You need a creator on the update or the ${client.getCollectionName()} collection.`);
            }
        }
    }

    public async record(params: CollectionInterface, operation: WriteTypes) {
        const {batch, data = {}} = params;

        const before = new ObjectManager().copy(
            await this.params.before?.(this.client) ?? this.client.getData(),
        );

        const after = new ObjectManager().copy(
            await this.params.after?.(this.client) ?? data,
        );

        if ((this.params.strict !== false) && ["update", "delete"].includes(operation) && !before.get("id")) {
            throw new Error(`Your document data needs to be initialized before creating an update.`);
        }

        if (!batch) {
            throw new Error("Updates need to be written on a WriteBatch or Transaction.");
        }

        after.paths().forEach((path) => {
            if (/\.(_methodName)/.test(path)) {
                const path1 = path.replace(/\._methodName$/, "");
                const items = Object.values(after.get(path1)).find((item) => Array.isArray(item)) as Array<any>;

                const config: Record<string, any> = {
                    arrayUnion: before.get(path1, []).reduce?.((items: any, currentItem: any) => {
                        return items.find((duplicateItem: any) => {
                            return (
                                currentItem.hasOwnProperty("id")
                                    ? (currentItem.id === duplicateItem.id)
                                    : (currentItem === duplicateItem)
                            );
                        }) ? items : items.concat(currentItem);
                    }, items) ?? items,
                    arrayRemove: before.get(path1, []).filter?.((currentItem: any) => {
                        return !(
                            currentItem.hasOwnProperty("id")
                                ? items?.find((removedItem) => removedItem.id === currentItem.id)
                                : items?.includes(currentItem)
                        );
                    }) ?? items,
                    serverTimestamp: before.get(path1) ?? CustomFirestore.getConfig().serverTimestamp(),
                    deleteField: "${deleted}",
                };

                after.set(path1, config[after.get(path)] ?? {});
            } else {
                const segments = path.replace(/_elements\./, "").split(".");
                // console.log("path up:", {path, segments});

                for (const index in segments) {
                    const path = segments.slice(0, parseInt(index) + 1).join(".");
                    const data = before.get(path, "${empty}");

                    if (data === "${empty}") {
                        before.set(path, data);
                        break;
                    }
                }
            }
        });

        return await this.create({
            batch,
            data: {
                operation,
                after: after.get(),
                before: (operation === "create") ? {} : before.get() ?? {},
                createdBy: this.getCreator().getDoc().id,
                document: {
                    path: this.client.getDoc().path,
                    collection: {
                        name: this.client.getCollectionName(),
                        path: this.client.getCollection().path,
                    },
                },
                createdAt: CustomFirestore.getConfig().serverTimestamp(),
                belongsTo: (owners: Array<string>) => {
                    return owners.concat((operation === "create")
                        ? Object.values(after.get("belongsTo")).find((item) => Array.isArray(item)) ?? []
                        : before.get("belongsTo", []),
                    );
                },
            },
        });
    }

    public getCollectionName() {
        return "updates";
    }
}
