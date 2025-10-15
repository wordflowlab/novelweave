# Novelweave Change Marking Guidelines

We are a fork of Roo. We regularly merge in the Roo codebase. To enable us to merge more easily, we mark all
our own changes with `novelweave_change` comments.

## Basic Usage

### Single Line Changes

For single line changes, add the comment at the end of the line:

```typescript
let i = 2 // novelweave_change
```

### Multi-line Changes

For multiple consecutive lines, wrap them with start/end comments:

```typescript
// novelweave_change start
let i = 2
let j = 3
// novelweave_change end
```

## Language-Specific Examples

### HTML/JSX/TSX

```html
{/* novelweave_change start */}
<CustomKiloComponent />
{/* novelweave_change end */}
```

### CSS/SCSS

```css
/* novelweave_change */
.novelweave-specific-class {
	color: blue;
}

/* novelweave_change start */
.another-class {
	background: red;
}
/* novelweave_change end */
```

## Special Cases

### Novelweave specific file

- if the filename or directory name contains novelweave no marking with comments is required
- if the file lives inside of the jetbrains/ or cli/ root folder, no marking with comments is required

### New Files

If you're creating a completely new file that doesn't exist in Roo, add this comment at the top:

```
// novelweave_change - new file
```
