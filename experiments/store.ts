type CountAction =
  | { type: "INC"; payload?: number }
  | { type: "DEC"; payload?: number };

type State = { count: number; step: number };
type CountState = State;
function counterReducer(state: State, action: CountAction): State {
  let newState = { ...state }; //can be array or primitive
  switch (action.type) {
    case "INC": {
      newState = {
        ...state,
        count: state.count + (action.payload ?? state.step),
      };
      break;
    }
    case "DEC": {
      newState = {
        ...state,
        count: state.count - (action.payload ?? state.step),
      };
      break;
    }
  }
  return newState;
}

function counterStore(initialValue: State,reducer:(state:State,action:CountAction)=>State) {
  let state = initialValue;
  
  return {
    getState(): State {
      return state;
    },
    dispatch(action: CountAction) {
      state = counterReducer(state, action);
    },
  };
}

const countStore = counterStore({ count: 0, step: 0 },counterReducer);
countStore.dispatch({ type: "INC", payload: 5 });
countStore.dispatch({ type: "DEC", payload: 2 });
console.log(countStore.getState());

// Clearly the way the dispatch brings about the change in the state
// as per the action dispatched is totally problem specific.
// This operation that dispatch performs is nothing but
// an operation on current state with the data available through action's payload.
// Mathematically, it is a function that takes current state, and the payload
// and produces new state. This function is known as reducer.

function createStore<StateT,ActionT>(initialState:StateT, reducer:(state:StateT, action:ActionT)=>StateT):{
  getState(): StateT;
  dispatch(action: ActionT): void;
}{
 let state = initialState;
 return{
  getState(): StateT {
    return state;
  },
  dispatch(action: ActionT) {
    state = reducer(state, action);
  },
 }
}

const counterStore1 = createStore<CountState,CountAction>({ count: 0, step: 0 },counterReducer)

counterStore1.dispatch({ type: "INC", payload: 5 });
counterStore1.dispatch({ type: "DEC", payload: 2 });
console.log(countStore.getState());