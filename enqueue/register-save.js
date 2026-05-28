( function () {
	if ( typeof wp === 'undefined' || ! wp.data ) {
		return;
	}

	var dispatch = wp.data.dispatch;
	var select = wp.data.select;
	var subscribe = wp.data.subscribe;

	var wasSaving = false;

	subscribe( function () {
		var isSaving = select( 'core/editor' ).isSavingPost();
		var isAutosaving = select( 'core/editor' ).isAutosavingPost();

		if ( wasSaving && ! isSaving && ! isAutosaving ) {
			wp.hooks.doAction( 'defineBlocks.afterSavePost' );
		}

		wasSaving = isSaving && ! isAutosaving;
	} );
} )();
