Objective:
Your task is to execute a comprehensive redesign and feature enhancement of the React-based "Book Collection" application. This involves refactoring key components for reusability, redesigning the main page layout, and implementing an advanced, interactive filtering system.

Guiding Principles:

Component Reusability (DRY): Refactor components to be generic and reusable wherever possible.

Separation of Concerns: Clearly separate filtering controls from sorting and results information.

Interactive UI: Create a more dynamic and intuitive user experience where user actions have clear, immediate feedback.

Design System: You must use the predefined SCSS variables from the _variables.scss file for all styling (colors, fonts, spacing, etc.). Do not use hardcoded values.

Part 1: Refactor the StarRating Component for Reusability
Before implementing new features, the existing StarRating component must be refactored into a generic, controlled component.

Define Props: The StarRating component must accept the following props:

rating: A number representing the current number of selected stars.

onRatingChange: A callback function (newRating: number) => void that is triggered when a user clicks a star.

readOnly (Optional): A boolean to make the component display-only.

Logic: The component's visual state (how many stars are filled) must be driven entirely by the rating prop. Its onClick handler should simply call the onRatingChange function. It should not contain its own internal state for the rating value.

Part 2: Redesign the BookCard Component
Refactor the BookCard component to be cleaner and more focused, using the simplified data requirements.

Data Requirements: Update the component's props to only accept title, author, rating, genres, publishedDate, and imageUrl. Remove all logic related to isbn and addedDate.

Layout: Implement a two-column layout using display: flex.

Left Column (.book-card__cover): A fixed-width container (120px) for the book cover image.

Right Column (.book-card__content): A flex container set to flex-direction: column that grows to fill the remaining space.

Content Styling:

Primary Info: title, author, and rating should be grouped at the top of the content block. The title should be the most prominent element ($font-size-lg, $font-weight-bold).

Genre Tags: The genres should be displayed in a flex container that allows tags to wrap to multiple lines. This tag container must be limited to a max-height equivalent to two rows to prevent inconsistent card heights.

Published Date: This element must be pushed to the bottom-right of the content block (use margin-top: auto and text-align: right).

Interactivity (Action Buttons):

The "Edit" and "Delete" buttons should be contained in a .book-card__actions wrapper.

This wrapper must be positioned absolutely in the top-right corner of the card.

It must be hidden by default (opacity: 0) and fade in (opacity: 1) only when the user hovers over the .book-card.

Interactivity (Genre Pills): The genre pills on the card are now interactive. See Part 4 for details.

Part 3: Redesign the Main Page Layout & Filters
Re-architect the top of the book collection page to be more intuitive.

Separate UI Containers:

Create a .filter-bar container. This will hold all controls that filter the book list (Search, Stars, Genres). Style it with a padding and border-bottom.

Create a .results-bar container below it. This will hold the results count (X books found) and any future sorting controls. Use display: flex and justify-content: space-between.

Implement the StarRatingFilter:

Inside the .filter-bar, create this new component.

Use the refactored StarRating component from Part 1.

Clicking a star (e.g., the 4th star) should filter the book list to show books with a rating of 4 or higher.

Include a "Clear" or "x" button to reset the rating filter to 0.

Add Open Library Attribution:

Add a simple, unobtrusive footer to the application's main layout.

It must contain the text "Book data provided by Open Library", with a hyperlink.

Style it with a small font ($font-size-xs) and secondary text color ($text-secondary).

Part 4: Implement the Two-Way Genre Filtering System
This is a key interactive feature connecting the filter bar and the book cards.

Shared State: Create a shared state mechanism (e.g., using React Context or lifting state) to hold an array of the currently active genre filters (e.g., activeGenres: string[]).

Create the GenreFilter Component:

Place this component inside the .filter-bar.

It must fetch all unique genres from the book collection and render each one as a selectable pill button.

Clicking a pill in this component adds or removes the genre from the shared activeGenres state.

The visual style of the pills must reflect whether they are in the activeGenres array (e.g., border-color: $accent-primary).

Update the BookCard Genre Pills:

The genre pills rendered on each BookCard must now also be interactive buttons.

Clicking a genre pill on a card performs the exact same action: it adds or removes that genre from the shared activeGenres state.

The visual style of the card pills must also reflect the shared activeGenres state, making them appear "active" if their corresponding filter is on.

Filtering Logic: The main book list must be filtered based on the contents of the activeGenres array. If the array is not empty, only show books that contain at least one of the selected genres.