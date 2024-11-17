import { BehaviorSubject, debounceTime, Observable } from "rxjs";

export interface Item {
    v: number;
}

export interface TestObject {
    id: number;
    name: string;
    value: {
        v: number;
        asS: string;
        items: Item[];
    },
    items: Item[];
}

type ExcludeFunctions<T> = {
    [K in keyof T] :
        T[K] extends (...args: unknown[]) => unknown ? never :
        K;
}[keyof T];

type PrefixAll<T, P extends string>  = {
    [K in keyof T & string as `${P}${Capitalize<K>}`]: T[K]
}

type PostfixAll<T, P extends string> = {
    [K in keyof T & string as `${K}${P}`]: T[K]
}

type ToGetters<T> = {
    [K in keyof T]: T[K] extends Array<unknown> ? () => ReadonlyArray<T[K][number]> : () => T[K];
}

type ToSetters<T> = {
    [K in keyof T]: (value: T[K]) => void;
}

type ToObservables<T> = {
    [K in keyof T]: Observable<T[K]>;
}

type WithoutMethods<T> = {
    [K in ExcludeFunctions<T>]: T[K] 
}

type MakeReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? MakeReadonly<T[K]> : Readonly<T[K]>;
}

type Wrapper<T> = ToGetters<PrefixAll<T, 'get'>> & ToSetters<PrefixAll<T, 'set'>> & ToObservables<PostfixAll<T, 'Changed'>> & {
    stateChanged: Observable<T>;
    readonly state: MakeReadonly<T>;
    dispose(): void;
};

type ObservableState<T> = Wrapper<WithoutMethods<T>>;

class PropertiesHandler<T> {
    state: T;
    stateSource: BehaviorSubject<T>;
    stateChanged: Observable<T>;
    subjects: Record<string, BehaviorSubject<T[Extract<keyof T, string>]>> = {};

    constructor(readonly defaults: T) {
        this.state = structuredClone(defaults);

        for(const key in this.state) {
            const subject = new BehaviorSubject<T[Extract<keyof T, string>]>(this.state[key]);
            this.subjects[key] = subject;

            subject.subscribe(value => {
                this.state[key] = value;
            });
        }

        this.stateSource = new BehaviorSubject(this.state);
        this.stateChanged = this.stateSource.asObservable().pipe(debounceTime(1));
    }

    dispose(): void {
        this.stateSource.complete();

        for (const key in this.subjects) {
            this.subjects[key].complete();
        }
    }
}
 
class ProxyHandler<T> {
    private readonly properties: Record<string, unknown> = {};

    static getKey(propertyKey: string): string {
        if (propertyKey === 'stateChanded') {
            return propertyKey;
        }

        if (propertyKey.endsWith('Changed')) {
            return propertyKey.slice(0, propertyKey.indexOf('Changed'));   
        }

        const prop = propertyKey.slice(3);
        return prop.charAt(0).toLowerCase() + prop.slice(1);
    }

    static isProperty<T extends object>(propertyKey: string, context: T): propertyKey is keyof PropertiesHandler<T> {
        return propertyKey in context;
    }

    get(context: PropertiesHandler<T>, propertyKey: string | keyof PropertiesHandler<T>): unknown {
        if (ProxyHandler.isProperty(propertyKey, context)) {
            return context[propertyKey];
        }

        const key = ProxyHandler.getKey(propertyKey);

        if (propertyKey.endsWith('Changed')) {
            return context.subjects[key];
        }

        const propertyProxy = this.properties[propertyKey];

        if (propertyProxy) {
            return propertyProxy;
        }

        const propProxy = new Proxy(() => {}, {
            apply(target: unknown, this_: PropertiesHandler<T>, arg: T[Extract<keyof T, string>][]): unknown {
                if (propertyKey.startsWith('get')) {
                    return this_.subjects[key].value;
                }

                if (propertyKey.startsWith('set')) {
                    this_.subjects[key].next(arg[0]);
                    this_.stateSource.next(this_.state);
                }
            }
        });

        this.properties[propertyKey] = propProxy;

        return propProxy;
    }
}

export function observableState<T>(state: T): ObservableState<T> {
    return new Proxy(new PropertiesHandler<T>(state), new ProxyHandler()) as ObservableState<T>;
}

