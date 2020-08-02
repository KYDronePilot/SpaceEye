export class Singleton {
    private static instance?: Singleton

    public static get Instance(): Singleton {
        if (this.instance === undefined) {
            this.instance = new this()
        }
        return this.instance
    }
}
