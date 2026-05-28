export function setupRuntime() {
	if ( window.DefineBlocks ) {
		return;
	}

	window.DefineBlocks = {
		Registry: {},
		Instances: {},
		Extensions: {},
		Shared: {},
	};
}
