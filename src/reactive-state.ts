import { BehaviorSubject, debounceTime, type Observable } from "rxjs";

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

type Wrapper<T> =
	ToGetters<PrefixAll<T, 'get'>> &
	ToSetters<PrefixAll<T, 'set'>> &
	ToObservables<PostfixAll<T, 'Changed'>> & {
		stateChanged: Observable<T>;
		readonly state: MakeReadonly<T>;
		reset(): void;
		dispose(): void;
	};

type ReactiveState<T> = Wrapper<WithoutMethods<T>>;

class PropertiesHandler<T> {
	disposed: boolean = false;
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
			const subject: BehaviorSubject<T[Extract<keyof T, string>]> | undefined = this.subjects[key];

			if (subject) {
				subject.complete();
			}
		}

		this.disposed = true;
	}

	reset(): void {
		for(const key in this.defaults) {
			const subject = this.subjects[key];

			if (subject === undefined) {
				throw new Error(`Trying reset ${key}: subject is undefined`);
			}

			subject.next(this.defaults[key]);
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
		if (context.disposed) {
			throw new Error(`Trying for ${propertyKey}: reactive state disposed`);
		}

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
			apply(_target: unknown, this_: PropertiesHandler<T>, arg: T[Extract<keyof T, string>][]): unknown {
				const subject = this_.subjects[key]

				if (!subject) {
					throw new Error(`Trying for ${propertyKey}: subject "${key}" is null or undefined`);
				}

				if (propertyKey.startsWith('get')) {
					return subject.value;
				}

				if (propertyKey.startsWith('set')) {
					if (!arg[0]) {
						throw new Error(`Trying for ${propertyKey}: arg is null or undefined`);
					}

					subject.next(arg[0]);
					this_.stateSource.next(this_.state);
				}

				return;
			}
		});

		this.properties[propertyKey] = propProxy;

		return propProxy;
	}
}

export function makeReactiveState<T extends object>(defaults: T): ReactiveState<T> {
	return new Proxy(new PropertiesHandler<T>(defaults), new ProxyHandler()) as ReactiveState<T>;
}
