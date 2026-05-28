export const SET_FIELD = 'SET_FIELD';
export const SET_VALUES = 'SET_VALUES';

export function blockReducer( state, action ) {
	switch ( action.type ) {
		case SET_FIELD:
			return {
				...state,
				[ action.key ]: action.value,
			};
		case SET_VALUES:
			return { ...action.values };
		default:
			return state;
	}
}
