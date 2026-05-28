import { TabPanel, BaseControl } from '@wordpress/components';
import FieldsRenderer from '../Renderer';

export default function TabPanels( { field } ) {
	const tabsRaw = field.tabs ? Object.values( field.tabs ) : [];
	if ( ! tabsRaw.length ) {
		return null;
	}

	const tabs = tabsRaw.map( ( tab ) => ( {
		name: tab.name,
		title: tab.title,
		fields: tab.fields,
	} ) );

	const tabDefs = tabs.map( ( { name, title } ) => ( { name, title } ) );

	const content = (
		<TabPanel tabs={ tabDefs }>
			{ ( tab ) => {
				const activeTab = tabs.find( ( t ) => t.name === tab.name );
				if ( ! activeTab || ! activeTab.fields ) {
					return null;
				}
				return <FieldsRenderer fields={ activeTab.fields } />;
			} }
		</TabPanel>
	);

	if ( field.label ) {
		return (
			<BaseControl label={ field.label }>
				{ content }
			</BaseControl>
		);
	}

	return content;
}
