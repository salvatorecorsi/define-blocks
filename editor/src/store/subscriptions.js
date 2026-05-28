export class FieldSubscriptions {
	constructor() {
		this.listeners = new Map();
	}

	subscribe( path, callback ) {
		if ( ! this.listeners.has( path ) ) {
			this.listeners.set( path, new Set() );
		}
		this.listeners.get( path ).add( callback );

		return () => {
			const set = this.listeners.get( path );
			if ( set ) {
				set.delete( callback );
				if ( set.size === 0 ) {
					this.listeners.delete( path );
				}
			}
		};
	}

	notify( path, value ) {
		const set = this.listeners.get( path );
		if ( set ) {
			set.forEach( ( cb ) => cb( value ) );
		}
	}

	notifyAll( values ) {
		this.listeners.forEach( ( set, path ) => {
			set.forEach( ( cb ) => cb( values[ path ] ) );
		} );
	}
}
