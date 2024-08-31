import { createState } from "@graph-state/core";

type StateEntity1 = {
  _type: "State1";
  artur: "няшка";
};

type StateEntity2 = {
  _type: "State2";
  artur: "пиздюк";
};

const state = createState<[StateEntity1, StateEntity2]>({
  initialState: {
    artur: "няшка", // correct
    // stringValue: "15", // incorrect
  },
});
state.value;
const entity = state.resolve("State1:1"); // StateEntity
const entity2 = state.resolve({
  _type: "State2",
  artur: "пиздюк",
});
state.resolve("incorrectGraph"); // unknown

state.mutate("State:id", {
  value: "hello", // incorrect
});
