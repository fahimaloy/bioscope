/**
 * The public surface of `@/components/ui`, in declaration order.
 *
 * Fifty-eight files import from this barrel, so its export names are
 * load-bearing: renaming or dropping one is a breaking change no single
 * consumer can see. `tests/unit/components/primitives.test.tsx` asserts the
 * barrel's runtime keys against this list, so the API surface cannot drift
 * silently.
 */
export const UI_PRIMITIVE_EXPORTS = [
  'UI_PRIMITIVE_EXPORTS',
  'Button',
  'Card',
  'CardHeader',
  'CardTitle',
  'CardDescription',
  'CardContent',
  'CardFooter',
  'CardIcon',
  'Input',
  'Textarea',
  'Select',
  'Badge',
  'StatusBadge',
  'PaymentStatusBadge',
  'Checkbox',
  'Modal',
  'ConfirmModal',
  'Dropdown',
  'MultiSelectDropdown',
  'Tabs',
  'TabsList',
  'TabsTrigger',
  'TabsContent',
  'Tooltip',
  'Accordion',
  'AccordionItem',
  'AccordionTrigger',
  'AccordionContent',
  'Slider',
  'ColorPicker',
  'ImageUpload',
  'DataTable',
  'Pagination',
  'Skeleton',
  'SkeletonText',
  'SkeletonCard',
  'SkeletonTable',
  'SkeletonProductCard',
  'SkeletonOrderCard',
  'ErrorBoundary',
  'ErrorBoundaryFallback',
  'GlobalLoading',
  'SkeletonProductGrid',
  'SkeletonForm',
] as const;

export type UiPrimitiveExport = (typeof UI_PRIMITIVE_EXPORTS)[number];

export { Button } from './Button';
export type { ButtonProps } from './Button';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardIcon,
} from './Card';
export type { CardProps } from './Card';

export { Input, Textarea, Select } from './Input';
export type { InputProps, TextareaProps, SelectProps } from './Input';

export { Badge, StatusBadge, PaymentStatusBadge } from './Badge';
export type { BadgeProps } from './Badge';

export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export { Modal, ConfirmModal } from './Modal';

export { Dropdown, MultiSelectDropdown } from './Dropdown';

export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';

export { Tooltip } from './Tooltip';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion';

export { Slider } from './Slider';
export { ColorPicker } from './ColorPicker';
export { ImageUpload } from './ImageUpload';

export { DataTable } from './DataTable';
export type { Column } from './DataTable';

export { Pagination } from './Pagination';

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonProductCard,
  SkeletonOrderCard,
} from './Skeleton';

export { ErrorBoundary, ErrorBoundaryFallback } from './ErrorBoundary';

// `GlobalLoading.tsx` also defines `SkeletonProductCard`/`SkeletonTable`; the
// `./Skeleton` versions win above, so only the unique names are re-exported.
export { GlobalLoading, SkeletonProductGrid, SkeletonForm } from './GlobalLoading';
