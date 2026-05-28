import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { TextControl, Button, BaseControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortablePost( { post, onRemove } ) {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable( {
		id: String( post.id ),
	} );

	const style = {
		transform: CSS.Transform.toString( transform ),
		transition,
	};

	return (
		<div ref={ setNodeRef } style={ style } className="defb-post-selector__item">
			<span
				className="defb-post-selector__drag-handle"
				{ ...attributes }
				{ ...listeners }
			>
				&#x2807;
			</span>
			{ post.thumbnail && (
				<img
					className="defb-post-selector__thumbnail"
					src={ post.thumbnail }
					alt=""
				/>
			) }
			<span className="defb-post-selector__title">{ post.title }</span>
			<Button
				className="defb-post-selector__remove"
				variant="tertiary"
				size="small"
				isDestructive
				onClick={ () => onRemove( post.id ) }
			>
				&times;
			</Button>
		</div>
	);
}

export default function PostSelector( { name, field, value, onChange } ) {
	const [ searchText, setSearchText ] = useState( '' );
	const [ searchResults, setSearchResults ] = useState( [] );
	const [ isSearching, setIsSearching ] = useState( false );
	const debounceRef = useRef( null );
	const containerRef = useRef( null );

	const selectedPosts = value || [];
	const selectedIds = new Set( selectedPosts.map( ( p ) => p.id ) );

	const handleSearch = useCallback(
		( search ) => {
			setSearchText( search );

			if ( debounceRef.current ) {
				clearTimeout( debounceRef.current );
			}

			if ( ! search || search.length < 2 ) {
				setSearchResults( [] );
				setIsSearching( false );
				return;
			}

			setIsSearching( true );

			debounceRef.current = setTimeout( async () => {
				try {
					const results = await apiFetch( {
						path: '/defb/v1/posts/search',
						method: 'POST',
						data: { s: search, post_type: field.postType || 'post' },
					} );
					setSearchResults( results || [] );
				} catch {
					setSearchResults( [] );
				}
				setIsSearching( false );
			}, 400 );
		},
		[ field.postType ]
	);

	const addPost = ( post ) => {
		if ( selectedIds.has( post.id ) ) {
			return;
		}
		onChange( [
			...selectedPosts,
			{
				id: post.id,
				title: post.title,
				permalink: post.permalink,
				thumbnail: post.thumbnail || '',
			},
		] );
		setSearchText( '' );
		setSearchResults( [] );
	};

	const removePost = ( postId ) => {
		onChange( selectedPosts.filter( ( p ) => p.id !== postId ) );
	};

	const handleDragEnd = ( event ) => {
		const { active, over } = event;
		if ( ! over || active.id === over.id ) {
			return;
		}
		const oldIndex = selectedPosts.findIndex( ( p ) => String( p.id ) === active.id );
		const newIndex = selectedPosts.findIndex( ( p ) => String( p.id ) === over.id );
		onChange( arrayMove( selectedPosts, oldIndex, newIndex ) );
	};

	useEffect( () => {
		const handleClickOutside = ( e ) => {
			if ( containerRef.current && ! containerRef.current.contains( e.target ) ) {
				setSearchResults( [] );
			}
		};
		document.addEventListener( 'mousedown', handleClickOutside );
		return () => document.removeEventListener( 'mousedown', handleClickOutside );
	}, [] );

	useEffect( () => {
		return () => {
			if ( debounceRef.current ) {
				clearTimeout( debounceRef.current );
			}
		};
	}, [] );

	const visibleResults = searchResults.filter( ( r ) => ! selectedIds.has( r.id ) );

	return (
		<BaseControl label={ field.label } help={ field.description }>
			<div className="defb-post-selector" ref={ containerRef }>
				<TextControl
					__next40pxDefaultSize
					value={ searchText }
					onChange={ handleSearch }
					placeholder={ field.placeholder || 'Search posts...' }
				/>

				{ visibleResults.length > 0 && (
					<ul className="defb-post-selector__dropdown">
						{ visibleResults.map( ( post ) => (
							<li key={ post.id }>
								<button
									type="button"
									className="defb-post-selector__dropdown-item"
									onClick={ () => addPost( post ) }
								>
									{ post.title }
								</button>
							</li>
						) ) }
					</ul>
				) }

				{ selectedPosts.length > 0 && (
					<div className="defb-post-selector__list">
						<DndContext
							collisionDetection={ closestCenter }
							onDragEnd={ handleDragEnd }
						>
							<SortableContext
								items={ selectedPosts.map( ( p ) => String( p.id ) ) }
								strategy={ verticalListSortingStrategy }
							>
								{ selectedPosts.map( ( post ) => (
									<SortablePost
										key={ post.id }
										post={ post }
										onRemove={ removePost }
									/>
								) ) }
							</SortableContext>
						</DndContext>
					</div>
				) }
			</div>
		</BaseControl>
	);
}
