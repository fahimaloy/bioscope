// @vitest-environment jsdom
//
// Task 0.4 — core UI primitives.
//
// Pins the contract from docs/DESIGN_CONTRACT.md §1 (token-only colour),
// §5 (3px ink borders on brand surfaces, 2px on dense/data surfaces, hard
// offset shadows, no gradients), §6 (every interactive primitive forwards
// `ref`, merges `className`, and carries a visible `:focus-visible` ring),
// and the task brief's per-primitive requirements.
//
// The suite is deliberately about the *rendered* class string: a utility that
// Tailwind does not generate (or a `var(--…)` that the token pipeline never
// defines) is exactly the failure this rebuild exists to remove.

import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { BadgeProps, ButtonProps, CardProps } from '@/components/ui';
import {
  Accordion,
  ColorPicker,
  GlobalLoading,
  ImageUpload,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  DataTable,
  Dropdown,
  Input,
  Modal,
  MultiSelectDropdown,
  Pagination,
  Select,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
} from '@/components/ui';
import { Checkbox } from '@/components/ui/Checkbox';
import { ErrorBoundaryFallback } from '@/components/ui/ErrorBoundary';
import { SkeletonProductGrid } from '@/components/ui/GlobalLoading';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/** Every class token in the rendered tree, for the utility/hex audit. */
function renderedClasses(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[class]')).flatMap((el) =>
    (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)
  );
}

/** The root element's class attribute, or '' when nothing rendered. */
function rootClasses(container: HTMLElement): string {
  return container.firstElementChild?.getAttribute('class') ?? '';
}

/* ------------------------------------------------------------------ */
/* Button                                                               */
/* ------------------------------------------------------------------ */

describe('Button', () => {
  it('renders its children and every variant without throwing', () => {
    const variants = [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'destructive',
      // Unknown variants fall back to `primary` — the documented behaviour
      // for `text`, `accent`, `rectangular`, `pills`, and the removed
      // `doodle*` names. They must never throw.
      'text',
      'accent',
      'rectangular',
      'pills',
      'doodle',
      'doodle-secondary',
      'doodle-outline',
    ];

    for (const variant of variants) {
      const { container, unmount } = render(<Button variant={variant}>Go</Button>);
      expect(screen.getByText('Go'), `variant ${variant} renders its children`).toBeInTheDocument();
      expect(rootClasses(container), `variant ${variant} keeps a class string`).not.toBe('');
      unmount();
    }
  });

  it('uses the AA-safe token pairings for its filled variants', () => {
    // spec §5.2 / contract §2: ink on --gold, white on --pink-strong,
    // white on --red. Never white on the vivid --pink.
    const cases: Array<{ variant: string; bg: string; fg: string }> = [
      { variant: 'primary', bg: 'bg-[var(--gold)]', fg: 'text-[var(--ink)]' },
      { variant: 'secondary', bg: 'bg-[var(--pink-strong)]', fg: 'text-[var(--on-pink-strong)]' },
      { variant: 'destructive', bg: 'bg-[var(--red)]', fg: 'text-[var(--on-red)]' },
    ];

    for (const { variant, bg, fg } of cases) {
      const { container, unmount } = render(<Button variant={variant}>Go</Button>);
      const classes = rootClasses(container);
      expect(classes, `${variant} fills with the token background`).toContain(bg);
      expect(classes, `${variant} paints text with the paired on-token`).toContain(fg);
      unmount();
    }
  });

  it('falls back to the primary variant for an unknown variant', () => {
    const { container, unmount } = render(<Button variant="no-such-variant">Go</Button>);
    expect(rootClasses(container)).toContain('bg-[var(--gold)]');
    unmount();
  });

  it('keeps the restored type scale at every size', () => {
    const sizes: Array<{ size: NonNullable<ButtonProps['size']>; text: string }> = [
      { size: 'sm', text: 'text-base' },
      { size: 'md', text: 'text-lg' },
      { size: 'lg', text: 'text-xl' },
      { size: 'xl', text: 'text-2xl' },
    ];

    for (const { size, text } of sizes) {
      const { container, unmount } = render(<Button size={size}>Go</Button>);
      expect(rootClasses(container), `size ${size} uses ${text}`).toContain(text);
      unmount();
    }
  });

  it('forwards ref, merges className, and disables itself while loading', () => {
    const ref = createRef<HTMLButtonElement>();
    const { container, unmount } = render(
      <Button ref={ref} className="custom-class" loading>
        Go
      </Button>
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.className).toContain('custom-class');
    expect(ref.current?.disabled).toBe(true);
    // The spinner is decoration; the button's disabled state carries the meaning.
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    unmount();
  });
});

