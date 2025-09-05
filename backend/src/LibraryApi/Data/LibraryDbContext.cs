// <copyright file="LibraryDbContext.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Data;

using LibraryApi.Models;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Database context for the Library API.
/// </summary>
public class LibraryDbContext : DbContext
{
    /// <summary>
    /// Initializes a new instance of the <see cref="LibraryDbContext"/> class.
    /// </summary>
    /// <param name="options">The database context options.</param>
    public LibraryDbContext(DbContextOptions<LibraryDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Gets or sets the books DbSet.
    /// </summary>
    public DbSet<Book> Books { get; set; } = null!;

    /// <summary>
    /// Gets or sets the genres DbSet.
    /// </summary>
    public DbSet<Genre> Genres { get; set; } = null!;

    /// <summary>
    /// Gets or sets the book genres junction table DbSet.
    /// </summary>
    public DbSet<BookGenre> BookGenres { get; set; } = null!;

    /// <summary>
    /// Saves changes to the database with automatic timestamp updates.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The number of entities written to the database.</returns>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = this.ChangeTracker.Entries<Book>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.Id = Guid.NewGuid();
            }

            entry.Entity.UpdatedAt = DateTime.UtcNow;
        }

        var genreEntries = this.ChangeTracker.Entries<Genre>()
            .Where(e => e.State == EntityState.Added);

        foreach (var entry in genreEntries)
        {
            entry.Entity.CreatedAt = DateTime.UtcNow;
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Configures the model relationships and constraints.
    /// </summary>
    /// <param name="modelBuilder">The model builder.</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Book entity
        modelBuilder.Entity<Book>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Title).IsRequired().HasMaxLength(255);
            entity.Property(b => b.Author).IsRequired().HasMaxLength(255);
            entity.Property(b => b.Edition).HasMaxLength(100);
            entity.Property(b => b.Isbn).HasMaxLength(20);
            entity.Property(b => b.Rating).HasDefaultValue(1);
        });

        // Configure Genre entity
        modelBuilder.Entity<Genre>(entity =>
        {
            entity.HasKey(g => g.Name);
            entity.Property(g => g.Name).HasMaxLength(50);
            entity.Property(g => g.IsSystemGenre).HasDefaultValue(false);
        });

        // Configure BookGenre junction table
        modelBuilder.Entity<BookGenre>(entity =>
        {
            entity.HasKey(bg => new { bg.BookId, bg.GenreName });

            entity.HasOne(bg => bg.Book)
                  .WithMany(b => b.BookGenres)
                  .HasForeignKey(bg => bg.BookId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(bg => bg.Genre)
                  .WithMany(g => g.BookGenres)
                  .HasForeignKey(bg => bg.GenreName)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed system genres
        var seedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        modelBuilder.Entity<Genre>().HasData(
            new Genre { Name = "Fiction", IsSystemGenre = true, CreatedAt = seedDate },
            new Genre { Name = "Non-Fiction", IsSystemGenre = true, CreatedAt = seedDate },
            new Genre { Name = "Science", IsSystemGenre = true, CreatedAt = seedDate },
            new Genre { Name = "Technology", IsSystemGenre = true, CreatedAt = seedDate },
            new Genre { Name = "Biography", IsSystemGenre = true, CreatedAt = seedDate },
            new Genre { Name = "History", IsSystemGenre = true, CreatedAt = seedDate },
            new Genre { Name = "Romance", IsSystemGenre = true, CreatedAt = seedDate },
            new Genre { Name = "Mystery", IsSystemGenre = true, CreatedAt = seedDate },
            new Genre { Name = "Fantasy", IsSystemGenre = true, CreatedAt = seedDate },
            new Genre { Name = "Self-Help", IsSystemGenre = true, CreatedAt = seedDate });
    }
}
