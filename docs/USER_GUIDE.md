# User Guide

## Welcome to Book Library

Book Library is a personal book collection management application that helps you organize, track, and analyze your reading collection. This guide will walk you through all the features and show you how to get the most out of the application.

## Getting Started

### First Time Setup

1. **Access the Application**: Open your web browser and navigate to the application URL
2. **Create an Account**: Click "Sign Up" and provide a username, email, and secure password
3. **Log In**: Enter your credentials to access your personal library

### Your First Book

1. Click the **"Add Book"** button (+ icon) in the top navigation
2. Fill in the book details:
   - **Title**: The book's title
   - **Author**: Author name(s)
   - **Genres**: Select or create genre tags
   - **Published Date**: When the book was published
   - **Rating**: Your rating from 1-5 stars
   - **Edition**: Book edition (optional)
   - **ISBN**: International Standard Book Number (optional)
3. Click **"Save Book"** to add it to your collection

## Core Features

### Book Collection Management

#### Viewing Your Library

The main **Book Collection** page displays all your books in an organized grid layout:

- **Book Cards**: Each book appears as a card showing title, author, genres, and rating
- **Cover Placeholders**: Clean placeholder graphics represent each book
- **Quick Actions**: Edit or delete books directly from the card view
- **Responsive Design**: Layout adapts to your screen size automatically

#### Adding Books

**Method 1: Manual Entry**
1. Click **"Add Book"** button
2. Complete the book form with all available information
3. Use the genre selector to choose existing genres or create new ones
4. Rating system uses 1-5 stars (whole numbers only)
5. Save to add the book to your collection

**Method 2: CSV Import (Bulk)**
1. Go to the Book Collection page
2. If you have existing books: Click **"Export Collection"** to see the CSV format
3. If starting fresh: Click **"Download Import Template"** for a sample file
4. Prepare your CSV file with headers: Title, Author, Genres, PublishedDate, Rating, Edition, ISBN
5. Click the import button (📥) and select your CSV file
6. The system will process the file and report results

#### Editing Books

1. Find the book you want to edit
2. Click the **Edit** button on the book card
3. Modify any fields in the form
4. Click **"Update Book"** to save changes
5. Changes are reflected immediately in your collection

#### Deleting Books

1. Click the **Delete** button on the book card
2. Confirm the deletion in the popup dialog
3. The book is permanently removed from your collection

### Search and Filtering

#### Smart Search

The search bar at the top of the collection page provides instant results:

- **Title Search**: Find books by title (partial matches supported)
- **Author Search**: Search by author name
- **Real-time Results**: See results as you type
- **Case Insensitive**: Search works regardless of capitalization

#### Genre Filtering

The **Genre Filter** panel offers powerful filtering options:

**Filter Controls:**
- **Genre Selection**: Click genre pills to toggle them on/off
- **Sort Type**: Toggle between 📊 Popular (by book count) and 🔤 A-Z (alphabetical)
- **Sort Direction**: Toggle between ↓ (descending) and ↑ (ascending)
- **Selected First**: Your active filters always appear at the top

**How to Use:**
1. Click on genre names to select/deselect them
2. Selected genres appear highlighted in teal
3. Use the sort controls to organize genres by popularity or alphabetically
4. The book list updates automatically based on your selections

#### Advanced Filtering

**Rating Filter:**
- Use the rating filter to show only books with specific ratings
- Filter by minimum or maximum rating values
- Combine with other filters for precise results

**Multiple Filters:**
- Combine search, genre filters, and rating filters
- All filters work together to narrow your results
- Clear individual filters or reset all at once

#### Results Display

The **Results Bar** shows your current filter status:
- **Total Count**: "Showing X books" or "Showing X-Y of Z books"  
- **Active Filters**: Displays current search terms and genre selections
- **Clear Options**: Quick links to clear specific filters

### Analytics and Statistics

#### Statistics Dashboard

Access detailed insights about your collection via the **Statistics** page:

**Overview Cards:**
- **Total Books**: Complete count of books in your library
- **Average Rating**: Your overall rating average (displayed as decimal, e.g., 4.2/5)
- **Total Genres**: Number of unique genres in your collection
- **Recent Additions**: Count of recently added books

#### Genre Distribution Chart

**Visual Analysis:**
- **Interactive Bar Chart**: Shows books per genre with hover details
- **Color Coding**: Consistent colors for each genre across the application
- **Sorting Options**: Chart data sorted by book count (most popular first)
- **Responsive Design**: Chart adapts to different screen sizes

**Chart Features:**
- **Hover Tooltips**: Show exact book count and percentage for each genre
- **Dark Theme Integration**: Chart colors match the application's dark theme
- **Real-time Updates**: Chart reflects changes as you add/remove books

#### Recent Books Section

**Latest Additions:**
- Shows your most recently added books
- Displays title, author, and date added
- Quick links to view or edit recent books
- Automatically updates when you add new books

### Data Management

#### CSV Export/Import

**Exporting Your Collection:**
1. Go to the Book Collection page
2. Click **"Export Collection"** (if you have books)
3. A CSV file downloads automatically with filename like `books-export-20250907.csv`
4. File includes all book data: Title, Author, Genres, PublishedDate, Rating, Edition, ISBN

**Import Template:**
1. If your collection is empty, click **"Download Import Template"**
2. Template includes helpful comments explaining the format:
   - Required fields vs optional fields
   - Date format (YYYY-MM-DD)
   - Rating range (1-5)
   - Genre format (comma-separated)

