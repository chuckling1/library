using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace LibraryApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Books",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Author = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    PublishedDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Rating = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    Edition = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Isbn = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Books", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Genres",
                columns: table => new
                {
                    Name = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    IsSystemGenre = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Genres", x => x.Name);
                });

            migrationBuilder.CreateTable(
                name: "BookGenres",
                columns: table => new
                {
                    BookId = table.Column<Guid>(type: "TEXT", nullable: false),
                    GenreName = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookGenres", x => new { x.BookId, x.GenreName });
                    table.ForeignKey(
                        name: "FK_BookGenres_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookGenres_Genres_GenreName",
                        column: x => x.GenreName,
                        principalTable: "Genres",
                        principalColumn: "Name",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Genres",
                columns: new[] { "Name", "CreatedAt", "IsSystemGenre" },
                values: new object[,]
                {
                    { "Biography", new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1046), true },
                    { "Fantasy", new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1050), true },
                    { "Fiction", new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(923), true },
                    { "History", new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1047), true },
                    { "Mystery", new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1049), true },
                    { "Non-Fiction", new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1043), true },
                    { "Romance", new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1048), true },
                    { "Science", new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1045), true },
                    { "Self-Help", new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1051), true },
                    { "Technology", new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1046), true }
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookGenres_GenreName",
                table: "BookGenres",
                column: "GenreName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookGenres");

            migrationBuilder.DropTable(
                name: "Books");

            migrationBuilder.DropTable(
                name: "Genres");
        }
    }
}
