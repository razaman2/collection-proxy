import Factory from "@razaman2/js-factory";
import {CollectionReference} from "firebase/firestore";
import CustomFirestore from "./CustomFirestore";
import type CollectionInterface from "./interfaces/CollectionInterface";
import type CollectionParams from "./interfaces/CollectionParams";
import type FirestoreConfig from "./interfaces/FirestoreConfig";
import {getCollectionRelationship} from "./index";

export default class Collection extends CustomFirestore {
    public constructor(protected params: CollectionParams = {}, config?: Partial<FirestoreConfig>) {
        super(params.payload ?? {}, config);

        if (this.config) {
            this.config.logging = (typeof this.config.logging === "boolean")
                ? this.config.logging
                : Collection.getConfig().logging;
        }
    }

    public getPayload(params: CollectionInterface = {}) {
        const data = super.getPayload(params);

        if (this.getCreator()) {
            data.createdBy = this.resolveCollection(this.getCreator()).getDoc().id;
        }

        data.belongsTo = this.resolveRelationships(data.belongsTo);

        return data;
    }

    public getDocumentOwners(): Array<string> {
        const builder = (collection: Collection) => {
            if (collection) {
                const relationships = (collection.params?.owners ?? []).concat(collection).reduce((owners, owner) => {
                    owners.push(...builder(collection.getParent()));

                    if (owner !== collection) {
                        owners.push(...builder(owner));
                    }

                    return owners;
                }, [getCollectionRelationship(collection)]);

                return collection.params?.relationships
                    ? collection.params.relationships(relationships)
                    : relationships;
            } else {
                return [];
            }
        };

        return builder(this);
    }

    public getCollection(): CollectionReference {
        const segments = [this.getParent()].reduce((segments: Array<string>, collection) => {
            while (collection) {
                segments.unshift(collection.getCollectionName(), collection.getDoc().id);

                collection = collection.getParent();
            }

            return segments;
        }, []);

        return CustomFirestore.getConfig().collection(this.getFirestore(), ...segments, this.getCollectionName());
    }

    public static proxy(): Collection
    public static proxy(name: string): Collection
    public static proxy(name: string, params: CollectionParams): Collection
    public static proxy(name: string, config: Partial<FirestoreConfig>): Collection
    public static proxy(name: string, params: CollectionParams, config: Partial<FirestoreConfig>): Collection
    public static proxy(params: CollectionParams): Collection
    public static proxy(params: CollectionParams, config: Partial<FirestoreConfig>): Collection
    public static proxy(config: Partial<FirestoreConfig>): Collection
    public static proxy(
        param1?: string | CollectionParams | Partial<FirestoreConfig>,
        param2?: CollectionParams | Partial<FirestoreConfig>,
        param3?: Partial<FirestoreConfig>,
    ) {
        const name = (typeof param1 === "string") ? param1 : "tests";

        const config = (
            (typeof param1 === "string")
                // @ts-ignore
                ? (param2?.getFirestore ? param2 : param3)
                // @ts-ignore
                : (param1?.getFirestore ? param1 : param2)
        );

        const {
            payload,
            parent,
            creator,
            factory = this.getConfig().factory ?? CollectionFactory,
            ...rest
        } = ((
            (typeof param1 === "string")
                // @ts-ignore
                ? (param2?.getFirestore ? {} : param2)
                // @ts-ignore
                : (param1?.getFirestore ? {} : param1)
        ) ?? {}) as CollectionParams;

        const collection = new (factory)().instantiate(name).with(Object.assign({
            payload: Object.assign({
                name: `${name} - collection`.toUpperCase(),
                collection: name,
                data: {},
            }, payload),
        }, rest), config) as Collection;

        return collection.setParent(collection.resolveCollection(parent)).setCreator(collection.resolveCollection(creator));
    }

    protected resolveCollection = (collection?: Collection | boolean) => {
        return ((typeof collection === "boolean") && collection)
            ? this
            : collection as Collection;
    };

    protected resolveRelationships(relationships?: Array<string> | ((relationships: Array<string>) => Array<string>)) {
        const items = Array.isArray(relationships)
            ? relationships.concat(this.getDocumentOwners())
            : (typeof relationships === "function")
                ? relationships(this.getDocumentOwners())
                : (typeof relationships === "object")
                    ? Object.values(relationships).reduce((values, value) => {
                        return Array.isArray(value)
                            ? value.concat(this.getDocumentOwners())
                            : values;
                    }, []) as Array<string>
                    : this.getDocumentOwners();

        return CustomFirestore.getConfig().arrayUnion(...this.params?.relationships ? this.params.relationships(items) : items);
    }

    public getParent(): Collection {
        return this.params?.parent as Collection;
    }

    public getCreator(): Collection {
        return this.params?.creator as Collection;
    }

    public setParent(collection: Collection): Collection {
        this.params.parent = collection;

        return this;
    }

    public setCreator(collection: Collection): Collection {
        this.params.creator = collection;

        return this;
    }

    public setPath(path: string | Array<string>, collection: Collection = this): Collection {
        const segments = Array.isArray(path) ? path : path.split("/");

        if (segments.length % 2) {
            collection.setCollectionName(segments.pop()!);
        } else {
            collection.setDoc(segments.pop()!).setCollectionName(segments.pop()!);
        }

        if (segments.length) {
            return collection.setParent(Collection.proxy().setPath(segments));
        } else {
            return collection;
        }
    }
}

class CollectionFactory extends Factory {
    protected getDefaultInstance() {
        return Collection;
    }
}
