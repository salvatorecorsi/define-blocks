import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { BaseControl, TextControl, Button, PanelBody, Notice, Spinner, Tooltip } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { useMapField } from '../shared/useMapField';

export default function GoogleMap( { name, field, value, onChange } ) {
	const m = useMapField( value, onChange );
	const [ apiReady, setApiReady ] = useState( !! window.google?.maps );

	const containerRef = useRef( null );
	const mapRef = useRef( null );
	const markerRef = useRef( null );
	const confirmRef = useRef( m.confirmPosition );
	confirmRef.current = m.confirmPosition;

	const apiKey = window.defineBlocks?.keys?.googleMaps;

	useEffect( () => {
		if ( apiReady ) { return; }
		const id = setInterval( () => {
			if ( window.google?.maps ) {
				setApiReady( true );
				clearInterval( id );
			}
		}, 200 );
		return () => clearInterval( id );
	}, [] );

	useEffect( () => {
		if ( ! apiReady || ! containerRef.current || mapRef.current ) { return; }

		const map = new window.google.maps.Map( containerRef.current, {
			center: { lat: m.lat, lng: m.lng },
			zoom: 12,
			streetViewControl: false,
			mapTypeControl: false,
			fullscreenControl: false,
			gestureHandling: 'cooperative',
			zoomControl: true,
			keyboardShortcuts: false,
		} );

		const marker = new window.google.maps.Marker( {
			position: { lat: m.lat, lng: m.lng },
			map,
			draggable: true,
		} );

		map.addListener( 'click', ( e ) => {
			const lt = e.latLng.lat();
			const ln = e.latLng.lng();
			marker.setPosition( { lat: lt, lng: ln } );
			confirmRef.current( lt, ln );
		} );

		marker.addListener( 'dragend', ( e ) => {
			confirmRef.current( e.latLng.lat(), e.latLng.lng() );
		} );

		mapRef.current = map;
		markerRef.current = marker;
	}, [ apiReady ] );

	useEffect( () => {
		if ( ! mapRef.current || ! m.panTo ) { return; }
		const pos = { lat: m.lat, lng: m.lng };
		mapRef.current.panTo( pos );
		markerRef.current?.setPosition( pos );
		m.setPanTo( false );
	}, [ m.panTo, m.lat, m.lng ] );

	const findCoordinates = useCallback( async () => {
		if ( ! apiKey || ! m.query.trim() ) { return; }
		m.setBusy( true );
		try {
			const res = await fetch(
				`https://maps.googleapis.com/maps/api/geocode/json?address=${ encodeURIComponent( m.query ) }&key=${ apiKey }`
			).then( ( r ) => r.json() );

			if ( res.status !== 'OK' || ! res.results?.length ) {
				m.setNoResults( true );
				return;
			}
			m.setNoResults( false );
			const { lat: lt, lng: ln } = res.results[ 0 ].geometry.location;
			m.previewPosition( lt, ln );

			if ( mapRef.current && markerRef.current ) {
				const pos = { lat: lt, lng: ln };
				mapRef.current.panTo( pos );
				markerRef.current.setPosition( pos );
			}
		} catch ( err ) {
			console.error( 'Geocoding error:', err );
		} finally {
			m.setBusy( false );
		}
	}, [ apiKey, m.query ] );

	if ( ! apiKey ) {
		return (
			<BaseControl
				label={
					<>
						{ field.label }
						<Tooltip text="API key missing. Add it via the defb_google_maps_key filter.">
							<span style={ { cursor: 'help' } }>&#x274C;</span>
						</Tooltip>
					</>
				}
				help={ field.description }
			/>
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ field.label || 'Map' } initialOpen>
					<div className="defb-map-inspector">
						<div className="defb-map-search">
							<TextControl
								value={ m.query }
								onChange={ m.setQuery }
								placeholder="Search address..."
								onKeyDown={ ( e ) => {
									if ( e.key === 'Enter' ) { e.preventDefault(); findCoordinates(); }
								} }
								__next40pxDefaultSize
								__nextHasNoMarginBottom
							/>
							<Button variant="secondary" onClick={ findCoordinates } disabled={ m.busy } icon="search" />
						</div>
						{ m.busy && <Spinner /> }
						{ m.noResults && (
							<Notice status="warning" isDismissible={ false }>No results for &ldquo;{ m.query }&rdquo;.</Notice>
						) }
						{ m.hasDraft && (
							<Notice status="info" isDismissible={ false }>Click the map or drag the pin to confirm.</Notice>
						) }
						<div className="defb-map-coords">
							<TextControl label="Lat" value={ String( m.lat ) } onChange={ m.saveLat } __next40pxDefaultSize __nextHasNoMarginBottom />
							<TextControl label="Lng" value={ String( m.lng ) } onChange={ m.saveLng } __next40pxDefaultSize __nextHasNoMarginBottom />
						</div>
						<TextControl label="Address" value={ m.addr } onChange={ m.saveAddr } placeholder="Custom address" __next40pxDefaultSize __nextHasNoMarginBottom />
					</div>
				</PanelBody>
			</InspectorControls>

			<BaseControl label={ field.label } help={ field.description }>
				<div className={ `defb-map${ m.busy ? ' defb-map--loading' : '' }` }>
					{ ! apiReady && (
						<div className="defb-map__loading"><Spinner /></div>
					) }
					<div ref={ containerRef } className="defb-map__canvas" />
				</div>
			</BaseControl>
		</>
	);
}
