Visual Design Specification
As the Lead UI/UX Designer, I've analyzed the current application state. The foundation is functional, but it lacks the professional polish necessary for a high-quality user experience. This specification outlines a complete visual overhaul. The following instructions are granular and designed for direct implementation.

✅ Task 1: The Modern Dark Mode Color Palette
The current color scheme lacks contrast and feels uninspired. We will replace it with a sophisticated, accessible slate-and-teal palette. This palette is designed for clarity and comfort in a dark environment.

Color Palette Reference
Role	SCSS Variable	Hex Code	Description
Background	$bg-primary	#111827	Main app background. A deep, cool slate.
Surface	$bg-surface	#1F2937	Card backgrounds and modal surfaces.
Border	$border-color	#374151	Subtle borders for inputs and dividers.
Text Primary	$text-primary	#F9FAFB	For main headings and important text.
Text Secondary	$text-secondary	#9CA3AF	For subheadings, labels, and body copy.
Text Disabled	$text-disabled	#4B5563	For disabled states and placeholder text.
Accent Primary	$accent-primary	#14B8A6	Main interactive color (teal) for buttons & links.
Accent Hover	$accent-hover	#0D9488	Hover state for the primary accent color.
Danger	$semantic-danger	#F43F5E	For destructive actions like delete (rose).
Danger Hover	$semantic-danger-hover	#E11D48	Hover state for destructive actions.

Export to Sheets
✅ Task 2: Typography & Spacing System
We will establish a strict system for typography and spacing to create rhythm and visual consistency across the entire application.

Typography
We will use a single, highly-readable font family to keep the UI clean and modern.

Font Family: Inter. It's a versatile sans-serif font designed for user interfaces. It should be imported from a service like Google Fonts.

Base Font Size: 16px

Spacing
All padding, margins, and layout gaps will use an 8pt grid system. This ensures consistent and predictable spacing.

Scale	SCSS Variable	Value
Extra Small	$spacing-xs	4px
Small	$spacing-sm	8px
Medium	$spacing-md	16px
Large	$spacing-lg	24px
Extra Large	$spacing-xl	32px
XXL	$spacing-xxl	48px

Export to Sheets
✅ Task 3: Component Redesign
Here are the detailed instructions for redesigning the core UI components.

The BookCard Component
The current card is cluttered. The redesign focuses on creating a clear hierarchy and better organization.

Before: All text elements compete for attention. Spacing is tight and inconsistent. Buttons are visually jarring.

After:

Layout: Increase the card's internal padding to $spacing-lg (24px).

Visual Hierarchy:

The Book Title is the most prominent element. Use a larger font size (20px) and primary text color ($text-primary).

The Author sits below the title. Use a smaller font size (14px) and secondary text color ($text-secondary).

Group all metadata (Published, ISBN, Added) at the bottom of the card, using the smallest font size (12px) and secondary text color.

Buttons:

Relocate the "Edit" and "Delete" buttons to the bottom right corner.

The "Edit" button will use the secondary button style (see below).

The "Delete" button will use the destructive button style, but rendered as an outline/ghost button by default to reduce its visual weight. It should fill with color on hover.

Tags: Style the tags as pills with more padding ($spacing-xs $spacing-sm), a subtle background ($bg-primary), and a border (1px solid $border-color).

The FilterBar Component
The current filter bar feels disconnected due to its white background.

Before: Jarring white input fields and a generic grey button.

After:

Inputs: Text inputs should have a transparent background, a 1px solid $border-color border, and a subtle inner shadow on focus. The text color should be $text-primary.

Button: The "Clear Filters" button should use the secondary button style for a consistent look.

Global Button Styles
Implement a consistent, reusable button system. All buttons should share base styles: a common padding ($spacing-sm $spacing-md), font size (14px), border-radius (6px), and a transition for smooth hover effects.

Primary Button (.btn-primary):

Used for the main call-to-action ("Add Book").

Background: $accent-primary

Text Color: $bg-primary (for high contrast)

Hover: Background changes to $accent-hover.

Secondary Button (.btn-secondary):

Used for less prominent actions ("Edit", "Clear Filters").

Background: transparent

Text Color: $text-secondary

Border: 1px solid $border-color

Hover: Background changes to $border-color, text color to $text-primary.

Destructive Button (.btn-destructive):

Used for actions that delete data ("Delete").

Background: $semantic-danger

Text Color: $text-primary

Hover: Background changes to $semantic-danger-hover.

✅ Final Deliverable: Actionable SCSS Theme File (_variables.scss)
This file contains all the design tokens defined above. The AI agent should create this file and ensure all components reference these variables instead of hardcoded values.

SCSS

// =====================================
// DESIGN TOKENS: _variables.scss
// =====================================

// 1. COLOR PALETTE
// -------------------------------------
// Backgrounds
$bg-primary: #111827;
$bg-surface: #1F2937;

// Borders
$border-color: #374151;

// Text
$text-primary: #F9FAFB;
$text-secondary: #9CA3AF;
$text-disabled: #4B5563;

// Accent (Primary Interaction Color)
$accent-primary: #14B8A6; // Teal
$accent-hover: #0D9488;

// Semantic Colors
$semantic-danger: #F43F5E; // Rose
$semantic-danger-hover: #E11D48;
// $semantic-success: #22C55E; // Green (for future use)
// $semantic-warning: #F59E0B; // Amber (for future use)


// 2. TYPOGRAPHY
// -------------------------------------
// Font Family
$font-family-sans: 'Inter', sans-serif;

// Base Font Size
$font-size-base: 16px;

// Font Sizes Scale
$font-size-xs: 12px;
$font-size-sm: 14px;
$font-size-md: 16px;
$font-size-lg: 20px;
$font-size-xl: 24px;

// Font Weights
$font-weight-regular: 400;
$font-weight-medium: 500;
$font-weight-bold: 700;


// 3. SPACING
// -------------------------------------
// 8pt Grid System
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-xxl: 48px;


// 4. BORDERS & SHADOWS
// -------------------------------------
$border-radius-sm: 4px;
$border-radius-md: 6px;
$box-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$box-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
