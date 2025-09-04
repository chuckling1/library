using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LibraryApi.Migrations
{
    /// <inheritdoc />
    public partial class ConvertPublishedDateToString : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Convert existing DateTime records to appropriate string format
            // Pattern: If date is YYYY-01-01T00:00:00, convert to just YYYY (year only)
            // Otherwise, convert to YYYY-MM-DD format (remove time component)
            
            migrationBuilder.Sql(@"
                UPDATE Books 
                SET PublishedDate = CASE 
                    WHEN PublishedDate LIKE '____-01-01T%' THEN SUBSTR(PublishedDate, 1, 4)
                    ELSE DATE(PublishedDate)
                END 
                WHERE PublishedDate IS NOT NULL
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Convert string dates back to DateTime format for rollback
            migrationBuilder.Sql(@"
                UPDATE Books 
                SET PublishedDate = CASE 
                    WHEN LENGTH(PublishedDate) = 4 THEN PublishedDate || '-01-01T00:00:00'
                    WHEN LENGTH(PublishedDate) = 10 THEN PublishedDate || 'T00:00:00'
                    ELSE PublishedDate
                END 
                WHERE PublishedDate IS NOT NULL
            ");
        }
    }
}