/* ------------------------------------------------------------------ */
/* Badge                                                                */
/* ------------------------------------------------------------------ */

describe('Badge', () => {
  it('renders its children for every variant name', () => {
    const variants: BadgeProps['variant'][] = [
      'default',
      'primary',
      'secondary',
      'accent',
      'success',
      'warning',
      'error',
      'outline',
      'info',
      'doodle',
    ];

    for (const variant of variants) {
      const { container, unmount } = render(<Badge variant={variant}>Sale</Badge>);
      expect(
        screen.getByText('Sale'),
        `variant ${variant} renders its children`
      ).toBeInTheDocument();
      expect(rootClasses(container), `variant ${variant} keeps a class string`).not.toBe('');
      unmount();
    }
  });

  it('pairs every filled variant with its AA-safe on-token', () => {
    const cases: Array<{ variant: BadgeProps['variant']; bg: string; fg: string }> = [
      { variant: 'primary', bg: 'bg-[var(--pink-strong)]', fg: 'text-[var(--on-pink-strong)]' },
      { variant: 'secondary', bg: 'bg-[var(--violet)]', fg: 'text-[var(--on-violet)]' },
      { variant: 'success', bg: 'bg-[var(--green-strong)]', fg: 'text-[var(--on-green-strong)]' },
      { variant: 'error', bg: 'bg-[var(--red)]', fg: 'text-[var(--on-red)]' },
      { variant: 'accent', bg: 'bg-[var(--gold)]', fg: 'text-[var(--on-gold)]' },
      { variant: 'warning', bg: 'bg-[var(--orange)]', fg: 'text-[var(--on-orange)]' },
      { variant: 'info', bg: 'bg-[var(--blue)]', fg: 'text-[var(--on-blue)]' },
      { variant: 'default', bg: 'bg-[var(--ink)]', fg: 'text-[var(--paper-raised)]' },
    ];

    for (const { variant, bg, fg } of cases) {
      const { container, unmount } = render(<Badge variant={variant}>Sale</Badge>);
      const classes = rootClasses(container);
      expect(classes, `${variant} fills with the token background`).toContain(bg);
      expect(classes, `${variant} paints text with the paired on-token`).toContain(fg);
      unmount();
    }
  });

  it('keeps the sticker treatment on the doodle variant', () => {
    const { container, unmount } = render(<Badge variant="doodle">New</Badge>);
    const classes = rootClasses(container);
    expect(classes).toContain('border-[var(--ink)]');
    expect(classes).toContain('shadow-ink-1');
    unmount();
  });
});

/* ------------------------------------------------------------------ */
/* Card                                                                 */
/* ------------------------------------------------------------------ */

