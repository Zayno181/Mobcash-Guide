/**
 * Simple State Management Pattern (Redux-like)
 * Provides centralized state management with actions and reducers
 */

export class Store {
    constructor(reducer, initialState) {
        this.reducer = reducer;
        this.state = initialState;
        this.listeners = [];
        this.middlewares = [];
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return this.state;
    }

    /**
     * Dispatch an action to update state
     * @param {Object} action - Action object with type and payload
     */
    dispatch(action) {
        const previousState = this.state;
        
        // Run through middlewares
        let modifiedAction = action;
        this.middlewares.forEach(middleware => {
            modifiedAction = middleware(modifiedAction, this.state);
        });

        // Apply reducer
        this.state = this.reducer(this.state, modifiedAction);
        
        // Notify listeners
        this.listeners.forEach(listener => {
            try {
                listener(this.state, previousState, modifiedAction);
            } catch (error) {
                console.error('[Store] Error in state listener:', error);
            }
        });
    }

    /**
     * Subscribe to state changes
     * @param {Function} listener - Callback function(state, previousState, action)
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        this.listeners.push(listener);
        
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Add middleware
     * @param {Function} middleware - Middleware function(action, state) => modifiedAction
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }

    /**
     * Replace reducer (for hot reloading)
     * @param {Function} nextReducer - New reducer function
     */
    replaceReducer(nextReducer) {
        this.reducer = nextReducer;
        this.dispatch({ type: '@@STORE/REPLACE_REDUCER' });
    }
}

// Application state reducer
const appReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LANGUAGE':
            return {
                ...state,
                language: action.payload,
                direction: action.payload === 'ar' ? 'rtl' : 'ltr'
            };
        
        case 'SET_THEME':
            return {
                ...state,
                theme: action.payload
            };
        
        case 'SET_TRANSLATIONS':
            return {
                ...state,
                translations: {
                    ...state.translations,
                    ...action.payload
                }
            };
        
        case 'SET_SEARCH_QUERY':
            return {
                ...state,
                searchQuery: action.payload
            };
        
        case 'SET_INITIALIZED':
            return {
                ...state,
                isInitialized: action.payload
            };
        
        default:
            return state;
    }
};

// Initial application state
const initialState = {
    language: 'en',
    direction: 'ltr',
    theme: 'light',
    translations: {},
    searchQuery: '',
    isInitialized: false
};

// Create singleton store instance
export const appStore = new Store(appReducer, initialState);

export default appStore;
