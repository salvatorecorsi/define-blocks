import { useState, useEffect, useRef } from '@wordpress/element';

const DEFAULT_CENTER = { lat: 41.8933203, lng: 12.4829321 };

function normalizeValue( raw ) {
	if ( typeof raw === 'string' ) {
		try { return JSON.parse( raw ); } catch { return {}; }
	}
	return raw || {};
}

export function useMapField( value, onChange ) {
	const init = normalizeValue( value );

	const [ query, setQuery ] = useState( init.query ?? '' );
	const [ lat, setLat ] = useState( Number( init.lat ) || DEFAULT_CENTER.lat );
	const [ lng, setLng ] = useState( Number( init.lng ) || DEFAULT_CENTER.lng );
	const [ addr, setAddr ] = useState( init.formatted_address ?? '' );
	const [ noResults, setNoResults ] = useState( false );
	const [ busy, setBusy ] = useState( false );
	const [ hasDraft, setHasDraft ] = useState( false );
	const [ panTo, setPanTo ] = useState( false );

	const savedRef = useRef( init );

	useEffect( () => {
		const nv = normalizeValue( value );
		savedRef.current = nv;
		const newLat = Number( nv.lat );
		const newLng = Number( nv.lng );
		if ( Number.isFinite( newLat ) && newLat !== lat ) { setLat( newLat ); setPanTo( true ); }
		if ( Number.isFinite( newLng ) && newLng !== lng ) { setLng( newLng ); setPanTo( true ); }
		if ( ( nv.formatted_address ?? '' ) !== addr ) { setAddr( nv.formatted_address ?? '' ); }
		setQuery( nv.query ?? '' );
	}, [ value ] );

	useEffect( () => { setNoResults( false ); }, [ query ] );

	const previewPosition = ( newLat, newLng ) => {
		setLat( newLat );
		setLng( newLng );
		setHasDraft( true );
		setPanTo( true );
	};

	const confirmPosition = ( newLat, newLng ) => {
		setLat( newLat );
		setLng( newLng );
		setHasDraft( false );
		setPanTo( true );
		onChange( { lat: newLat, lng: newLng, formatted_address: addr, query } );
	};

	const saveLat = ( v ) => {
		const n = parseFloat( v );
		if ( ! Number.isFinite( n ) ) { return; }
		confirmPosition( n, lng );
	};

	const saveLng = ( v ) => {
		const n = parseFloat( v );
		if ( ! Number.isFinite( n ) ) { return; }
		confirmPosition( lat, n );
	};

	const saveAddr = ( v ) => {
		setAddr( v );
		if ( hasDraft ) {
			const s = savedRef.current;
			const sLat = Number( s.lat );
			const sLng = Number( s.lng );
			onChange( {
				lat: Number.isFinite( sLat ) ? sLat : lat,
				lng: Number.isFinite( sLng ) ? sLng : lng,
				formatted_address: v,
				query,
			} );
		} else {
			onChange( { lat, lng, formatted_address: v, query } );
		}
	};

	return {
		query, setQuery,
		lat, lng,
		addr,
		noResults, setNoResults,
		busy, setBusy,
		hasDraft,
		panTo, setPanTo,
		previewPosition,
		confirmPosition,
		saveLat, saveLng, saveAddr,
	};
}
