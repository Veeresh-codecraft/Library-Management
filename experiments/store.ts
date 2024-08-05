type CountAction =
  | { type: "INC"; payload?: number }
  | { type: "DEC"; payload?: number };

type State = { count: number; step: number };

function counterStore(initialValue: State) {
  let state = initialValue;
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
  return {
    getState(): State {
      return state;
    },
    dispatch(action: CountAction) {
      state = counterReducer(state, action);
    },
  };
}

const countStore = counterStore({ count: 0, step: 0 });
countStore.dispatch({ type: "INC", payload: 5 });
countStore.dispatch({ type: "DEC", payload: 2 });
console.log(countStore.getState());

// Clearly the way the dispatch brings about the change in the state
// as per the action dispatched is totally problem specific.
// This operation that dispatch performs is nothing but
// an operation on current state with the data available through action's payload.
// Mathematically, it is a function that takes current state, and the payload
// and produces new state. This function is known as reducer.

function createStore(initialState:StateT, reducer:(state:stateT, action:ActionT)=>StateT){
 let state = initialState;
 return{
  getState(): State {
    return state;
  },
  dispatch(action: CountAction) {
    state = counterReducer(state, action);
  },
 }
}