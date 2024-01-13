export default interface Subscription {
    name: string;
    handler: Function;
    data?: any;
}
