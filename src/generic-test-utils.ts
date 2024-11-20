export type PropertyExists<T extends object, K extends keyof T, PropType> =
	T[K] extends PropType ? true : false;


export type Expect<T, U = true> = T extends U ? (U extends T ? true : false) : false

export function assert<_T extends true>(): void {}