**CSV Format Requirements:**
```csv
Title,Author,Genres,PublishedDate,Rating,Edition,ISBN
"Clean Code","Robert C. Martin","Programming,Software Development","2008-08-11",5,"1st Edition","978-0132350884"
"The Great Gatsby","F. Scott Fitzgerald","Fiction,Classic","1925-04-10",4,"","978-0743273565"
```

**Important Notes:**
- Use double quotes around values containing commas
- Genres should be comma-separated within the cell
- Dates must be in YYYY-MM-DD format
- Ratings must be integers from 1 to 5
- Empty optional fields can be left as empty strings

#### Duplicate Detection

**Smart Import Protection:**
- System automatically detects duplicate books during import
- Matching is based on Title and Author combination
- Duplicates are skipped and reported in the import summary
- No existing books are overwritten during import

**Import Results:**
After importing, you'll see a summary showing:
- Number of books successfully imported
- Number of duplicates skipped
- Total number of records processed
- List of skipped books with reasons

### User Account Management

#### Profile Settings

Access your profile via the user menu (top-right):

**Account Information:**
- View your username and email
- See account creation date
- Check login session status

**Password Management:**
- Current password required for changes
- New password must meet security requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

#### Data Privacy

**Your Data Security:**
- All your books are completely private to your account
- No other users can see your collection or statistics
- Data isolation is enforced at the database level
- Secure JWT authentication protects all operations

**Session Management:**
- Login sessions expire after 24 hours for security
- You'll be automatically logged out after expiration
- Simply log back in to continue using the application

## Tips and Best Practices

### Organizing Your Collection

**Genre Strategy:**
- Start with broad categories: Fiction, Non-Fiction, Science, etc.
- Add specific sub-genres as your collection grows: Mystery, Biography, Programming
- Be consistent with genre naming (e.g., always use "Science Fiction" not "Sci-Fi")
- Don't over-categorize - 2-3 genres per book is usually sufficient

**Rating System:**
- Use the full 1-5 range to get meaningful statistics
- Consider your personal scale: 5=loved it, 4=liked it, 3=okay, 2=didn't like, 1=hated it
- Be consistent with your rating criteria over time
- Remember: ratings help generate better statistics and recommendations

**Data Entry Tips:**
- Include ISBN when available for better book identification
- Use edition information for textbooks and revised editions
- Be consistent with author name formatting (e.g., "Last, First" or "First Last")
- Include publication year to track reading timeline

### Using Search Effectively

**Quick Find Techniques:**
- Use partial titles: search "clean" to find "Clean Code"
- Author last names work well: "martin" finds "Robert C. Martin"
- Combine search with genre filters for precise results
- Use the rating filter to find your favorites quickly

**Advanced Search Patterns:**
- Search for series: "Harry Potter" finds all books in the series
- Publisher searches: include publisher names in author field if needed
- Topic searches: use genres to group technical books, fiction types, etc.

### Managing Large Collections

**Performance Tips:**
- Use filters to manage large libraries (100+ books)
- Export your data regularly as backup
- Consider breaking very large collections into multiple accounts if needed
- Use the statistics page to identify collection patterns

**Organization Strategies:**
- Create genre hierarchies: Fiction > Mystery > Cozy Mystery
- Use consistent naming conventions
- Regular cleanup: remove books you no longer own
- Update ratings as your opinions change over time

## Troubleshooting

### Common Issues

**Login Problems:**
- Clear your browser cache and cookies
- Check that Caps Lock is off
- Try incognito/private browsing mode
- Contact support if password reset doesn't work

**Import Issues:**
- Verify CSV file format matches the template
- Check for special characters in book titles/authors
- Ensure file size is under 10MB
- Use UTF-8 encoding for international characters

**Performance Issues:**
- Close other browser tabs to free memory
- Clear browser cache regularly
- Use latest version of Chrome, Firefox, or Safari
- Check your internet connection stability

**Data Sync Issues:**
- Refresh the page if data appears stale
- Log out and log back in to refresh session
- Check if you're connected to the internet
- Try different browser if issues persist

### Getting Help

**Self-Help Resources:**
- Check this user guide for feature explanations
- Review error messages carefully - they often indicate the solution
- Try the same operation in incognito mode to rule out browser issues
- Check your internet connection and try again

**Contact Information:**
- For technical issues, provide specific error messages
- Include steps to reproduce the problem
- Mention your browser type and version
- Describe what you expected vs what actually happened

## Keyboard Shortcuts

### Navigation
- **Tab**: Navigate between form fields and buttons
- **Enter**: Submit forms or activate focused buttons
- **Escape**: Close modal dialogs and popups
- **Arrow Keys**: Navigate between interactive elements

### Search and Filtering
- **Ctrl/Cmd + F**: Focus on the search box (when available)
- **Enter**: Apply search filter
- **Escape**: Clear search box

### Accessibility Features

The Book Library application is designed to be accessible to all users:

- **Screen Reader Support**: All images and controls have appropriate labels
- **Keyboard Navigation**: Complete functionality available via keyboard
- **High Contrast**: Dark theme provides excellent contrast ratios
- **Focus Indicators**: Clear visual indicators show keyboard focus
- **ARIA Labels**: Proper semantic markup for assistive technologies

---

This user guide covers all the major features of the Book Library application. The interface is designed to be intuitive, but don't hesitate to explore and experiment with different features. Your personal library will grow more valuable as you add more books and develop your organization system.

Happy reading and organizing! 📚