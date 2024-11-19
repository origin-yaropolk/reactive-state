import { describe, expect, it } from '@jest/globals';

import { makeReactiveState } from './index.mjs';
import { assert, type PropertyExists, type Expect } from './generic-test-utils.mjs';
import { beforeEach } from '@jest/globals';
import { Observable } from 'rxjs';

interface TestStateInterface {
	value: number;
	name: string;
	nested: {
		value: number;
	}
}

function makeAwaiter(): [(value: void | PromiseLike<void>) => void, Promise<void>] {
	let resolver: ((value: void | PromiseLike<void>) => void) | null = null;
	const waiter = new Promise<void>(resolve => {
		resolver = resolve;
	});

	if (!resolver) {
		throw new Error('Resolver must be set');
	}

	return [resolver, waiter];
}

describe('Main tests', () => {
	let reactiveState: ReturnType<typeof makeReactiveState<TestStateInterface>>;
	const initialState: TestStateInterface = {
		value: 1,
		name: "initial",
		nested: {
			value: 2
		}
	};

	beforeEach(() => {
		reactiveState = makeReactiveState(initialState);
	})

	it('Should keep initial state not mutable', () => {
		reactiveState.setName('test');
		reactiveState.setValue(2);
		reactiveState.setNested({
			value: 3
		});

		expect(reactiveState.getName()).not.toEqual(initialState.name);
		expect(reactiveState.getValue()).not.toEqual(initialState.value);
		expect(reactiveState.getNested()).not.toEqual(initialState.nested);
		expect(reactiveState.getNested().value).not.toEqual(initialState.nested.value);
	});

	it('Should mutate inner state through setters', () => {
		reactiveState.setName('test');
		reactiveState.setValue(2);
		reactiveState.setNested({
			value: 3
		});

		expect(reactiveState.getName()).toEqual(reactiveState.state.name);
		expect(reactiveState.getValue()).toEqual(reactiveState.state.value);
		expect(reactiveState.getNested().value).toEqual(reactiveState.state.nested.value);
	});

	it('Should emit observables', () => {
		let firedName = '';
		let firedValue = 0;
		let firedNested = {
			value: 0
		}

		reactiveState.nameChanged.subscribe(value => {
			firedName = value;
		});

		reactiveState.valueChanged.subscribe(value => {
			firedValue = value;
		});

		reactiveState.nestedChanged.subscribe(value => {
			firedNested = value;
		});

		expect(firedName).toEqual(initialState.name);
		expect(firedValue).toEqual(initialState.value);
		expect(firedNested).toEqual(initialState.nested);

		reactiveState.setName('test');
		reactiveState.setValue(2);
		reactiveState.setNested({
			value: 3
		});

		expect(firedName).toEqual(reactiveState.getName());
		expect(firedValue).toEqual(reactiveState.getValue());
		expect(firedNested).toEqual(reactiveState.getNested());
	});

	it('Should emit whole state chaned only once', async() => {
		const [resolver, awaiter] = makeAwaiter();

		let firedState = {
			name: '',
			value: 0,
			nested: {
				value: 1
			}
		}

		let counter = 0;

		reactiveState.stateChanged.subscribe(value => {
			counter++;
			firedState = value;
			resolver();
		});

		reactiveState.setName('test');
		reactiveState.setValue(2);
		reactiveState.setNested({
			value: 3
		});

		await awaiter;

		expect(firedState).toEqual({
			name: 'test',
			value: 2,
			nested: {
				value: 3
			}
		});

		expect(counter).toEqual(1);
	});

	it('Should correctry reset and dispose', async() => {
		const [resolver, awaiter] = makeAwaiter();

		let counter = 0;
		let firedState = {
			name: '',
			value: 0,
			nested: {
				value: 1
			}
		};

		reactiveState.setName('test');
		reactiveState.setValue(2);
		reactiveState.setNested({
			value: 3
		});

		expect(reactiveState.state).not.toEqual(initialState);

		reactiveState.stateChanged.subscribe(value => {
			firedState = value;
			counter++;
			resolver();
		});

		reactiveState.reset();

		expect(reactiveState.state).toEqual(initialState);

		await awaiter;

		expect(counter).toEqual(1);
		expect(firedState).toEqual(reactiveState.state);

		reactiveState.dispose();

		expect(() => reactiveState.getName()).toThrow();
	});

	it('Type check', () => {
		type ReactiveState = ReturnType<typeof makeReactiveState<TestStateInterface>>;

		assert<Expect<PropertyExists<ReactiveState, 'getValue', () => number>>>();
		assert<Expect<PropertyExists<ReactiveState, 'setValue', (v: number) => void>>>();
		assert<Expect<PropertyExists<ReactiveState, 'valueChanged', Observable<number>>>>();

		assert<Expect<PropertyExists<ReactiveState, 'getName', () => string>>>();
		assert<Expect<PropertyExists<ReactiveState, 'setName', (v: string) => void>>>();
		assert<Expect<PropertyExists<ReactiveState, 'nameChanged', Observable<string>>>>();

		assert<Expect<PropertyExists<ReactiveState, 'getNested', () => {value: number}>>>();
		assert<Expect<PropertyExists<ReactiveState, 'setNested', (nested: {value: number}) => void>>>();
		assert<Expect<PropertyExists<ReactiveState, 'nestedChanged', Observable<{value: number}>>>>();

		assert<Expect<PropertyExists<ReactiveState, 'dispose', () => void>>>();
		assert<Expect<PropertyExists<ReactiveState, 'reset', () => void>>>();

		assert<Expect<PropertyExists<ReactiveState, 'state', TestStateInterface>>>();
		assert<Expect<PropertyExists<ReactiveState, 'stateChanged', Observable<TestStateInterface>>>>();
	});
});

