import { ToolbarDropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';

export default function ToolbarDropdown( { name, field, value, onChange } ) {
	const options = field.options || [];

	return (
		<ToolbarDropdownMenu
			icon={ field.icon || 'arrow-down-alt2' }
			label={ field.label }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					{ options.map( ( opt ) => (
						<MenuItem
							key={ opt.value }
							icon={ opt.value === value ? 'yes' : undefined }
							isSelected={ opt.value === value }
							onClick={ () => {
								onChange( opt.value );
								onClose();
							} }
						>
							{ opt.label }
						</MenuItem>
					) ) }
				</MenuGroup>
			) }
		</ToolbarDropdownMenu>
	);
}
