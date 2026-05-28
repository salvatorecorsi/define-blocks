import { useEffect, useCallback } from '@wordpress/element';
import { BaseControl, TextControl, Button, PanelBody, Notice, Spinner, Tooltip } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { useMapField } from '../shared/useMapField';

if ( ! L.Draggable.prototype._iframePatched ) {
	const origOnDown = L.Draggable.prototype._onDown;
	L.Draggable.prototype._onDown = function ( e ) {
		origOnDown.call( this, e );
		if ( L.Draggable._dragging !== this ) { return; }
		const ownerDoc = this._element.ownerDocument;
		if ( ownerDoc === document ) { return; }
		const mouse = e.type === 'mousedown';
		const move = mouse ? 'mousemove' : 'touchmove';
		const end = mouse ? 'mouseup' : 'touchend touchcancel';
		L.DomEvent.off( document, move, this._onMove, this );
		L.DomEvent.off( document, end, this._onUp, this );
		L.DomEvent.on( ownerDoc, move, this._onMove, this );
		L.DomEvent.on( ownerDoc, end, this._onUp, this );
	};

	const origFinishDrag = L.Draggable.prototype.finishDrag;
	L.Draggable.prototype.finishDrag = function ( noInertia ) {
		const ownerDoc = this._element.ownerDocument;
		if ( ownerDoc !== document ) {
			L.DomEvent.off( ownerDoc, 'mousemove touchmove', this._onMove, this );
			L.DomEvent.off( ownerDoc, 'mouseup touchend touchcancel', this._onUp, this );
		}
		origFinishDrag.call( this, noInertia );
	};

	L.Draggable.prototype._iframePatched = true;
}

const defaultIcon = L.icon( {
	iconUrl: markerIconUrl,
	iconRetinaUrl: markerIcon2xUrl,
	shadowUrl: markerShadowUrl,
	iconSize: [ 25, 41 ],
	iconAnchor: [ 12, 41 ],
	popupAnchor: [ 1, -34 ],
	shadowSize: [ 41, 41 ],
} );

function MapController( { center, panTo, onPanned } ) {
	const map = useMap();

	useEffect( () => {
		if ( ! map ) { return; }
		const frame = requestAnimationFrame( () => map.invalidateSize() );
		return () => cancelAnimationFrame( frame );
	}, [ map ] );

	useEffect( () => {
		if ( map && panTo ) {
			map.panTo( center );
			onPanned();
		}
	}, [ map, panTo, center, onPanned ] );

	useEffect( () => {
		if ( ! map ) { return; }
		const container = map.getContainer();
		const onWheel = ( e ) => {
			if ( ! e.ctrlKey ) { return; }
			e.preventDefault();
			if ( e.deltaY < 0 ) { map.zoomIn( 1, { animate: true } ); }
			else { map.zoomOut( 1, { animate: true } ); }
		};
		container.addEventListener( 'wheel', onWheel, { passive: false } );
		return () => container.removeEventListener( 'wheel', onWheel );
	}, [ map ] );

	return null;
}

function MapClickHandler( { onClick } ) {
	useMapEvents( {
		click( e ) { onClick( e.latlng.lat, e.latlng.lng ); },
	} );
	return null;
}

export default function OsmMap( { name, field, value, onChange } ) {
	const m = useMapField( value, onChange );

	const findCoordinates = useCallback( async () => {
		if ( ! m.query.trim() ) { return; }
		m.setBusy( true );
		try {
			const url = `https://nominatim.openstreetmap.org/search?format=json&q=${ encodeURIComponent( m.query ) }&limit=1`;
			const res = await fetch( url, { headers: { Accept: 'application/json' } } );
			const data = await res.json();

			if ( ! data?.length ) { m.setNoResults( true ); return; }
			m.setNoResults( false );
			m.previewPosition( parseFloat( data[ 0 ].lat ), parseFloat( data[ 0 ].lon ) );
		} catch ( err ) {
			console.error( 'Geocoding error:', err );
		} finally {
			m.setBusy( false );
		}
	}, [ m.query ] );

	const center = [ m.lat, m.lng ];

	return (
		<>
			<InspectorControls>
				<PanelBody title={ field.label || __( 'Map', 'define-blocks' ) } initialOpen>
					<div className="defb-map-inspector">
						<div className="defb-map-search">
							<TextControl
								value={ m.query }
								onChange={ m.setQuery }
								placeholder={ __( 'Search address…', 'define-blocks' ) }
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
							<Notice status="warning" isDismissible={ false }>{ sprintf( __( 'No results for “%s”.', 'define-blocks' ), m.query ) }</Notice>
						) }
						{ m.hasDraft && (
							<Notice status="info" isDismissible={ false }>{ __( 'Click the map or drag the pin to confirm.', 'define-blocks' ) }</Notice>
						) }
						<div className="defb-map-coords">
							<TextControl label={ __( 'Lat', 'define-blocks' ) } value={ String( m.lat ) } onChange={ m.saveLat } __next40pxDefaultSize __nextHasNoMarginBottom />
							<TextControl label={ __( 'Lng', 'define-blocks' ) } value={ String( m.lng ) } onChange={ m.saveLng } __next40pxDefaultSize __nextHasNoMarginBottom />
						</div>
						<TextControl label={ __( 'Address', 'define-blocks' ) } value={ m.addr } onChange={ m.saveAddr } placeholder={ __( 'Custom address', 'define-blocks' ) } __next40pxDefaultSize __nextHasNoMarginBottom />
					</div>
				</PanelBody>
			</InspectorControls>

			<BaseControl
					label={
						<>
							{ field.label }
							<Tooltip text={ __( 'No API key needed. Search moves the preview; click or drag the pin to save.', 'define-blocks' ) }>
								<span style={ { cursor: 'help' } }>&#x2139;&#xFE0F;</span>
							</Tooltip>
						</>
					}
					help={ field.description }
				>
				<div className={ `defb-map${ m.busy ? ' defb-map--loading' : '' }` }>
					<MapContainer
						className="defb-map__canvas"
						center={ center }
						zoom={ 12 }
						scrollWheelZoom={ false }
						style={ { width: '100%', height: '100%' } }
					>
						<TileLayer
							attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						/>
						<MapController center={ center } panTo={ m.panTo } onPanned={ () => m.setPanTo( false ) } />
						<MapClickHandler onClick={ ( lt, ln ) => m.confirmPosition( lt, ln ) } />
						<Marker
							position={ center }
							icon={ defaultIcon }
							draggable
							eventHandlers={ {
								dragend: ( e ) => {
									const pos = e.target.getLatLng();
									m.confirmPosition( pos.lat, pos.lng );
								},
							} }
						/>
					</MapContainer>
				</div>
			</BaseControl>
		</>
	);
}
