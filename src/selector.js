export function toLocator(page, descriptor) {
  if (!descriptor || !descriptor.strategy) {
    throw new Error('Step is missing a selector descriptor.');
  }
  switch (descriptor.strategy) {
    case 'role':
      return page.getByRole(descriptor.role, { name: descriptor.name });
    case 'label':
      return page.getByLabel(descriptor.label);
    case 'text':
      return page.getByText(descriptor.text);
    case 'css':
      return page.locator(descriptor.css);
    default:
      throw new Error(`Unknown selector strategy: ${descriptor.strategy}`);
  }
}