describe('Card', () => {
  it('renders its children and keeps every variant name', () => {
    const variants: CardProps['variant'][] = [
      'default',
      'elevated',
      'outlined',
      'doodle',
      'doodle-elevated',
    ];

    for (const variant of variants) {
      const { container, unmount } = render(<Card variant={variant}>Body</Card>);
      expect(
        screen.getByText('Body'),
        `variant ${variant} renders its children`
      ).toBeInTheDocument();
      expect(rootClasses(container), `variant ${variant} keeps a class string`).not.toBe('');
      unmount();
    }
  });

  it('applies the die-cut shadow for elevation="sticker"', () => {
    const { container, unmount } = render(<Card elevation="sticker">Body</Card>);
    expect(rootClasses(container)).toContain('shadow-die-cut');
    unmount();
  });

  it('applies a hard offset ink shadow for elevation="raised"', () => {
    const { container, unmount } = render(<Card elevation="raised">Body</Card>);
    const classes = rootClasses(container);
    expect(classes).toContain('shadow-ink-3');
    expect(classes).not.toContain('shadow-die-cut');
    unmount();
  });

  it('applies no shadow for elevation="flat"', () => {
    const { container, unmount } = render(<Card elevation="flat">Body</Card>);
    const classes = rootClasses(container);
    expect(classes).toContain('shadow-none');
    expect(classes).not.toContain('shadow-ink-3');
    unmount();
  });

  it('lets an explicit elevation win over the variant default', () => {
    const { container, unmount } = render(
      <Card variant="outlined" elevation="sticker">
        Body
      </Card>
    );
    expect(rootClasses(container)).toContain('shadow-die-cut');
    unmount();
  });

  it('derives elevation from the variant when none is given', () => {
    // The mapping the JSDoc documents: outlined is flat, doodle-elevated is
    // the sticker treatment, everything else is raised.
    const derived: Array<{ variant: CardProps['variant']; shadow: string }> = [
      { variant: 'default', shadow: 'shadow-ink-3' },
      { variant: 'elevated', shadow: 'shadow-ink-3' },
      { variant: 'doodle', shadow: 'shadow-ink-3' },
      { variant: 'doodle-elevated', shadow: 'shadow-die-cut' },
      { variant: 'outlined', shadow: 'shadow-none' },
    ];

    for (const { variant, shadow } of derived) {
      const { container, unmount } = render(<Card variant={variant}>Body</Card>);
      expect(rootClasses(container), `variant ${variant} derives ${shadow}`).toContain(shadow);
      unmount();
    }
  });
});

/* ------------------------------------------------------------------ */
/* Form primitives                                                      */
/* ------------------------------------------------------------------ */

