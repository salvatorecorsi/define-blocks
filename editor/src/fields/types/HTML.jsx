export default function HTML( { field } ) {
	const raw = field.content;

	if ( ! raw ) {
		return null;
	}

	const markup = Array.isArray( raw ) ? raw.join( '' ) : raw;

	return (
		<div
			className="defb-field-html"
			dangerouslySetInnerHTML={ { __html: markup } }
		/>
	);
}
