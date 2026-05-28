import TextInput from './types/TextInput';
import Textarea from './types/Textarea';
import RichText from './types/RichText';
import Select from './types/Select';
import Checkbox from './types/Checkbox';
import Color from './types/Color';
import Range from './types/Range';
import Media from './types/Media';
import Hidden from './types/Hidden';
import Title from './types/Title';
import Value from './types/Value';
import Group from './types/Group';
import InnerBlocksField from './types/InnerBlocksField';
import Video from './types/Video';
import Url from './types/Url';
import Link from './types/Link';
import Time from './types/Time';
import TabPanels from './types/TabPanels';
import File from './types/File';
import Gallery from './types/Gallery';
import Autocomplete from './types/Autocomplete';
import MultiAutocomplete from './types/MultiAutocomplete';
import Chips from './types/Chips';
import PostSelector from './types/PostSelector';
import Taxonomy from './types/Taxonomy';
import Repeater from './types/Repeater';
import GoogleMap from './types/GoogleMap';
import OsmMap from './types/OsmMap';
import ToolbarToggle from './types/ToolbarToggle';
import ToolbarSelect from './types/ToolbarSelect';
import ToolbarDropdown from './types/ToolbarDropdown';
import ToolbarInput from './types/ToolbarInput';
import ToolbarAutocomplete from './types/ToolbarAutocomplete';

const FIELD_COMPONENTS = {
	text: TextInput,
	'text-with-parser': TextInput,
	textarea: Textarea,
	richtext: RichText,
	select: Select,
	'multi-select': MultiAutocomplete,
	autocomplete: Autocomplete,
	'multi-autocomplete': MultiAutocomplete,
	checkbox: Checkbox,
	color: Color,
	range: Range,
	url: Url,
	link: Link,
	media: Media,
	file: File,
	gallery: Gallery,
	video: Video,
	hidden: Hidden,
	title: Title,
	value: Value,
	group: Group,
	innerblocks: InnerBlocksField,
	time: Time,
	date: Time,
	datetime: Time,
	chips: Chips,
	repeater: Repeater,
	tabpanels: TabPanels,
	'post-selector': PostSelector,
	taxonomy: Taxonomy,
	'google-map': GoogleMap,
	'osm-map': OsmMap,
	'toolbar-toggle': ToolbarToggle,
	'toolbar-select': ToolbarSelect,
	'toolbar-dropdown': ToolbarDropdown,
	'toolbar-input': ToolbarInput,
	'toolbar-autocomplete': ToolbarAutocomplete,
};

export function getFieldComponent( type ) {
	if ( window.DefineBlocks?.Extensions?.[ type ] ) {
		return window.DefineBlocks.Extensions[ type ];
	}
	return FIELD_COMPONENTS[ type ] || TextInput;
}