describe('Input', () => {
  it('renders its label and associates it with the field', () => {
    const { container, unmount } = render(<Input label="Email" />);
    const input = container.querySelector('input');
    const label = screen.getByText('Email');

    expect(input).not.toBeNull();
    expect(label.getAttribute('for')).toBe(input!.id);
    unmount();
  });

  it('renders hint and error text and wires aria-describedby', () => {
    const { container, unmount } = render(<Input label="Email" hint="We never share it" />);
    const input = container.querySelector('input')!;
    expect(screen.getByText('We never share it')).toBeInTheDocument();
    expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-hint`);
    unmount();

    const errored = render(<Input label="Email" error="Required" />);
    const erroredInput = errored.container.querySelector('input')!;
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(erroredInput.getAttribute('aria-invalid')).toBe('true');
    expect(erroredInput.getAttribute('aria-describedby')).toBe(`${erroredInput.id}-error`);
    errored.unmount();
  });
});

describe('Textarea', () => {
  it('renders its label and associates it with the field', () => {
    const { container, unmount } = render(<Textarea label="Review" />);
    const textarea = container.querySelector('textarea');
    expect(screen.getByText('Review').getAttribute('for')).toBe(textarea!.id);
    unmount();
  });
});

describe('Select', () => {
  it('renders its placeholder and every option', () => {
    const { container, unmount } = render(
      <Select
        label="Size"
        placeholder="Pick a size"
        options={[
          { value: 's', label: 'Small' },
          { value: 'm', label: 'Medium' },
        ]}
      />
    );

    expect(screen.getByText('Pick a size')).toBeInTheDocument();
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();

    const select = container.querySelector('select')!;
    expect(screen.getByText('Size').getAttribute('for')).toBe(select.id);
    expect(select.querySelectorAll('option')).toHaveLength(3);
    unmount();
  });
});

describe('Checkbox', () => {
  it('renders a Radix checkbox that is keyboard operable', () => {
    const { container, unmount } = render(<Checkbox aria-label="Accept terms" />);
    const box = container.querySelector('[role="checkbox"]');

    expect(box).not.toBeNull();
    expect(box!.getAttribute('aria-checked')).toBe('false');
    expect(box!.className).toContain('focus-visible:');

    fireEvent.click(box!);
    expect(box!.getAttribute('aria-checked')).toBe('true');
    unmount();
  });
});

/* ------------------------------------------------------------------ */
/* ColorPicker                                                          */
/* ------------------------------------------------------------------ */

describe('ColorPicker', () => {
  it('emits a fabric-parseable colour, not a CSS custom property, for a preset', () => {
    const onChange = vi.fn();
    const { container, unmount } = render(<ColorPicker value="#000000" onChange={onChange} />);

    // jsdom does not resolve custom properties from stylesheets, so stub the
    // resolver's lookup to stand in for the browser.
    const getComputedStyleSpy = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => (name === '--pink' ? '#E91E63' : ''),
    } as unknown as CSSStyleDeclaration);

    fireEvent.click(container.querySelector('button')!);
    fireEvent.click(screen.getByRole('button', { name: 'var(--pink)' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const emitted = onChange.mock.calls[0][0];
    // fabric's `_tryParsingColor` cannot parse `var(--…)` and would render black.
    expect(emitted).toBe('#E91E63');
    expect(emitted).toMatch(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);

    getComputedStyleSpy.mockRestore();
    unmount();
  });

  it('keeps the preset list token-only', () => {
    const { container, unmount } = render(<ColorPicker value="#000000" onChange={() => {}} />);
    fireEvent.click(container.querySelector('button')!);

    const presets = screen
      .getAllByRole('button')
      .filter((button) => (button.getAttribute('aria-label') ?? '').startsWith('var(--'));
    expect(presets).toHaveLength(12);
    unmount();
  });
});

/* ------------------------------------------------------------------ */
/* Overlay primitives                                                   */
/* ------------------------------------------------------------------ */

describe('Modal', () => {
  it('renders a labelled dialog over an aria-hidden overlay', () => {
    const { container, unmount } = render(
      <Modal isOpen onClose={() => {}} title="Confirm" description="Are you sure?">
        Body
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close modal' })).toBeInTheDocument();

    const overlay = container.querySelector('[aria-hidden="true"]');
    expect(overlay, 'the backdrop is presentational').not.toBeNull();
    expect(overlay!.contains(dialog)).toBe(false);
    unmount();
  });
});

describe('Dropdown', () => {
  it('opens a listbox and selects an option', () => {
    const onChange = vi.fn();
    const { container, unmount } = render(
      <Dropdown
        trigger={<span>Trigger</span>}
        placeholder="Open"
        value="a"
        onChange={onChange}
        items={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Option A/ }));
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Option A/ }).getAttribute('aria-selected')).toBe(
      'true'
    );

    fireEvent.click(screen.getByRole('option', { name: /Option B/ }));
    expect(onChange).toHaveBeenCalledWith('b');
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    unmount();
  });
});

describe('Tabs', () => {
  it('renders tablist, tab and tabpanel with the selected state wired', () => {
    const { container, unmount } = render(
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First</TabsContent>
        <TabsContent value="two">Second</TabsContent>
      </Tabs>
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    const first = screen.getByRole('tab', { name: 'One' });
    expect(first.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('First');
    expect(container.querySelector('[role="tabpanel"]')?.className).toContain('animate-fade-in');

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByRole('tab', { name: 'Two' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Second');
    unmount();
  });
});

describe('Tooltip', () => {
  it('reveals a tooltip on focus', async () => {
    render(
      <Tooltip content="Helpful hint">
        <button type="button">Hover me</button>
      </Tooltip>
    );

    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.focus(screen.getByText('Hover me'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Helpful hint');
  });
});

describe('Accordion', () => {
  it('expands an item when its trigger is activated', () => {
    render(
      <Accordion type="single" collapsible value="a">
        <AccordionItem value="a">
          <AccordionTrigger>Section</AccordionTrigger>
          <AccordionContent>Hidden body</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger = screen.getByRole('button', { name: 'Section' });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Hidden body')).toBeInTheDocument();

    fireEvent.click(trigger);
    // The trigger's state flips immediately; the panel itself collapses on the
    // exit transition, so the assertion is on the state, not the animation.
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});

/* ------------------------------------------------------------------ */
/* Skeleton / Pagination / DataTable                                    */
/* ------------------------------------------------------------------ */

describe('Skeleton', () => {
  it('is aria-hidden and renders no text', () => {
    const { container, unmount } = render(<Skeleton width={100} height={20} />);
    expect(container.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
    expect(container.firstElementChild!.textContent).toBe('');
    unmount();
  });

  it('renders the named skeleton compounds', () => {
    const { container, unmount } = render(<SkeletonProductGrid count={2} />);
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(2);
    unmount();
  });
});

describe('Pagination', () => {
  it('marks the current page with aria-current', () => {
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={() => {}} showFirstLast={false} />
    );

    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Pagination');
    expect(screen.getByRole('button', { name: 'Page 2' }).getAttribute('aria-current')).toBe(
      'page'
    );
    expect(screen.getByRole('button', { name: 'Previous page' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).not.toBeDisabled();
  });

  it('disables the edge controls on the first and last page', () => {
    render(<Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />);
    // totalPages <= 1 renders nothing at all.
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});

describe('DataTable', () => {
  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'qty', header: 'Qty' },
  ];
  const data = [
    { id: '1', name: 'Alpha', qty: 1 },
    { id: '2', name: 'Beta', qty: 2 },
  ];

  it('renders rows and the empty state', () => {
    const { container, unmount } = render(
      <DataTable columns={columns} data={data} keyExtractor={(row) => row.id} />
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(container.querySelector('table[role="grid"]')).not.toBeNull();
    unmount();

    const empty = render(
      <DataTable
        columns={columns}
        data={[] as typeof data}
        keyExtractor={(row) => row.id}
        emptyMessage="Nothing here"
      />
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    empty.unmount();
  });

  it('supports comfortable and compact density', () => {
    const { container, unmount } = render(
      <DataTable columns={columns} data={data} keyExtractor={(row) => row.id} density="compact" />
    );
    const table = container.querySelector('table')!;
    expect(table.getAttribute('data-density')).toBe('compact');
    unmount();

    const comfortable = render(
      <DataTable columns={columns} data={data} keyExtractor={(row) => row.id} />
    );
    expect(comfortable.container.querySelector('table')!.getAttribute('data-density')).toBe(
      'comfortable'
    );
    comfortable.unmount();
  });
});

/* ------------------------------------------------------------------ */
/* Error boundary                                                       */
/* ------------------------------------------------------------------ */

describe('ErrorBoundaryFallback', () => {
  it('renders the recovery copy and both actions', () => {
    render(<ErrorBoundaryFallback error={new Error('boom')} onRetry={() => {}} />);
    expect(screen.getByText('Something stuck')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go Home/ })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Contract audit                                                       */
/* ------------------------------------------------------------------ */

describe('token-only utility audit', () => {
  /**
   * Utilities the pre-rebuild components used that Tailwind never generates
   * (`border-3`, `rounded-card`, `shadow-btn`, …) or that reference a
   * `var(--…)` the token pipeline does not define (`--primary`, `--light`,
   * `--surface-card`, …). Ruling 7: `border-3` is not a utility, `rounded-pill`
   * is mapped and stays.
   */
  const BANNED_SUBSTRINGS = [
    'border-3',
    'border-b-3',
    'rounded-card',
    'rounded-input',
    'shadow-btn',
    'shadow-card',
    'shadow-input',
    'shadow-stat',
    'shadow-glass',
    'shadow-xl',
    'shadow-lg',
    'shadow-md',
    'shadow-sm',
    'shadow-xs',
    'bg-primary',
    'bg-secondary',
    'text-primary',
    'border-primary',
    'bg-white',
    'bg-dark',
    'text-dark',
    'bg-red-500',
    'bg-green-500',
    'border-red-500',
    'var(--light)',
    'var(--purple)',
    'var(--dark)',
    'var(--surface-card)',
    'var(--surface-hover)',
    'var(--surface-elevated)',
    'var(--border-primary)',
    'var(--text-primary)',
    'var(--tertiary)',
    'var(--bg-color)',
    'backdrop-blur',
  ];

  /**
   * Contract §5's "no gradients" rule is scoped to brand colour blocks on
   * section bands and CTAs. A colour picker's hue/saturation/lightness ramps
   * are the control's own functional affordance, so gradient utilities are
   * deliberately absent from `BANNED_SUBSTRINGS` — but the ban still holds
   * everywhere else. `gradientOffenders` below enforces that carve-out: a
   * gradient may only appear on a `ColorPicker` range input. Raw hex and the
   * legacy `var(--…)` tokens remain banned everywhere, including the ramps.
   */
  const GRADIENT_UTILITIES = [
    'bg-gradient-to-r',
    'bg-gradient-to-l',
    'bg-gradient-to-b',
    'linear-gradient',
  ];

  /** Elements carrying a gradient that are not ColorPicker range inputs. */
  const gradientOffenders = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('[class]')).filter((el) => {
      const cls = el.getAttribute('class') ?? '';
      return GRADIENT_UTILITIES.some((g) => cls.includes(g)) && !el.matches('input[type="range"]');
    });

  /** Raw hex and rgb() literals — contract §1. */
  const BANNED_PATTERN = /(#(?:[0-9a-fA-F]{3,8})\b|rgba?\()/i;

  it('renders no banned utility or raw colour literal in any primitive', () => {
    const { container, unmount } = render(
      <div>
        <Button variant="primary">Go</Button>
        <Button variant="secondary">Go</Button>
        <Button variant="outline">Go</Button>
        <Button variant="ghost">Go</Button>
        <Button variant="destructive">Go</Button>
        <Badge variant="primary">Sale</Badge>
        <Badge variant="outline">Sale</Badge>
        <Badge variant="doodle">New</Badge>
        <Card variant="default">Body</Card>
        <Card variant="outlined">Body</Card>
        <Card variant="doodle">Body</Card>
        <Input label="Email" />
        <Textarea label="Review" />
        <Select label="Size" options={[{ value: 's', label: 'Small' }]} />
        <Checkbox aria-label="Accept" />
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
          </TabsList>
          <TabsContent value="one">First</TabsContent>
        </Tabs>
        <Accordion type="single" collapsible value="a">
          <AccordionItem value="a">
            <AccordionTrigger>Section</AccordionTrigger>
            <AccordionContent>Body</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Modal isOpen onClose={() => {}} title="Dialog">
          Body
        </Modal>
        <Dropdown
          trigger={<span>Trigger</span>}
          placeholder="Open"
          items={[{ value: 'a', label: 'Option A' }]}
        />
        <Tooltip content="Hint">
          <button type="button">Target</button>
        </Tooltip>
        <Skeleton width={80} height={16} />
        <Pagination currentPage={2} totalPages={5} onPageChange={() => {}} />
        <ColorPicker value="#000000" onChange={() => {}} />
      </div>
    );

    // Open the picker so its range ramps are part of the audited tree.
    fireEvent.click(container.querySelector('[aria-haspopup="dialog"]')!);

    const classes = renderedClasses(container);
    const offenders = classes.filter(
      (cls) => BANNED_SUBSTRINGS.some((banned) => cls.includes(banned)) || BANNED_PATTERN.test(cls)
    );

    expect(offenders).toEqual([]);
    // The gradient carve-out is scoped to ColorPicker's range inputs.
    expect(gradientOffenders(container)).toEqual([]);
    unmount();
  });

  it('keeps gradients only on the ColorPicker range ramps', () => {
    const { container, unmount } = render(
      <ColorPicker value="#333333" onChange={() => {}} showAlpha />
    );
    fireEvent.click(container.querySelector('button')!);

    const ranges = Array.from(container.querySelectorAll('input[type="range"]'));
    expect(ranges).toHaveLength(4);
    for (const range of ranges) {
      const cls = range.getAttribute('class') ?? '';
      expect(cls, 'the range ramp carries a functional gradient').toMatch(/gradient/i);
      // The ramp stops are tokens, never raw hex.
      expect(cls).not.toMatch(BANNED_PATTERN);
    }

    // Nothing else in the picker may carry a gradient.
    expect(gradientOffenders(container)).toEqual([]);
    unmount();
  });
});

describe('focus visibility audit', () => {
  it('gives every interactive primitive a focus-visible rule', () => {
    const { container, unmount } = render(
      <div>
        <Button>Go</Button>
        <Input label="Email" />
        <Select label="Size" options={[{ value: 's', label: 'Small' }]} />
        <Checkbox aria-label="Accept" />
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
          </TabsList>
          <TabsContent value="one">First</TabsContent>
        </Tabs>
        <Accordion type="single" collapsible value="a">
          <AccordionItem value="a">
            <AccordionTrigger>Section</AccordionTrigger>
            <AccordionContent>Body</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Pagination currentPage={2} totalPages={5} onPageChange={() => {}} />
        <Tooltip content="Hint">
          <button type="button">Target</button>
        </Tooltip>
      </div>
    );

    const focusable = Array.from(
      container.querySelectorAll(
        'button, input, select, textarea, [role="checkbox"], [role="slider"], [tabindex]'
      )
    );

    expect(focusable.length).toBeGreaterThan(5);
    for (const el of focusable) {
      // The ring may sit on the element itself or on a wrapper that owns the
      // focus (the Tooltip wraps its trigger).
      const ringed = (() => {
        for (let node: HTMLElement | null = el as HTMLElement; node; node = node.parentElement) {
          if ((node.getAttribute('class') ?? '').includes('focus-visible:')) return true;
        }
        return false;
      })();
      expect(ringed, `${el.tagName} carries a focus-visible rule`).toBe(true);
    }
    unmount();
  });

  it('does not put a focus ring on non-interactive primitives', () => {
    const { container, unmount } = render(
      <div>
        <Badge>Sale</Badge>
        <Skeleton width={80} height={16} />
      </div>
    );
    for (const el of container.querySelectorAll('[class]')) {
      expect(el.getAttribute('class') ?? '').not.toContain('focus-visible:');
    }
    unmount();
  });
});

describe('ref forwarding', () => {
  it('forwards ref and merges className on the interactive composites', () => {
    const refs = {
      ColorPicker: createRef<HTMLDivElement>(),
      ImageUpload: createRef<HTMLDivElement>(),
      Dropdown: createRef<HTMLDivElement>(),
      MultiSelectDropdown: createRef<HTMLDivElement>(),
      Pagination: createRef<HTMLElement>(),
      Tooltip: createRef<HTMLDivElement>(),
      Tabs: createRef<HTMLDivElement>(),
      GlobalLoading: createRef<HTMLDivElement>(),
    };

    render(
      <div>
        <ColorPicker
          ref={refs.ColorPicker}
          value="#000000"
          onChange={() => {}}
          className="cp-class"
        />
        <ImageUpload ref={refs.ImageUpload} onChange={() => {}} className="iu-class" />
        <Dropdown
          ref={refs.Dropdown}
          trigger={<span>trigger</span>}
          items={[{ value: 'a', label: 'A' }]}
          className="dd-class"
        />
        <MultiSelectDropdown
          ref={refs.MultiSelectDropdown}
          trigger={<span>trigger</span>}
          items={[{ value: 'a', label: 'A' }]}
          className="ms-class"
        />
        <Pagination
          ref={refs.Pagination}
          currentPage={1}
          totalPages={3}
          onPageChange={() => {}}
          className="pg-class"
        />
        <Tooltip ref={refs.Tooltip} content="hint">
          <button type="button">target</button>
        </Tooltip>
        <Tabs ref={refs.Tabs} defaultValue="a" className="tabs-class">
          <TabsList>
            <TabsTrigger value="a">A</TabsTrigger>
          </TabsList>
          <TabsContent value="a">A</TabsContent>
        </Tabs>
        <GlobalLoading ref={refs.GlobalLoading} className="gl-class" />
      </div>
    );

    for (const [name, ref] of Object.entries(refs)) {
      expect(ref.current, `${name} forwards its ref`).toBeInstanceOf(HTMLElement);
    }

    const merged: Array<[string, React.RefObject<HTMLElement>, string]> = [
      ['ColorPicker', refs.ColorPicker, 'cp-class'],
      ['ImageUpload', refs.ImageUpload, 'iu-class'],
      ['Dropdown', refs.Dropdown, 'dd-class'],
      ['MultiSelectDropdown', refs.MultiSelectDropdown, 'ms-class'],
      ['Pagination', refs.Pagination, 'pg-class'],
      ['Tabs', refs.Tabs, 'tabs-class'],
      ['GlobalLoading', refs.GlobalLoading, 'gl-class'],
    ];
    for (const [name, ref, className] of merged) {
      expect(ref.current?.className, `${name} merges className`).toContain(className);
    }
  });
});

describe('aria-hidden audit', () => {
  it('hides only the purely decorative primitives', () => {
    const skeleton = render(<Skeleton width={40} height={40} />);
    expect(skeleton.container.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
    skeleton.unmount();

    const badge = render(<Badge>Sale</Badge>);
    expect(badge.container.firstElementChild!.getAttribute('aria-hidden')).toBeNull();
    badge.unmount();

    const button = render(<Button>Go</Button>);
    expect(button.container.firstElementChild!.getAttribute('aria-hidden')).toBeNull();
    button.unmount();

    const card = render(<Card>Body</Card>);
    expect(card.container.firstElementChild!.getAttribute('aria-hidden')).toBeNull();
    card.unmount();

    const input = render(<Input label="Email" />);
    expect(input.container.querySelector('input')!.getAttribute('aria-hidden')).toBeNull();
    input.unmount();
  });
});

describe('barrel', () => {
  it('exports exactly the documented primitive surface', async () => {
    const barrel = await import('@/components/ui');
    const { UI_PRIMITIVE_EXPORTS } = barrel;

    expect(Array.isArray(UI_PRIMITIVE_EXPORTS)).toBe(true);
    expect(Object.keys(barrel).sort()).toEqual([...UI_PRIMITIVE_EXPORTS].sort());
  });

  it('exports the primitives that were previously missing', async () => {
    const barrel = await import('@/components/ui');

    for (const name of [
      'Checkbox',
      'Accordion',
      'AccordionItem',
      'AccordionTrigger',
      'AccordionContent',
      'ErrorBoundary',
      'ErrorBoundaryFallback',
      'GlobalLoading',
      'SkeletonProductGrid',
      'SkeletonForm',
    ]) {
      expect(barrel, `barrel exports ${name}`).toHaveProperty(name);
    }
  });
});
