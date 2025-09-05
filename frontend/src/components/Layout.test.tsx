import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Layout from './Layout';

// Mock useLocation hook for route testing
const mockUseLocation = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: (): { pathname: string } => mockUseLocation(),
  };
});

// Mock the logo import to avoid file loading issues in tests
vi.mock('../images/logo.png', () => ({
  default: '/test-logo.png',
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}): React.ReactElement => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

// Helper function to render Layout with test children
const renderLayout = (
  children: React.ReactNode = <div>Test Content</div>,
  pathname = '/books'
): ReturnType<typeof render> => {
  mockUseLocation.mockReturnValue({ pathname });
  return render(
    <TestWrapper>
      <Layout>{children}</Layout>
    </TestWrapper>
  );
};

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders header with logo and title', () => {
      renderLayout();

      // Check header structure
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('header');

      // Check logo image
      const logo = screen.getByAltText('Library Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveClass('header-logo');
      expect(logo).toHaveAttribute('src', '/test-logo.png');

      // Check title
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('My Book Library');
    });

    it('renders navigation with Books and Statistics links', () => {
      renderLayout();

      // Check navigation structure
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveClass('nav');

      // Check Books link
      const booksLink = screen.getByRole('link', { name: 'Books' });
      expect(booksLink).toBeInTheDocument();
      expect(booksLink).toHaveAttribute('href', '/books');

      // Check Statistics link
      const statsLink = screen.getByRole('link', { name: 'Statistics' });
      expect(statsLink).toBeInTheDocument();
      expect(statsLink).toHaveAttribute('href', '/stats');
    });

    it('renders footer with Open Library attribution', () => {
      renderLayout();

      // Check footer structure
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('footer');

      // Check attribution text
      expect(screen.getByText('Book data provided by')).toBeInTheDocument();

      // Check Open Library link
      const openLibraryLink = screen.getByRole('link', {
        name: 'Open Library',
      });
      expect(openLibraryLink).toBeInTheDocument();
      expect(openLibraryLink).toHaveAttribute(
        'href',
        'https://openlibrary.org'
      );
      expect(openLibraryLink).toHaveAttribute('target', '_blank');
      expect(openLibraryLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(openLibraryLink).toHaveClass('attribution-link');
    });

    it('renders children content in main area', () => {
      const testContent = <div>Custom Test Content</div>;
      renderLayout(testContent);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('main-content');
      expect(screen.getByText('Custom Test Content')).toBeInTheDocument();
    });

    it('applies correct CSS classes to layout structure', () => {
      const { container } = renderLayout();

      // Check app container
      const app = container.querySelector('.app');
      expect(app).toBeInTheDocument();

      // Check header structure
      expect(container.querySelector('.header')).toBeInTheDocument();
      expect(container.querySelector('.header-content')).toBeInTheDocument();
      expect(container.querySelector('.header-brand')).toBeInTheDocument();
      expect(container.querySelector('.header-logo')).toBeInTheDocument();
      expect(container.querySelector('.nav')).toBeInTheDocument();
      expect(container.querySelector('.header-spacer')).toBeInTheDocument();

      // Check main content
      expect(container.querySelector('.main-content')).toBeInTheDocument();

      // Check footer structure
      expect(container.querySelector('.footer')).toBeInTheDocument();
      expect(container.querySelector('.footer-content')).toBeInTheDocument();
      expect(container.querySelector('.attribution')).toBeInTheDocument();
    });
  });

  describe('Navigation Active States', () => {
    it('applies active class to Books link when on /books route', () => {
      renderLayout(<div>Books Page</div>, '/books');

      const booksLink = screen.getByRole('link', { name: 'Books' });
      const statsLink = screen.getByRole('link', { name: 'Statistics' });

      expect(booksLink).toHaveClass('active');
      expect(statsLink).not.toHaveClass('active');
    });

    it('applies active class to Statistics link when on /stats route', () => {
      renderLayout(<div>Stats Page</div>, '/stats');

      const booksLink = screen.getByRole('link', { name: 'Books' });
      const statsLink = screen.getByRole('link', { name: 'Statistics' });

      expect(statsLink).toHaveClass('active');
      expect(booksLink).not.toHaveClass('active');
    });

    it('removes active class from both links when on different route', () => {
      renderLayout(<div>Other Page</div>, '/other');

      const booksLink = screen.getByRole('link', { name: 'Books' });
      const statsLink = screen.getByRole('link', { name: 'Statistics' });

      expect(booksLink).not.toHaveClass('active');
      expect(statsLink).not.toHaveClass('active');
    });

    it('handles root path correctly (no active states)', () => {
      renderLayout(<div>Home Page</div>, '/');

      const booksLink = screen.getByRole('link', { name: 'Books' });
      const statsLink = screen.getByRole('link', { name: 'Statistics' });

      expect(booksLink).not.toHaveClass('active');
      expect(statsLink).not.toHaveClass('active');
    });

    it('handles nested paths correctly (exact match only)', () => {
      renderLayout(<div>Edit Book Page</div>, '/books/123/edit');

      const booksLink = screen.getByRole('link', { name: 'Books' });
      const statsLink = screen.getByRole('link', { name: 'Statistics' });

      // Should not be active for nested paths - requires exact match
      expect(booksLink).not.toHaveClass('active');
      expect(statsLink).not.toHaveClass('active');
    });
  });

  describe('isActive Function Logic', () => {
    it('correctly identifies active route for /books', () => {
      renderLayout(<div>Books Page</div>, '/books');

      const booksLink = screen.getByRole('link', { name: 'Books' });
      expect(booksLink).toHaveClass('active');
    });

    it('correctly identifies active route for /stats', () => {
      renderLayout(<div>Stats Page</div>, '/stats');

      const statsLink = screen.getByRole('link', { name: 'Statistics' });
      expect(statsLink).toHaveClass('active');
    });

    it('returns false for non-matching paths', () => {
      renderLayout(<div>Other Page</div>, '/other-path');

      const booksLink = screen.getByRole('link', { name: 'Books' });
      const statsLink = screen.getByRole('link', { name: 'Statistics' });

      expect(booksLink).not.toHaveClass('active');
      expect(statsLink).not.toHaveClass('active');
    });

    it('performs exact path matching (not partial)', () => {
      renderLayout(<div>Books Detail</div>, '/books/detail');

      const booksLink = screen.getByRole('link', { name: 'Books' });
      // Should not be active for /books/detail when expecting /books exactly
      expect(booksLink).not.toHaveClass('active');
    });
  });

  describe('Route Integration', () => {
    it('updates active state when location changes from /books to /stats', () => {
      // Test /books route
      const { unmount } = renderLayout(<div>Books Page</div>, '/books');

      const booksLink = screen.getByRole('link', { name: 'Books' });
      const statsLink = screen.getByRole('link', { name: 'Statistics' });

      expect(booksLink).toHaveClass('active');
      expect(statsLink).not.toHaveClass('active');

      unmount();

      // Test /stats route in clean environment
      renderLayout(<div>Stats Page</div>, '/stats');

      const newBooksLink = screen.getByRole('link', { name: 'Books' });
      const newStatsLink = screen.getByRole('link', { name: 'Statistics' });

      expect(newBooksLink).not.toHaveClass('active');
      expect(newStatsLink).toHaveClass('active');
    });

    it('handles multiple route transitions correctly', () => {
      // Test /books route
      const { unmount: unmount1 } = renderLayout(<div>Books</div>, '/books');
      expect(screen.getByRole('link', { name: 'Books' })).toHaveClass('active');
      unmount1();

      // Test /stats route
      const { unmount: unmount2 } = renderLayout(<div>Stats</div>, '/stats');
      expect(screen.getByRole('link', { name: 'Statistics' })).toHaveClass(
        'active'
      );
      expect(screen.getByRole('link', { name: 'Books' })).not.toHaveClass(
        'active'
      );
      unmount2();

      // Test other route
      renderLayout(<div>Other</div>, '/other');
      expect(screen.getByRole('link', { name: 'Books' })).not.toHaveClass(
        'active'
      );
      expect(screen.getByRole('link', { name: 'Statistics' })).not.toHaveClass(
        'active'
      );
    });

    it('properly integrates with useLocation hook', () => {
      // Test /books path
      const { unmount: unmount1 } = renderLayout(<div>Books</div>, '/books');
      expect(screen.getByRole('link', { name: 'Books' })).toHaveClass('active');
      expect(screen.getByRole('link', { name: 'Statistics' })).not.toHaveClass(
        'active'
      );
      unmount1();

      // Test /stats path
      const { unmount: unmount2 } = renderLayout(<div>Stats</div>, '/stats');
      expect(screen.getByRole('link', { name: 'Statistics' })).toHaveClass(
        'active'
      );
      expect(screen.getByRole('link', { name: 'Books' })).not.toHaveClass(
        'active'
      );
      unmount2();

      // Test unknown path
      renderLayout(<div>Unknown</div>, '/unknown');
      expect(screen.getByRole('link', { name: 'Books' })).not.toHaveClass(
        'active'
      );
      expect(screen.getByRole('link', { name: 'Statistics' })).not.toHaveClass(
        'active'
      );
    });
  });

  describe('Header Brand Structure', () => {
    it('contains header brand with logo and title in correct order', () => {
      renderLayout();

      const headerBrand = screen
        .getByRole('banner')
        .querySelector('.header-brand');
      expect(headerBrand).toBeInTheDocument();

      // Check that logo comes before title in DOM order
      const logo = screen.getByAltText('Library Logo');
      const title = screen.getByRole('heading', { level: 1 });

      // Get all children of header-brand and verify order
      const brandChildren = Array.from(headerBrand?.children ?? []);
      const logoIndex = brandChildren.indexOf(logo);
      const titleIndex = brandChildren.indexOf(title);

      expect(logoIndex).toBeLessThan(titleIndex);
    });

    it('includes header spacer for layout purposes', () => {
      const { container } = renderLayout();

      const spacer = container.querySelector('.header-spacer');
      expect(spacer).toBeInTheDocument();
    });
  });

  describe('Footer Attribution', () => {
    it('contains proper attribution text structure', () => {
      renderLayout();

      const attribution = screen.getByText('Book data provided by');
      expect(attribution.closest('.attribution')).toBeInTheDocument();
      expect(attribution.closest('.footer-content')).toBeInTheDocument();
    });

    it('has external link with security attributes', () => {
      renderLayout();

      const link = screen.getByRole('link', { name: 'Open Library' });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('uses correct link styling class', () => {
      renderLayout();

      const link = screen.getByRole('link', { name: 'Open Library' });
      expect(link).toHaveClass('attribution-link');
    });
  });

  describe('Accessibility', () => {
    it('uses proper semantic HTML elements', () => {
      renderLayout();

      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav
      expect(screen.getByRole('main')).toBeInTheDocument(); // main
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument(); // h1
    });

    it('provides descriptive alt text for logo', () => {
      renderLayout();

      const logo = screen.getByAltText('Library Logo');
      expect(logo).toBeInTheDocument();
    });

    it('uses proper link text for navigation', () => {
      renderLayout();

      expect(screen.getByRole('link', { name: 'Books' })).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Statistics' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Open Library' })
      ).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('renders text content correctly', () => {
      const textContent = 'Simple text content';
      renderLayout(textContent);

      expect(screen.getByText(textContent)).toBeInTheDocument();
    });

    it('renders complex JSX content correctly', () => {
      const complexContent = (
        <div>
          <h2>Page Title</h2>
          <p>Page description</p>
          <button>Action Button</button>
        </div>
      );
      renderLayout(complexContent);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Page Title'
      );
      expect(screen.getByText('Page description')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Action Button' })
      ).toBeInTheDocument();
    });

    it('renders multiple child components correctly', () => {
      const multipleChildren = (
        <>
          <div data-testid="child1">First Child</div>
          <div data-testid="child2">Second Child</div>
          <div data-testid="child3">Third Child</div>
        </>
      );
      renderLayout(multipleChildren);

      expect(screen.getByTestId('child1')).toHaveTextContent('First Child');
      expect(screen.getByTestId('child2')).toHaveTextContent('Second Child');
      expect(screen.getByTestId('child3')).toHaveTextContent('Third Child');
    });
  });
});
