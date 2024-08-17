import { clonedField } from './cloneField.performance.ts';

export const numberVariable: Resolver = (state, entity: any) => {
  const key = state.keyOfEntity(entity);

  return {
    ...entity,
    name: clonedField(state, entity, 'name', entity._id, false),
    required: clonedField(state, entity, 'required', false, false),
    type: 'Number',
    defaultValue: clonedField(state, entity, 'defaultValue', 1),
    min: clonedField(state, entity, 'min', 1),
    max: clonedField(state, entity, 'max', 100),
    step: clonedField(state, entity, 'step', 1),
    displayStepper: clonedField(state, entity, 'displayStepper', true, false),

    rename: (name: string) => {
      state.mutate(key, {
        name,
      });
    },
    setRequired: (value: boolean) => {
      state.mutate(key, {
        required: value,
      });
    },
    setDefaultValue: (value: number) => {
      const value$ = state.resolve(key).defaultValue;
      value$.set(value);
    },
    setMin: (value: number) => {
      const value$ = state.resolve(key).min;
      value$.set(value);
    },
    setMax: (value: number) => {
      const value$ = state.resolve(key).max;
      value$.set(value);
    },
    setStep: (step: number) => {
      const value$ = state.resolve(key).step;
      value$.set(step);
    },
    setDisplayStepper: (flag: boolean) => {
      state.mutate(key, {
        displayStepper: flag,
      });
    },
  };
};
